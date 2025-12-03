# Core Types
export interface Book {
  id: string;
  name: string;
  icon: string;
  module_type: 'PERSONAL' | 'BUSINESS';
  created_by: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
}

export interface BookMember {
  book_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  label?: string;
  joined_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_email_verified: boolean;
  created_at: string;
}

# API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

# Environment Types
export interface Env {
  DB: D1Database;
  CACHE?: KVNamespace;
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  ENVIRONMENT: 'development' | 'production';
  API_VERSION: string;
}

# Context Types
export interface Context {
  requestId: string;
  startTime: number;
  user?: User;
  member?: BookMember;
}

# Error Types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = statusCode < 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation?: string) {
    super(`Database error: ${message}`, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

# Query Types
export interface BookQuery {
  limit?: number;
  offset?: number;
  module_type?: 'PERSONAL' | 'BUSINESS';
  user_id?: string;
}

export interface BookFilters {
  search?: string;
  module_type?: 'PERSONAL' | 'BUSINESS';
  date_from?: string;
  date_to?: string;
}

# Cache Types
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

# Performance Types
export interface PerformanceMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  dbQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

# Request Types
export interface RequestContext {
  env: Env;
  ctx: ExecutionContext;
  request: Request;
  context: Context;
}