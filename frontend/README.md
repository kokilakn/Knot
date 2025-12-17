# Knot Frontend

Next.js-based frontend for the Knot photo organization application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env.local` file in this directory:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Project Structure

- **app/** - Next.js App Router pages and layouts
- **components/** - Reusable React components
- **lib/** - Utility functions, API clients, and helpers

## Architecture Notes

- Uses Next.js App Router for file-based routing
- TypeScript for type safety
- API client in `lib/api.ts` handles backend communication
- Environment variables prefixed with `NEXT_PUBLIC_` are available in browser
