# Setup Instructions

## 1. Install Dependencies
```bash
npm install
```

## 2. Setup Database
```bash
# Create database (if not exists)
wrangler d1 create casflo

# Update database_id in wrangler.toml with your actual ID

# Run schema and sample data
wrangler d1 execute casflo --file=./schema.sql
```

## 3. Local Development
```bash
npm run dev
```

## 4. Deploy to Cloudflare
```bash
npm run deploy
```

## Test the API

### Health Check
```bash
curl https://your-worker.your-subdomain.workers.dev/api/v1/health
```

### Get All Books
```bash
curl https://your-worker.your-subdomain.workers.dev/api/v1/books
```

### Get Single Book
```bash
curl https://your-worker.your-subdomain.workers.dev/api/v1/books/book-1
```