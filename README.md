# Knot – Find Yourself in Every Photo

A full-stack web application for photo organization and face recognition.

## Project Overview

Knot is designed to help users organize and search their photo libraries by automatically recognizing faces. This project uses a modern monorepo structure with clear separation between frontend and backend services.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, React
- **Backend**: Node.js with Express, JavaScript (ES modules)
- **Database**: PostgreSQL (planned)
- **AI/ML**: Face recognition integration (planned)

## Project Structure

```
knot/
├── frontend/          # Next.js web application
│   ├── app/          # App Router pages and layouts
│   ├── components/   # Reusable React components
│   ├── lib/          # Utility functions and API clients
│   └── package.json
│
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── controllers/  # Business logic
│   │   ├── services/     # External integrations (face recognition, etc.)
│   │   ├── app.js    # Express app initialization
│   │   └── server.js # Server startup entry point
│   ├── package.json
│   └── .env.example
│
└── README.md         # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd knot
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Running the Application

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:3000`

**Terminal 2 - Backend:**
```bash
cd backend
npm start
```
The backend will be running at `http://localhost:5000`

## Development

### Frontend
- TypeScript for type safety
- Next.js App Router for file-based routing
- Environment variables: Configure `frontend/.env.local` with backend API URL

### Backend
- Express.js for HTTP server
- ES modules for modern JavaScript
- CORS enabled for frontend communication
- Environment variables: Copy `.env.example` to `.env` and configure

## Future Features

- Face recognition and tagging
- Photo search by face
- Photo albums and collections
- User authentication
- Cloud storage integration

## Contributing

Follow the existing code structure and add clear comments for complex logic.

## License

MIT
