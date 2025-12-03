import { Book, BookQuery, BookFilters, CacheOptions } from '@/types';

# Utility Functions
export class Utils {
  static generateId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}

# Performance Monitoring
export class Performance {
  private static metrics: Map<string, number> = new Map();

  static startTimer(key: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.metrics.set(key, duration);
      return duration;
    };
  }

  static getMetric(key: string): number | undefined {
    return this.metrics.get(key);
  }

  static getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static clear(): void {
    this.metrics.clear();
  }
}

# Response Utilities
export class ResponseUtils {
  static success<T>(data: T, meta?: any): Response {
    const response: any = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  static created<T>(data: T): Response {
    return new Response(JSON.stringify({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  static error(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ): Response {
    const response: any = {
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(details && { details })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  static notFound(resource: string = 'Resource'): Response {
    return this.error(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static validationError(errors: Record<string, string[]>): Response {
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

# Database Utilities
export class DatabaseUtils {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        # Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await Utils.sleep(delay);
      }
    }

    throw lastError!;
  }

  static formatQueryResult<T>(result: any): T[] {
    return result?.results || [];
  }

  static formatSingleResult<T>(result: any): T | null {
    return result || null;
  }
}

# Logging Utilities
export class Logger {
  private static requestId: string = '';

  static setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  static info(message: string, data?: any): void {
    console.log(JSON.stringify({
      level: 'info',
      requestId: this.requestId,
      message,
      data,
      timestamp: new Date().toISOString()
    }));
  }

  static warn(message: string, data?: any): void {
    console.warn(JSON.stringify({
      level: 'warn',
      requestId: this.requestId,
      message,
      data,
      timestamp: new Date().toISOString()
    }));
  }

  static error(message: string, error?: Error, data?: any): void {
    console.error(JSON.stringify({
      level: 'error',
      requestId: this.requestId,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      data,
      timestamp: new Date().toISOString()
    }));
  }

  static performance(operation: string, duration: number, data?: any): void {
    console.log(JSON.stringify({
      level: 'performance',
      requestId: this.requestId,
      operation,
      duration,
      data,
      timestamp: new Date().toISOString()
    }));
  }
}