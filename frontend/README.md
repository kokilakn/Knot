# Knot Frontend – Main Application

The primary user interface for Knot, built with Next.js 14 and powered by Tailwind CSS and Drizzle ORM.

## Overview

The frontend handles:
- **User Authentication**: Login and registration flows.
- **Event Management**: Creating, viewing, and sharing events.
- **Gallery**: A responsive grid for viewing and managing photos.
- **Contributions**: Multi-photo upload and camera capture functionality.
- **Face Discovery**: Taking selfies and finding matches via the face-recognition proxy.
- **Database Operations**: Managing users, events, and photos using Drizzle ORM.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: PostgreSQL (via `pg` driver)
- **Icons**: [Material Symbols](https://fonts.google.com/icons)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` directory:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/knot
   BACKEND_URL=http://localhost:5000
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

3. **Database Setup**:
   ```bash
   npx drizzle-kit push:pg
   ```

## Development

```bash
npm run dev
```
Accessible at `http://localhost:3000`.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
  - `event/[eventId]/`: Event-specific routes (gallery, find-face, contribute).
  - `api/`: Backend-agnostic API routes and proxies to the face-recognition service.
- `components/`:
  - `shared/`: Reusable UI elements (Modals, Icons, PageTransitions).
  - `dashboard/`: Components for the main events list.
- `db/`: Database schema definitions (`schema.ts`) and client initialization.
- `hooks/`: Custom hooks for gestures and state management.
- `styles/`: Global CSS and Tailwind configuration.

## Key Features & Logic

- **API Proxy**: Face recognition requests are sent to `/api/faces/*` which proxies them to the backend service to keep the backend URL private.
- **Responsive Gallery**: Uses a custom CSS grid and gesture-based interaction for mobile-first experience.
- **Drizzle Integration**: Type-safe database queries synchronized with PostgreSQL schema.

---
*Developed for a seamless and private photo discovery experience.*
