# Simple Database Schema for Testing

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    is_email_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📚',
    module_type TEXT NOT NULL CHECK (module_type IN ('PERSONAL', 'BUSINESS')),
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Book members table
CREATE TABLE IF NOT EXISTS book_members (
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, user_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample data for testing
INSERT OR IGNORE INTO users (id, email, full_name, is_email_verified) VALUES 
    ('user-1', 'john@example.com', 'John Doe', 1),
    ('user-2', 'jane@example.com', 'Jane Smith', 1);

INSERT OR IGNORE INTO books (id, name, icon, module_type, created_by) VALUES 
    ('book-1', 'Personal Finance', '💰', 'PERSONAL', 'user-1'),
    ('book-2', 'Business Expenses', '💼', 'BUSINESS', 'user-2'),
    ('book-3', 'Family Budget', '👨‍👩‍👧‍👦', 'PERSONAL', 'user-1');

INSERT OR IGNORE INTO book_members (book_id, user_id, role) VALUES 
    ('book-1', 'user-1', 'OWNER'),
    ('book-2', 'user-2', 'OWNER'),
    ('book-3', 'user-1', 'OWNER'),
    ('book-3', 'user-2', 'MEMBER');