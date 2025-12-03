import { z } from 'zod';

// Book schema
export const BookSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  published_date: z.string().optional(),
  isbn: z.string().optional(),
  pages: z.number().int().positive().optional(),
  language: z.string().optional(),
  genre: z.string().optional(),
  publisher: z.string().optional(),
  price: z.number().positive().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

// Query parameters schema
export const BookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  genre: z.string().optional(),
  sort_by: z.enum(['title', 'author', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// ID parameter schema
export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

// Response schemas
export const BookResponseSchema = BookSchema.extend({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

export const BookListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(BookResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number()
  })
});

// Runtime type exports
export const validateBook = (data) => BookSchema.parse(data);
export const validateBookQuery = (data) => BookQuerySchema.parse(data);
export const validateIdParam = (data) => IdParamSchema.parse(data);

export default {
  BookSchema,
  BookQuerySchema,
  IdParamSchema,
  BookResponseSchema,
  BookListResponseSchema,
  validateBook,
  validateBookQuery,
  validateIdParam
};