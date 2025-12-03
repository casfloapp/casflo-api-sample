# Casflo API - JavaScript Structured Version

A simple, fast, and secure REST API for managing books, built with JavaScript and optimized for Cloudflare Workers.

## Features

- ⚡ **Ultra-fast**: Built on Hono.js for optimal performance
- 🔒 **Secure**: Input validation, rate limiting, and error handling
- 📊 **Performance Monitoring**: Request tracking and response time logging
- 💾 **Caching**: Built-in KV caching for improved response times
- 🔍 **Search**: Advanced search and filtering capabilities
- 📈 **Batch Operations**: Efficient bulk create, update, and delete operations
- 📊 **Statistics**: Comprehensive book statistics and analytics

## API Endpoints

### Books
- `GET /books` - Get all books with pagination and filtering
- `GET /books/search` - Advanced book search
- `GET /books/:id` - Get book by ID
- `POST /books` - Create new book (requires membership)
- `PUT /books/:id` - Update book (requires membership)
- `DELETE /books/:id` - Delete book (requires premium membership)

### Batch Operations
- `POST /books/batch` - Create multiple books
- `PUT /books/batch` - Update multiple books
- `DELETE /books/batch` - Delete multiple books

### Statistics
- `GET /books/stats/overview` - Get book statistics

### System
- `GET /` - API information
- `GET /health` - Health check

## Query Parameters

### Filtering & Pagination
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search in title, author, description
- `author` (string): Filter by author
- `status` (string): Filter by status (active, inactive, archived)
- `genre` (string): Filter by genre
- `sort_by` (string): Sort field (title, author, created_at, updated_at)
- `sort_order` (string): Sort order (asc, desc)

## Example Requests

### Get all books
```bash
curl "https://your-worker.your-subdomain.workers.dev/books?page=1&limit=10"
```

### Search books
```bash
curl "https://your-worker.your-subdomain.workers.dev/books/search?search=typescript&genre=Programming"
```

### Create a book
```bash
curl -X POST "https://your-worker.your-subdomain.workers.dev/books" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "New Book",
    "author": "Author Name",
    "description": "Book description",
    "genre": "Fiction",
    "price": 19.99
  }'
```

## Deployment

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your D1 database:
   ```bash
   wrangler d1 create casflo-db
   ```
4. Update `wrangler.toml` with your database ID
5. Initialize the database:
   ```bash
   wrangler d1 execute casflo-db --file=schema.sql
   ```
6. Set up KV namespace:
   ```bash
   wrangler kv:namespace create "CACHE"
   ```
7. Update `wrangler.toml` with your KV namespace ID

### Local Development
```bash
npm run dev
```

### Deployment
```bash
npm run deploy
```

## Architecture

```
src/
├── controllers/     # Request handlers with performance tracking
├── middleware/      # Optimized middleware (caching, validation, etc.)
├── models/         # Database models with batch operations
├── routes/         # API routes with validation
├── types/          # JavaScript definitions & Zod schemas
├── utils/          # Performance utilities & helpers
└── index.js        # Application entry point
```

## Performance Features

- **Smart Caching**: Automatic KV caching for frequently accessed data
- **Batch Operations**: Efficient bulk operations to reduce API calls
- **Optimized Queries**: Indexed database queries for fast data retrieval
- **Request Tracking**: Comprehensive logging and performance monitoring
- **Rate Limiting**: Built-in protection against abuse

## Error Handling

The API uses consistent error responses:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "requestId": "req_1234567890_abc123"
}
```

## License

MIT License