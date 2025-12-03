import { Logger, Utils, CacheUtils } from '../utils/index.js';
import { ValidationError, NotFoundError } from '../types/index.js';

// Request logging middleware
export const requestLogger = async (c, next) => {
  const requestId = Utils.generateRequestId();
  const startTime = Date.now();
  
  c.set('requestId', requestId);
  c.set('startTime', startTime);
  
  Logger.info('Request started', {
    requestId,
    method: c.req.method,
    url: c.req.url,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  });
  
  await next();
  
  const duration = Date.now() - startTime;
  Logger.info('Request completed', {
    requestId,
    status: c.res.status,
    duration: `${duration}ms`
  });
};

// Error handling middleware
export const errorHandler = (error, c) => {
  const requestId = c.get('requestId');
  
  Logger.error('Request error', error, { requestId });
  
  if (error instanceof ValidationError) {
    return c.json({
      success: false,
      error: error.message,
      code: error.code,
      requestId
    }, 400);
  }
  
  if (error instanceof NotFoundError) {
    return c.json({
      success: false,
      error: error.message,
      code: error.code,
      requestId
    }, 404);
  }
  
  // Default error response
  return c.json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId
  }, 500);
};

// Validation middleware
export const validate = (schema, source = 'json') => {
  return async (c, next) => {
    try {
      let data;
      
      switch (source) {
        case 'query':
          data = c.req.query();
          break;
        case 'param':
          data = c.req.param();
          break;
        default:
          data = await c.req.json();
      }
      
      const validatedData = schema.parse(data);
      c.set('validatedData', validatedData);
      
      await next();
    } catch (error) {
      throw new ValidationError(error.errors?.[0]?.message || 'Validation failed');
    }
  };
};

// Cache middleware
export const cache = (ttl = 300, keyGenerator) => {
  return async (c, next) => {
    const cache = c.env?.CACHE;
    if (!cache) {
      await next();
      return;
    }
    
    const cacheKey = keyGenerator ? keyGenerator(c) : 
      CacheUtils.getCacheKey('api', c.req.url);
    
    // Try to get from cache
    const cached = await CacheUtils.get(cache, cacheKey);
    if (cached) {
      Logger.info('Cache hit', { key: cacheKey });
      return c.json(cached);
    }
    
    await next();
    
    // Cache the response
    const responseData = await c.res.json();
    await CacheUtils.set(cache, cacheKey, responseData, ttl);
    
    Logger.info('Response cached', { key: cacheKey, ttl });
  };
};

// Rate limiting middleware (basic implementation)
export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return async (c, next) => {
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(clientIp)) {
      const clientRequests = requests.get(clientIp).filter(time => time > windowStart);
      requests.set(clientIp, clientRequests);
    }
    
    const currentRequests = requests.get(clientIp) || [];
    
    if (currentRequests.length >= maxRequests) {
      return c.json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      }, 429);
    }
    
    currentRequests.push(now);
    requests.set(clientIp, currentRequests);
    
    await next();
  };
};

// Membership middleware
export const requireMembership = (requiredLevel = 'basic') => {
  return async (c, next) => {
    const authHeader = c.req.header('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'Authorization token required',
        code: 'AUTH_REQUIRED'
      }, 401);
    }
    
    const token = authHeader.substring(7);
    
    // Here you would validate the token and check membership level
    // For now, we'll just pass through
    c.set('userToken', token);
    c.set('membershipLevel', 'premium'); // Mock value
    
    await next();
  };
};

// Role-based access control
export const requireRole = (requiredRole = 'user') => {
  return async (c, next) => {
    const userRole = c.get('userRole') || 'user';
    
    if (userRole !== requiredRole && userRole !== 'admin') {
      return c.json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }
    
    await next();
  };
};

export default {
  requestLogger,
  errorHandler,
  validate,
  cache,
  rateLimit,
  requireMembership,
  requireRole
};