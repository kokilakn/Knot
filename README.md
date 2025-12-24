# Knot – Find Yourself in Every Photo

A full-stack, AI-driven photo organization and discovery platform. Knot allows users to create events, upload photos, and use face recognition to find photos of themselves across entire galleries.

## Project Overview

Knot is a modern monorepo that combines a powerful Next.js frontend with a specialized face-recognition backend. Users can create private or public events, contribute photos, and instantly find their own moments by taking a simple selfie.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, JavaScript (ES modules)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Face Recognition**: [face-api.js](https://github.com/justadudewhohacks/face-api.js) (TensorFlow.js)
- **Conversion**: [heic-convert](https://github.com/alexcorvi/heic-convert) for HEIC/HEIF support

## Project Structure

```
knot/
├── frontend/          # Main application (Next.js)
│   ├── app/           # App Router (pages: dashboard, event, login)
│   ├── components/    # UI components (shared, event-specific)
│   ├── db/            # Drizzle schema and client
│   ├── hooks/         # Custom React hooks (gestures, photo URLs)
│   └── lib/           # Utils, constants, and API clients
│
├── backend/           # Face Recognition & Image Processing (Express)
│   ├── src/
│   │   ├── routes/    # API endpoints (face match/process, health)
│   │   ├── models/    # Pre-trained face-api.js models (SsdMobilenetv1, Landmarks, etc.)
│   │   └── app.js     # Express server configuration
│   └── package.json
│
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Pre-trained models in `backend/models`

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd knot
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Environment Configuration:**
   - Configure `.env` in the `frontend` directory (see `frontend/README.md`).
   - Configure `.env` in the `backend` directory (see `backend/README.md`).

## Running the Application

### Development Mode

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```
Accessible at `http://localhost:3000`

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Accessible at `http://localhost:5000`

## Core Features

- **Event Creation**: Host events with unique access codes and QR sharing.
- **Smart Contribution**: Multi-photo upload with automatic HEIC conversion.
- **Face Recognition**: High-precision face matching using SSD Mobilenet v1.
- **Gallery Exploration**: Rich, responsive gallery with bulk actions and gestures.
- **Private Discoveries**: "Find My Photos" feature specifically for finding matches of the uploader.

## Architecture & Data Flow

Knot uses a specialized architecture where the frontend handles standard CRUD and database operations via Drizzle, while the backend serves as a high-performance image processing and face-matching engine. API requests for face recognition are proxied through the frontend API routes to the backend service.

---
© 2024 Knot. Built with focus on privacy and seamless event photography.

