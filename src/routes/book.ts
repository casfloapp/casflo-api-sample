import { Hono } from 'hono';
import { BookController } from '@/controllers';
import { 
  queryValidationMiddleware, 
  validationMiddleware,
  cacheMiddleware
} from '@/middleware';
import { 
  bookQuerySchema, 
  createBookSchema,
  bookIdSchema
} from '@/types/schemas';

const bookRoutes = new Hono();

# Get all books with caching
bookRoutes.get('/', 
  queryValidationMiddleware(bookQuerySchema),
  cacheMiddleware(
    (c) => `books:list:${JSON.stringify(c.get('validatedQuery'))}`,
    300 # 5 minutes cache
  ),
  BookController.getBooks
);

# Get single book with caching
bookRoutes.get('/:bookId',
  queryValidationMiddleware(bookIdSchema.pick({ bookId: true })),
  cacheMiddleware(
    (c) => `book:${c.req.param('bookId')}`,
    180 # 3 minutes cache
  ),
  BookController.getBookById
);

# Create book
bookRoutes.post('/',
  validationMiddleware(createBookSchema),
  BookController.createBook
);

export default bookRoutes;