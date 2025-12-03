import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono().basePath('/api/v1');

// CORS configuration
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

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Casflo API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown'
  });
});

// API info endpoint
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

// Get books endpoint
app.get('/books', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const moduleType = c.req.query('module_type');

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (moduleType) {
      conditions.push('b.module_type = ?');
      params.push(moduleType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      ${whereClause}
    `;

    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get books with pagination
    const booksQuery = `
      SELECT 
        b.id,
        b.name,
        b.icon,
        b.module_type,
        b.created_at,
        bm.role
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const booksResult = await c.env.DB.prepare(booksQuery)
      .bind(...params, limit, offset)
      .all();

    const books = booksResult.results || [];

    return c.json({
      success: true,
      data: books,
      meta: {
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit: limit,
          total: total,
          totalPages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to fetch books',
        details: error.message
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// Get single book
app.get('/books/:bookId', async (c) => {
  try {
    const { bookId } = c.req.param();
    
    const book = await c.env.DB.prepare(`
      SELECT 
        b.*,
        bm.role,
        bm.joined_at
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      WHERE b.id = ?
    `).bind(bookId).first();

    if (!book) {
      return c.json({
        success: false,
        error: {
          message: 'Book not found'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, 404);
    }

    return c.json({
      success: true,
      data: book,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to fetch book',
        details: error.message
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// Create book
app.post('/books', async (c) => {
  try {
    const body = await c.req.json();
    const { name, module_type, icon } = body;

    if (!name || !module_type) {
      return c.json({
        success: false,
        error: {
          message: 'Name and module_type are required'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, 400);
    }

    const id = `book-${crypto.randomUUID()}`;
    
    await c.env.DB.prepare(`
      INSERT INTO books (id, name, icon, module_type, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      name,
      icon || '📚',
      module_type,
      'user-1' // Hardcoded for demo
    ).run();

    // Add creator as owner
    await c.env.DB.prepare(`
      INSERT INTO book_members (book_id, user_id, role, joined_at)
      VALUES (?, ?, 'OWNER', datetime('now'))
    `).bind(id, 'user-1').run();

    const createdBook = await c.env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(id).first();

    return c.json({
      success: true,
      data: createdBook,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, 201);
  } catch (error) {
    console.error('Error creating book:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to create book',
        details: error.message
      },
      meta: {
        timestamp: new Date().toISOString()
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
      code: 'NOT_FOUND',
      availableEndpoints: [
        'GET /api/v1/health',
        'GET /api/v1/books',
        'GET /api/v1/books/:bookId',
        'POST /api/v1/books'
      ]
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  }, 404);
});

export default app;