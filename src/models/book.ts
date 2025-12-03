import { Book, BookQuery, BookFilters } from '@/types';
import { DatabaseUtils, Utils, CacheUtils } from '@/utils';

export class BookModel {
  static async findById(db: D1Database, id: string): Promise<Book | null> {
    const stmt = db.prepare('SELECT * FROM books WHERE id = ?');
    const result = await stmt.bind(id).first();
    return DatabaseUtils.formatSingleResult<Book>(result);
  }

  static async findByUserId(db: D1Database, userId: string, query: BookQuery = {}): Promise<{
    books: Book[];
    total: number;
  }> {
    const { limit = 20, offset = 0, module_type } = query;

    # Build WHERE clause
    const conditions = ['bm.user_id = ?'];
    const params = [userId];

    if (module_type) {
      conditions.push('b.module_type = ?');
      params.push(module_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    # Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      ${whereClause}
    `;

    const countResult = await db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    # Get books with pagination
    const booksQuery = `
      SELECT 
        b.id,
        b.name,
        b.icon,
        b.module_type,
        b.created_by,
        b.created_at,
        b.updated_at,
        b.updated_by,
        bm.role
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const booksResult = await db.prepare(booksQuery)
      .bind(...params, limit, offset)
      .all();

    const books = DatabaseUtils.formatQueryResult<Book>(booksResult);

    return { books, total };
  }

  static async findWithFilters(
    db: D1Database, 
    userId: string, 
    filters: BookFilters,
    pagination: { page: number; limit: number }
  ): Promise<{
    books: Book[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    # Build WHERE clause
    const conditions = ['bm.user_id = ?'];
    const params = [userId];

    if (filters.module_type) {
      conditions.push('b.module_type = ?');
      params.push(filters.module_type);
    }

    if (filters.search) {
      conditions.push('(b.name LIKE ? OR b.name LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.date_from) {
      conditions.push('b.created_at >= ?');
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      conditions.push('b.created_at <= ?');
      params.push(filters.date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    # Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      ${whereClause}
    `;

    const countResult = await db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    # Get books
    const booksQuery = `
      SELECT 
        b.id,
        b.name,
        b.icon,
        b.module_type,
        b.created_by,
        b.created_at,
        b.updated_at,
        b.updated_by,
        bm.role
      FROM books b
      JOIN book_members bm ON b.id = bm.book_id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const booksResult = await db.prepare(booksQuery)
      .bind(...params, limit, offset)
      .all();

    const books = DatabaseUtils.formatQueryResult<Book>(booksResult);

    return {
      books,
      total,
      page,
      totalPages
    };
  }

  static async create(
    db: D1Database,
    data: {
      name: string;
      module_type: 'PERSONAL' | 'BUSINESS';
      icon?: string;
      created_by: string;
    }
  ): Promise<Book> {
    const id = Utils.generateId('bk');
    
    await DatabaseUtils.executeWithRetry(async () => {
      await db.prepare(`
        INSERT INTO books (id, name, icon, module_type, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        data.name,
        data.icon || '📚',
        data.module_type,
        data.created_by
      ).run();

      # Add creator as owner
      await db.prepare(`
        INSERT INTO book_members (book_id, user_id, role, joined_at)
        VALUES (?, ?, 'OWNER', datetime('now'))
      `).bind(id, data.created_by).run();
    });

    const book = await this.findById(db, id);
    if (!book) {
      throw new Error('Failed to create book');
    }
    return book;
  }

  static async checkMembership(
    db: D1Database,
    bookId: string,
    userId: string
  ): Promise<BookMember | null> {
    const stmt = db.prepare('SELECT * FROM book_members WHERE book_id = ? AND user_id = ?');
    const result = await stmt.bind(bookId, userId).first();
    return DatabaseUtils.formatSingleResult<BookMember>(result);
  }
}