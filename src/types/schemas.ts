import { z } from 'zod';

# Book Schemas
export const bookIdSchema = z.string().uuid('Invalid book ID format');

export const createBookSchema = z.object({
  name: z.string()
    .min(1, 'Book name is required')
    .max(100, 'Book name must not exceed 100 characters')
    .trim(),
  module_type: z.enum(['PERSONAL', 'BUSINESS'], {
    errorMap: () => ({ message: 'Module type must be PERSONAL or BUSINESS' })
  }),
  icon: z.string()
    .emoji('Icon must be a valid emoji')
    .optional()
});

export const updateBookSchema = z.object({
  name: z.string()
    .min(1, 'Book name is required')
    .max(100, 'Book name must not exceed 100 characters')
    .trim()
    .optional(),
  icon: z.string()
    .emoji('Icon must be a valid emoji')
    .optional()
});

export const bookQuerySchema = z.object({
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.coerce.number()
    .int('Offset must be an integer')
    .nonnegative('Offset cannot be negative')
    .default(0),
  module_type: z.enum(['PERSONAL', 'BUSINESS'])
    .optional(),
  search: z.string()
    .trim()
    .max(100, 'Search term too long')
    .optional()
});

export const bookFiltersSchema = z.object({
  search: z.string().trim().optional(),
  module_type: z.enum(['PERSONAL', 'BUSINESS']).optional(),
  date_from: z.string().datetime('Invalid date format').optional(),
  date_to: z.string().datetime('Invalid date format').optional()
}).refine((data) => {
  if (data.date_from && data.date_to) {
    return new Date(data.date_from) <= new Date(data.date_to);
  }
  return true;
}, {
  message: "Start date must be before end date",
  path: ["date_to"]
});

# Pagination Schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

# Export types
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookQueryInput = z.infer<typeof bookQuerySchema>;
export type BookFiltersInput = z.infer<typeof bookFiltersSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;