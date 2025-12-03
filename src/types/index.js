// Base types
export const BookStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

export const UserRole = {
  USER: 'user',
  ADMIN: 'admin'
};

// Response types
export const ApiResponse = {
  success: (data, message = 'Success') => ({
    success: true,
    message,
    data
  }),
  
  error: (message, code = 'ERROR') => ({
    success: false,
    error: message,
    code
  }),
  
  paginated: (data, pagination, message = 'Success') => ({
    success: true,
    message,
    data,
    pagination
  })
};

// Error classes
export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}