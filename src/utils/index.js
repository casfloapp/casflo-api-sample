// Performance monitoring
export class Performance {
  static startTimer() {
    return Date.now();
  }

  static getDuration(startTime) {
    return Date.now() - startTime;
  }

  static formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

// Response utilities
export const ResponseUtils = {
  success: (data, message = 'Success', status = 200) => ({
    success: true,
    message,
    data,
    status
  }),

  error: (message, status = 500, code = 'ERROR') => ({
    success: false,
    error: message,
    code,
    status
  }),

  paginated: (data, pagination, message = 'Success') => ({
    success: true,
    message,
    data,
    pagination
  })
};

// Logger utility
export class Logger {
  static info(message, meta = {}) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }

  static error(message, error = null, meta = {}) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }

  static warn(message, meta = {}) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
}

// Database utilities
export class DatabaseUtils {
  static async executeQuery(db, query, params = []) {
    try {
      const startTime = Performance.startTimer();
      const result = await db.prepare(query).bind(...params).all();
      const duration = Performance.getDuration(startTime);
      
      Logger.info('Database query executed', {
        query: query.substring(0, 100),
        duration: Performance.formatDuration(duration),
        resultCount: result.results?.length || 0
      });
      
      return result;
    } catch (error) {
      Logger.error('Database query failed', error, { query });
      throw new DatabaseError(`Database operation failed: ${error.message}`);
    }
  }

  static async executeGet(db, query, params = []) {
    try {
      const startTime = Performance.startTimer();
      const result = await db.prepare(query).bind(...params).first();
      const duration = Performance.getDuration(startTime);
      
      Logger.info('Database get executed', {
        query: query.substring(0, 100),
        duration: Performance.formatDuration(duration),
        found: !!result
      });
      
      return result;
    } catch (error) {
      Logger.error('Database get failed', error, { query });
      throw new DatabaseError(`Database operation failed: ${error.message}`);
    }
  }

  static async executeRun(db, query, params = []) {
    try {
      const startTime = Performance.startTimer();
      const result = await db.prepare(query).bind(...params).run();
      const duration = Performance.getDuration(startTime);
      
      Logger.info('Database run executed', {
        query: query.substring(0, 100),
        duration: Performance.formatDuration(duration),
        changes: result.changes,
        lastRowId: result.meta?.last_row_id
      });
      
      return result;
    } catch (error) {
      Logger.error('Database run failed', error, { query });
      throw new DatabaseError(`Database operation failed: ${error.message}`);
    }
  }
}

// General utilities
export class Utils {
  static generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  static isValidUUID(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  static sanitizeString(str) {
    return str?.trim().replace(/[<>]/g, '');
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static async withTimeout(promise, timeoutMs = 30000) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
}

// Cache utilities
export class CacheUtils {
  static getCacheKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  static async get(cache, key) {
    try {
      const cached = await cache.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      Logger.warn('Cache get failed', { key, error: error.message });
      return null;
    }
  }

  static async set(cache, key, value, ttl = 300) {
    try {
      await cache.put(key, JSON.stringify(value), { expirationTtl: ttl });
      return true;
    } catch (error) {
      Logger.warn('Cache set failed', { key, error: error.message });
      return false;
    }
  }

  static async delete(cache, key) {
    try {
      await cache.delete(key);
      return true;
    } catch (error) {
      Logger.warn('Cache delete failed', { key, error: error.message });
      return false;
    }
  }

  static async clear(cache, pattern) {
    try {
      const list = await cache.list({ prefix: pattern });
      const deletePromises = list.keys.map(key => cache.delete(key.name));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      Logger.warn('Cache clear failed', { pattern, error: error.message });
      return false;
    }
  }
}

export default {
  Performance,
  ResponseUtils,
  Logger,
  DatabaseUtils,
  Utils,
  CacheUtils
};