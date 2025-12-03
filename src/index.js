import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono().basePath('/api/v1');

// CORS middleware
app.use('*', cors({
  origin: ['https://app.casflo.id', 'http://localhost:3000', 'http://localhost:8787'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Casflo API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Welcome to Casflo API v1',
    endpoints: {
      health: '/health',
      books: '/books'
    }
  });
});

// Get books endpoint
app.get('/books', async (c) => {
  try {
    const books = await c.env.DB.prepare(`
      SELECT 
        b.id,
        b.name,
        b.icon,
        b.module_type,
        b.created_at,
        bm.role
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      ORDER BY b.created_at DESC
    `).all();

    return c.json({
      success: true,
      data: books.results || []
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to fetch books',
        details: error.message
      }
    }, 500);
  }
});

// Get single book
app.get('/books/:bookId', async (c) => {
  try {
    const { bookId } = c.req.param();
    
    const book = await c.env.DB.prepare(`
      SELECT * FROM books WHERE id = ?
    `).bind(bookId).first();

    if (!book) {
      return c.json({
        success: false,
        error: {
          message: 'Book not found'
        }
      }, 404);
    }

    return c.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to fetch book',
        details: error.message
      }
    }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    }
  }, 404);
});

export default app;