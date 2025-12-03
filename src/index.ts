import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  requestLoggingMiddleware, 
  corsMiddleware, 
  errorHandlerMiddleware 
} from '@/middleware';
import { bookRoutes } from '@/routes';

const app = new Hono().basePath('/api/v1');

# Global middleware
app.use('*', requestLoggingMiddleware);
app.use('*', corsMiddleware);
app.use('*', errorHandlerMiddleware);

# CORS configuration
app.use('*', cors({
  origin: [
    'https://app.casflo.id',
    'https://casflo.id', 
    'http://localhost:3000',
    'http://localhost:8787',
    'http://127.0.0.1:8787'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

# Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Casflo API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown'
  });
});

# API info endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Welcome to Casflo API v1',
    version: '1.0.0',
    documentation: 'https://docs.casflo.id',
    endpoints: {
      health: '/health',
      books: '/books'
    },
    features: {
      caching: !!c.env.CACHE,
      database: 'D1',
      runtime: 'Cloudflare Workers'
    }
  });
});

# Route registration
app.route('/books', bookRoutes);

# 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      availableEndpoints: [
        'GET /api/v1/health',
        'GET /api/v1/books',
        'GET /api/v1/books/search',
        'GET /api/v1/books/:bookId',
        'POST /api/v1/books',
        'PUT /api/v1/books/:bookId',
        'DELETE /api/v1/books/:bookId'
      ]
    }
  }, 404);
});

export default app;