# Knot Backend

Express.js API server for the Knot photo organization application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your settings.

## Development

```bash
npm run dev
```

The server will start on `http://localhost:5000` and watch for file changes.

## Production

```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Returns server health status

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-17T10:30:00Z",
  "uptime": 3600
}
```

## Project Structure

- **src/app.js** - Express app initialization with middleware and routes
- **src/server.js** - Server startup and lifecycle management
- **src/routes/** - API endpoint definitions
  - `health.js` - Health check endpoint
- **src/controllers/** - Business logic (to be implemented)
- **src/services/** - External service integrations (to be implemented)

## Architecture Notes

- Uses ES modules for modern JavaScript
- CORS enabled for frontend communication
- Environment-based configuration
- Graceful shutdown handling

## Future Development

### Controllers
- Photo management (upload, retrieval, deletion)
- Face detection and tagging
- Search and filtering

### Services
- Face recognition integration (AWS Rekognition, Google Vision, etc.)
- Photo storage and processing
- Database operations
- Email notifications

### Middleware
- Authentication (JWT, OAuth)
- Rate limiting
- Input validation
- Logging and monitoring

## Environment Variables

See `.env.example` for all available configuration options.

## CORS Configuration

Currently allows requests from `http://localhost:3000` (frontend).
For production, update `FRONTEND_URL` in `.env`.

## Error Handling

All errors are caught and returned as JSON responses with appropriate status codes.
Development environment includes full error stack traces.
