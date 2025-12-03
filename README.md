# Simple Casflo API

A minimal Cloudflare Workers API for Casflo financial management.

## Features

- Get all books
- Get single book by ID
- CORS support
- Error handling
- Health check endpoint

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Deploy to Cloudflare:
```bash
npm run deploy
```

## API Endpoints

### Health Check
```
GET /api/v1/health
```

### Get All Books
```
GET /api/v1/books
```

### Get Single Book
```
GET /api/v1/books/:bookId
```

## Response Format

```json
{
  "success": true,
  "data": [...]
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "message": "Error message"
  }
}
```