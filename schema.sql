# High-Performance Database Schema for Casflo API
# Optimized for Cloudflare D1 with proper indexing

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_email_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📚',
    module_type TEXT NOT NULL CHECK (module_type IN ('PERSONAL', 'BUSINESS')),
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Book members table
CREATE TABLE IF NOT EXISTS book_members (
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    label TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, user_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance-optimized indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_books_created_by ON books(created_by);
CREATE INDEX IF NOT EXISTS idx_books_module_type ON books(module_type);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_name_search ON books(name); -- For search functionality

CREATE INDEX IF NOT EXISTS idx_book_members_book_id ON book_members(book_id);
CREATE INDEX IF NOT EXISTS idx_book_members_user_id ON book_members(user_id);
CREATE INDEX IF NOT EXISTS idx_book_members_role ON book_members(role);
CREATE INDEX IF NOT EXISTS idx_book_members_joined_at ON book_members(joined_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_books_composite ON books(module_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_members_composite ON book_members(user_id, role);

-- Sample data for testing
INSERT OR IGNORE INTO users (id, email, full_name, is_email_verified) VALUES 
    ('user-1', 'john.doe@casflo.id', 'John Doe', 1),
    ('user-2', 'jane.smith@casflo.id', 'Jane Smith', 1),
    ('user-3', 'admin@casflo.id', 'Admin User', 1);

INSERT OR IGNORE INTO books (id, name, icon, module_type, created_by) VALUES 
    ('book-1', 'Personal Finance', '💰', 'PERSONAL', 'user-1'),
    ('book-2', 'Business Expenses', '💼', 'BUSINESS', 'user-2'),
    ('book-3', 'Family Budget', '👨‍👩‍👧‍👦', 'PERSONAL', 'user-1'),
    ('book-4', 'Investment Portfolio', '📈', 'PERSONAL', 'user-3'),
    ('book-5', 'Side Business', '🚀', 'BUSINESS', 'user-1');

INSERT OR IGNORE INTO book_members (book_id, user_id, role, label) VALUES 
    ('book-1', 'user-1', 'OWNER', NULL),
    ('book-2', 'user-2', 'OWNER', NULL),
    ('book-3', 'user-1', 'OWNER', NULL),
    ('book-3', 'user-2', 'MEMBER', 'Spouse'),
    ('book-4', 'user-3', 'OWNER', NULL),
    ('book-5', 'user-1', 'OWNER', NULL),
    ('book-5', 'user-3', 'ADMIN', 'Financial Advisor');