import { DatabaseUtils, Utils } from '../utils/index.js';
import { NotFoundError, DatabaseError } from '../types/index.js';

export class BookModel {
  constructor(db) {
    this.db = db;
  }

  // Get all books with pagination and filtering
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      author,
      status,
      genre,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    // Build WHERE conditions
    if (search) {
      whereConditions.push('(title LIKE ? OR author LIKE ? OR description LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (author) {
      whereConditions.push('author = ?');
      params.push(author);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (genre) {
      whereConditions.push('genre = ?');
      params.push(genre);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort column
    const validSortColumns = ['title', 'author', 'created_at', 'updated_at', 'status', 'genre'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM books ${whereClause}`;
    const countResult = await DatabaseUtils.executeGet(this.db, countQuery, params);
    const total = countResult?.total || 0;

    // Get books with pagination
    const booksQuery = `
      SELECT * FROM books 
      ${whereClause} 
      ORDER BY ${sortColumn} ${sortDirection} 
      LIMIT ? OFFSET ?
    `;
    
    const booksResult = await DatabaseUtils.executeQuery(
      this.db, 
      booksQuery, 
      [...params, limit, offset]
    );

    return {
      books: booksResult.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  // Get book by ID
  async getById(id) {
    if (!id) {
      throw new Error('Book ID is required');
    }

    const query = 'SELECT * FROM books WHERE id = ?';
    const book = await DatabaseUtils.executeGet(this.db, query, [id]);
    
    if (!book) {
      throw new NotFoundError('Book');
    }
    
    return book;
  }

  // Create new book
  async create(bookData) {
    const id = Utils.generateId();
    const now = new Date().toISOString();
    
    const {
      title,
      author,
      description,
      status = 'active',
      published_date,
      isbn,
      pages,
      language,
      genre,
      publisher,
      price
    } = bookData;

    const query = `
      INSERT INTO books (
        id, title, author, description, status, 
        published_date, isbn, pages, language, 
        genre, publisher, price, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id, title, author, description, status,
      published_date, isbn, pages, language,
      genre, publisher, price, now, now
    ];

    const result = await DatabaseUtils.executeRun(this.db, query, params);
    
    if (!result.success) {
      throw new DatabaseError('Failed to create book');
    }

    // Return the created book
    return await this.getById(id);
  }

  // Update book
  async update(id, updateData) {
    if (!id) {
      throw new Error('Book ID is required');
    }

    // Check if book exists
    await this.getById(id);

    const now = new Date().toISOString();
    const updateFields = [];
    const params = [];

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = ?');
    params.push(now, id);

    const query = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
    
    const result = await DatabaseUtils.executeRun(this.db, query, params);
    
    if (!result.success) {
      throw new DatabaseError('Failed to update book');
    }

    // Return the updated book
    return await this.getById(id);
  }

  // Delete book
  async delete(id) {
    if (!id) {
      throw new Error('Book ID is required');
    }

    // Check if book exists
    await this.getById(id);

    const query = 'DELETE FROM books WHERE id = ?';
    const result = await DatabaseUtils.executeRun(this.db, query, [id]);
    
    if (!result.success) {
      throw new DatabaseError('Failed to delete book');
    }

    return { deleted: true, id };
  }

  // Batch operations
  async createMultiple(booksData) {
    if (!Array.isArray(booksData) || booksData.length === 0) {
      throw new Error('Books data array is required');
    }

    const results = [];
    const errors = [];

    for (const bookData of booksData) {
      try {
        const book = await this.create(bookData);
        results.push(book);
      } catch (error) {
        errors.push({ data: bookData, error: error.message });
      }
    }

    return {
      created: results,
      errors,
      total: booksData.length,
      success_count: results.length,
      error_count: errors.length
    };
  }

  async updateMultiple(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array is required');
    }

    const results = [];
    const errors = [];

    for (const { id, data } of updates) {
      try {
        const book = await this.update(id, data);
        results.push(book);
      } catch (error) {
        errors.push({ id, data, error: error.message });
      }
    }

    return {
      updated: results,
      errors,
      total: updates.length,
      success_count: results.length,
      error_count: errors.length
    };
  }

  async deleteMultiple(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs array is required');
    }

    const results = [];
    const errors = [];

    for (const id of ids) {
      try {
        const result = await this.delete(id);
        results.push(result);
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    return {
      deleted: results,
      errors,
      total: ids.length,
      success_count: results.length,
      error_count: errors.length
    };
  }

  // Get statistics
  async getStatistics() {
    const queries = {
      total: 'SELECT COUNT(*) as count FROM books',
      active: 'SELECT COUNT(*) as count FROM books WHERE status = "active"',
      inactive: 'SELECT COUNT(*) as count FROM books WHERE status = "inactive"',
      archived: 'SELECT COUNT(*) as count FROM books WHERE status = "archived"',
      by_genre: 'SELECT genre, COUNT(*) as count FROM books WHERE genre IS NOT NULL GROUP BY genre ORDER BY count DESC',
      by_author: 'SELECT author, COUNT(*) as count FROM books GROUP BY author ORDER BY count DESC LIMIT 10'
    };

    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      try {
        if (key === 'by_genre' || key === 'by_author') {
          const result = await DatabaseUtils.executeQuery(this.db, query);
          results[key] = result.results || [];
        } else {
          const result = await DatabaseUtils.executeGet(this.db, query);
          results[key] = result?.count || 0;
        }
      } catch (error) {
        Logger.error('Statistics query failed', error, { query });
        results[key] = key.includes('_') ? [] : 0;
      }
    }

    return results;
  }
}

export default BookModel;