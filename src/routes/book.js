import { Hono } from 'hono';
import { BookController } from '../controllers/book.js';
import { validate, cache, requireMembership } from '../middleware/index.js';
import { BookQuerySchema, IdParamSchema, BookSchema } from '../types/schemas.js';

const bookRoutes = new Hono();

// Initialize controller (will be called with env in routes)
const getController = (c) => new BookController(c.env);

// Basic book listing with caching
bookRoutes.get('/', 
  cache(300), // 5 minutes cache
  validate(BookQuerySchema, 'query'),
  async (c) => {
    const controller = getController(c);
    return controller.getBooks(c);
  }
);

// Advanced search endpoint
bookRoutes.get('/search',
  cache(180), // 3 minutes cache
  validate(BookQuerySchema, 'query'),
  async (c) => {
    const controller = getController(c);
    return controller.getBooks(c);
  }
);

// Get single book with caching
bookRoutes.get('/:id',
  cache(600), // 10 minutes cache
  validate(IdParamSchema, 'param'),
  async (c) => {
    const controller = getController(c);
    return controller.getBookById(c);
  }
);

// Create new book (requires membership)
bookRoutes.post('/',
  requireMembership('basic'),
  validate(BookSchema),
  async (c) => {
    const controller = getController(c);
    return controller.createBook(c);
  }
);

// Update book (requires membership)
bookRoutes.put('/:id',
  requireMembership('basic'),
  validate(IdParamSchema, 'param'),
  async (c) => {
    const controller = getController(c);
    return controller.updateBook(c);
  }
);

// Delete book (requires membership)
bookRoutes.delete('/:id',
  requireMembership('premium'),
  validate(IdParamSchema, 'param'),
  async (c) => {
    const controller = getController(c);
    return controller.deleteBook(c);
  }
);

// Batch operations (require premium membership)
bookRoutes.post('/batch',
  requireMembership('premium'),
  async (c) => {
    const controller = getController(c);
    return controller.createMultipleBooks(c);
  }
);

bookRoutes.put('/batch',
  requireMembership('premium'),
  async (c) => {
    const controller = getController(c);
    return controller.updateMultipleBooks(c);
  }
);

bookRoutes.delete('/batch',
  requireMembership('premium'),
  async (c) => {
    const controller = getController(c);
    return controller.deleteMultipleBooks(c);
  }
);

// Statistics endpoint with caching
bookRoutes.get('/stats/overview',
  cache(900), // 15 minutes cache
  async (c) => {
    const controller = getController(c);
    return controller.getBookStatistics(c);
  }
);

export { bookRoutes };