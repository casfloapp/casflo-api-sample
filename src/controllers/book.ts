import { Context, Env, ApiResponse, PaginatedResponse } from '@/types';
import { BookModel } from '@/models';
import { ResponseUtils, Logger, Performance } from '@/utils';

export class BookController {
  static async getBooks(c: any): Promise<Response> {
    const endTimer = Performance.startTimer('get_books');
    const requestId = c.get('requestId');
    
    try {
      const query = c.get('validatedQuery');

      Logger.info('Fetching books', { query });

      # For demo purposes, return sample data
      const result = {
        books: [
          {
            id: 'book-1',
            name: 'Personal Finance',
            icon: '💰',
            module_type: 'PERSONAL' as const,
            created_by: 'user-1',
            created_at: new Date().toISOString(),
            role: 'OWNER' as const
          },
          {
            id: 'book-2',
            name: 'Business Expenses',
            icon: '💼',
            module_type: 'BUSINESS' as const,
            created_by: 'user-2',
            created_at: new Date().toISOString(),
            role: 'ADMIN' as const
          }
        ],
        total: 2
      };
      
      const response = ResponseUtils.success(result.books, {
        pagination: {
          page: Math.floor((query.offset || 0) / (query.limit || 20)) + 1,
          limit: query.limit || 20,
          total: result.total,
          totalPages: Math.ceil(result.total / (query.limit || 20))
        }
      });

      const duration = endTimer();
      Logger.performance('get_books_completed', duration, {
        bookCount: result.books.length,
        total: result.total
      });

      return response;
    } catch (error) {
      const duration = endTimer();
      Logger.error('Failed to fetch books', error as Error);
      
      return ResponseUtils.error('Failed to fetch books', 500, 'FETCH_BOOKS_ERROR');
    }
  }

  static async getBookById(c: any): Promise<Response> {
    const endTimer = Performance.startTimer('get_book_by_id');
    const requestId = c.get('requestId');
    
    try {
      const { bookId } = c.req.param();

      Logger.info('Fetching book by ID', { bookId });

      # For demo purposes, return sample data
      const book = {
        id: bookId,
        name: 'Sample Book',
        icon: '📚',
        module_type: 'PERSONAL' as const,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        membership: {
          role: 'OWNER' as const,
          joined_at: new Date().toISOString()
        }
      };

      const response = ResponseUtils.success(book);

      const duration = endTimer();
      Logger.performance('get_book_by_id_completed', duration, { bookId });

      return response;
    } catch (error) {
      const duration = endTimer();
      Logger.error('Failed to fetch book by ID', error as Error);
      
      return ResponseUtils.error('Failed to fetch book', 500, 'FETCH_BOOK_ERROR');
    }
  }

  static async createBook(c: any): Promise<Response> {
    const endTimer = Performance.startTimer('create_book');
    const requestId = c.get('requestId');
    
    try {
      const data = c.get('validatedData');

      Logger.info('Creating book', { bookData: { name: data.name, module_type: data.module_type } });

      # For demo purposes, return sample data
      const book = {
        id: 'book-' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        icon: data.icon || '📚',
        module_type: data.module_type,
        created_by: 'user-1',
        created_at: new Date().toISOString()
      };

      const response = ResponseUtils.created(book);

      const duration = endTimer();
      Logger.performance('create_book_completed', duration, { bookId: book.id });

      return response;
    } catch (error) {
      const duration = endTimer();
      Logger.error('Failed to create book', error as Error);
      
      return ResponseUtils.error('Failed to create book', 500, 'CREATE_BOOK_ERROR');
    }
  }
}