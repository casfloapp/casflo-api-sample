import { Context, Env } from '@/types';
import { ResponseUtils, Logger, Utils } from '@/utils';

# Request logging middleware
export async function requestLoggingMiddleware(c: any, next: any) {
  const requestId = Utils.generateRequestId();
  const startTime = Date.now();
  
  # Set request context
  c.set('requestId', requestId);
  Logger.setRequestId(requestId);

  const method = c.req.method;
  const url = c.req.url;
  const userAgent = c.req.header('User-Agent');
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  Logger.info('Request started', {
    method,
    url,
    userAgent,
    ip
  });

  try {
    await next();
    
    const duration = Date.now() - startTime;
    const statusCode = c.res?.status || 200;

    Logger.performance('request_completed', duration, {
      method,
      url,
      statusCode,
      ip
    });

    # Add performance headers
    c.header('X-Response-Time', `${duration}ms`);
    c.header('X-Request-ID', requestId);

  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error('Request failed', error as Error, {
      method,
      url,
      duration,
      ip
    });
    throw error;
  }
}

# CORS middleware
export async function corsMiddleware(c: any, next: any) {
  const origin = c.req.header('Origin');
  const allowedOrigins = [
    'https://app.casflo.id',
    'https://casflo.id',
    'http://localhost:3000',
    'http://localhost:8787',
    'http://127.0.0.1:8787'
  ];

  # Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    const headers = new Headers();
    
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      headers.set('Access-Control-Allow-Origin', '*');
    }
    
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    return new Response(null, { headers });
  }

  await next();

  # Add CORS headers to response
  const response = c.res;
  if (response && origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
}

# Error handling middleware
export async function errorHandlerMiddleware(c: any, next: any) {
  try {
    await next();
  } catch (error) {
    const requestId = c.get('requestId');
    Logger.setRequestId(requestId);

    if (error instanceof Error) {
      # Handle custom application errors
      if (error.name === 'ValidationError') {
        return ResponseUtils.validationError({ general: [error.message] });
      }

      if (error.name === 'NotFoundError') {
        return ResponseUtils.notFound(error.message.replace(' not found', ''));
      }

      if (error.name === 'DatabaseError') {
        Logger.error('Database error', error);
        return ResponseUtils.error(
          c.env.ENVIRONMENT === 'development' ? error.message : 'Database operation failed',
          500,
          'DATABASE_ERROR'
        );
      }

      # Log unexpected errors
      Logger.error('Unexpected error', error);
      
      # Return generic error for unexpected issues
      return ResponseUtils.error(
        c.env.ENVIRONMENT === 'development' ? error.message : 'Internal server error',
        500
      );
    }

    # Handle non-Error exceptions
    Logger.error('Non-Error exception', new Error(String(error)));
    
    return ResponseUtils.error('An unexpected error occurred', 500);
  }
}

# Validation middleware
export function validationMiddleware(schema: any) {
  return async (c: any, next: any) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);
      
      if (!result.success) {
        const errors: Record<string, string[]> = {};
        
        result.error.issues.forEach((issue: any) => {
          const path = issue.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        });
        
        return ResponseUtils.validationError(errors);
      }
      
      # Set validated data
      c.set('validatedData', result.data);
      
      await next();
    } catch (error) {
      # Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        return ResponseUtils.error('Invalid JSON in request body', 400, 'INVALID_JSON');
      }
      
      throw error;
    }
  };
}

# Query validation middleware
export function queryValidationMiddleware(schema: any) {
  return async (c: any, next: any) => {
    const query = Object.fromEntries(c.req.queries());
    const result = schema.safeParse(query);
    
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      
      result.error.issues.forEach((issue: any) => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      
      return ResponseUtils.validationError(errors);
    }
    
    # Set validated query
    c.set('validatedQuery', result.data);
    
    await next();
  };
}

# Cache middleware
export function cacheMiddleware(
  keyGenerator: (c: any) => string,
  ttl: number = 300
) {
  return async (c: any, next: any) => {
    if (!c.env.CACHE) {
      return await next();
    }

    const cacheKey = keyGenerator(c);
    
    try {
      # Try to get from cache
      const cached = await c.env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        Logger.info('Cache hit', { key: cacheKey });
        
        return new Response(JSON.stringify({
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            cached: true
          }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        });
      }

      Logger.info('Cache miss', { key: cacheKey });

      # Execute request
      await next();

      # Cache successful responses
      const response = c.res;
      if (response && response.status === 200) {
        const responseText = await response.text();
        await c.env.CACHE.put(cacheKey, responseText, {
          expirationTtl: ttl
        });

        # Return new response with cache header
        return new Response(responseText, {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS'
          }
        });
      }
    } catch (error) {
      Logger.error('Cache middleware error', error as Error);
      # Continue without cache if there's an error
      await next();
    }
  };
}

# Book membership middleware
export async function bookMembershipMiddleware(c: any, next: any) {
  const { bookId } = c.req.param();
  
  if (!bookId) {
    return ResponseUtils.error('Book ID is required', 400);
  }

  try {
    const { BookModel } = await import('@/models');
    const member = await BookModel.checkMembership(c.env.DB, bookId, c.get('user')?.id);
    
    if (!member) {
      return ResponseUtils.error('You are not a member of this book', 403, 'FORBIDDEN');
    }

    # Set member context
    c.set('member', member);
    
    await next();
  } catch (error) {
    Logger.error('Book membership check failed', error as Error);
    return ResponseUtils.error('Failed to verify book membership', 500);
  }
}