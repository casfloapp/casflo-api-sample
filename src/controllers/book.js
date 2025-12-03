import { BookModel } from '../models/book.js';
import { Logger, Performance, ResponseUtils } from '../utils/index.js';
import { NotFoundError, ValidationError, DatabaseError } from '../types/index.js';

export class BookController {
  constructor(env) {
    this.bookModel = new BookModel(env.DB);
    this.cache = env.CACHE;
  }

  // Get all books with pagination and filtering
  async getBooks(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const queryData = c.get('validatedData');
      const result = await this.bookModel.getAll(queryData);
      
      const response = ResponseUtils.paginated(
        result.books,
        result.pagination,
        'Books retrieved successfully'
      );
      
      Logger.info('Books retrieved successfully', {
        requestId,
        count: result.books.length,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(response, 200);
    } catch (error) {
      Logger.error('Failed to get books', error, { requestId });
      
      if (error instanceof ValidationError) {
        return c.json(ResponseUtils.error(error.message, 400, error.code), 400);
      }
      
      return c.json(
        ResponseUtils.error('Failed to retrieve books', 500, 'GET_BOOKS_ERROR'),
        500
      );
    }
  }

  // Get book by ID
  async getBookById(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const { id } = c.get('validatedData');
      const book = await this.bookModel.getById(id);
      
      Logger.info('Book retrieved successfully', {
        requestId,
        bookId: id,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success(book, 'Book retrieved successfully'), 200);
    } catch (error) {
      Logger.error('Failed to get book', error, { requestId });
      
      if (error instanceof NotFoundError) {
        return c.json(ResponseUtils.error(error.message, 404, error.code), 404);
      }
      
      return c.json(
        ResponseUtils.error('Failed to retrieve book', 500, 'GET_BOOK_ERROR'),
        500
      );
    }
  }

  // Create new book
  async createBook(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const bookData = c.get('validatedData');
      const book = await this.bookModel.create(bookData);
      
      Logger.info('Book created successfully', {
        requestId,
        bookId: book.id,
        title: book.title,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success(book, 'Book created successfully'), 201);
    } catch (error) {
      Logger.error('Failed to create book', error, { requestId });
      
      if (error instanceof ValidationError) {
        return c.json(ResponseUtils.error(error.message, 400, error.code), 400);
      }
      
      if (error instanceof DatabaseError) {
        return c.json(ResponseUtils.error(error.message, 500, error.code), 500);
      }
      
      return c.json(
        ResponseUtils.error('Failed to create book', 500, 'CREATE_BOOK_ERROR'),
        500
      );
    }
  }

  // Update book
  async updateBook(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const { id } = c.get('validatedData');
      const updateData = await c.req.json();
      
      const book = await this.bookModel.update(id, updateData);
      
      Logger.info('Book updated successfully', {
        requestId,
        bookId: id,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success(book, 'Book updated successfully'), 200);
    } catch (error) {
      Logger.error('Failed to update book', error, { requestId });
      
      if (error instanceof NotFoundError) {
        return c.json(ResponseUtils.error(error.message, 404, error.code), 404);
      }
      
      if (error instanceof ValidationError) {
        return c.json(ResponseUtils.error(error.message, 400, error.code), 400);
      }
      
      if (error instanceof DatabaseError) {
        return c.json(ResponseUtils.error(error.message, 500, error.code), 500);
      }
      
      return c.json(
        ResponseUtils.error('Failed to update book', 500, 'UPDATE_BOOK_ERROR'),
        500
      );
    }
  }

  // Delete book
  async deleteBook(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const { id } = c.get('validatedData');
      await this.bookModel.delete(id);
      
      Logger.info('Book deleted successfully', {
        requestId,
        bookId: id,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success({ deleted: true, id }, 'Book deleted successfully'), 200);
    } catch (error) {
      Logger.error('Failed to delete book', error, { requestId });
      
      if (error instanceof NotFoundError) {
        return c.json(ResponseUtils.error(error.message, 404, error.code), 404);
      }
      
      if (error instanceof DatabaseError) {
        return c.json(ResponseUtils.error(error.message, 500, error.code), 500);
      }
      
      return c.json(
        ResponseUtils.error('Failed to delete book', 500, 'DELETE_BOOK_ERROR'),
        500
      );
    }
  }

  // Batch create books
  async createMultipleBooks(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const { books } = await c.req.json();
      
      if (!Array.isArray(books) || books.length === 0) {
        throw new ValidationError('Books array is required');
      }
      
      const result = await this.bookModel.createMultiple(books);
      
      Logger.info('Batch create books completed', {
        requestId,
        total: result.total,
        success_count: result.success_count,
        error_count: result.error_count,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success(result, 'Batch create completed'), 201);
    } catch (error) {
      Logger.error('Failed to create multiple books', error, { requestId });
      
      if (error instanceof ValidationError) {
        return c.json(ResponseUtils.error(error.message, 400, error.code), 400);
      }
      
      return c.json(
        ResponseUtils.error('Failed to create multiple books', 500, 'BATCH_CREATE_ERROR'),
        500
      );
    }
  }

  // Batch update books
  async updateMultipleBooks(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const { updates } = await c.req.json();
      
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new ValidationError('Updates array is required');
      }
      
      const result = await this.bookModel.updateMultiple(updates);
      
      Logger.info('Batch update books completed', {
        requestId,
        total: result.total,
        success_count: result.success_count,
        error_count: result.error_count,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success(result, 'Batch update completed'), 200);
    } catch (error) {
      Logger.error('Failed to update multiple books', error, { requestId });
      
      if (error instanceof ValidationError) {
        return c.json(ResponseUtils.error(error.message, 400, error.code), 400);
      }
      
      return c.json(
        ResponseUtils.error('Failed to update multiple books', 500, 'BATCH_UPDATE_ERROR'),
        500
      );
    }
  }

  // Batch delete books
  async deleteMultipleBooks(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const { ids } = await c.req.json();
      
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('IDs array is required');
      }
      
      const result = await this.bookModel.deleteMultiple(ids);
      
      Logger.info('Batch delete books completed', {
        requestId,
        total: result.total,
        success_count: result.success_count,
        error_count: result.error_count,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success(result, 'Batch delete completed'), 200);
    } catch (error) {
      Logger.error('Failed to delete multiple books', error, { requestId });
      
      if (error instanceof ValidationError) {
        return c.json(ResponseUtils.error(error.message, 400, error.code), 400);
      }
      
      return c.json(
        ResponseUtils.error('Failed to delete multiple books', 500, 'BATCH_DELETE_ERROR'),
        500
      );
    }
  }

  // Get book statistics
  async getBookStatistics(c) {
    const startTime = Performance.startTimer();
    const requestId = c.get('requestId');
    
    try {
      const statistics = await this.bookModel.getStatistics();
      
      Logger.info('Book statistics retrieved', {
        requestId,
        duration: Performance.formatDuration(Performance.getDuration(startTime))
      });
      
      return c.json(ResponseUtils.success(statistics, 'Statistics retrieved successfully'), 200);
    } catch (error) {
      Logger.error('Failed to get book statistics', error, { requestId });
      
      return c.json(
        ResponseUtils.error('Failed to retrieve statistics', 500, 'STATISTICS_ERROR'),
        500
      );
    }
  }
}

export default BookController;