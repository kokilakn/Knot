/**
 * Express Application Configuration
 *
 * This file initializes the Express application with middleware,
 * CORS configuration, and route registration.
 *
 * Architecture:
 * - Middleware setup (CORS, JSON parsing, logging)
 * - Route registration
 * - Error handling
 *
 * Future additions:
 * - Authentication middleware
 * - Database connection
 * - Face recognition service integration
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import healthRoutes from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS Configuration - Allow requests from frontend
// TODO: In production, restrict this to specific origins
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check routes
app.use('/api', healthRoutes);

// TODO: Add additional route groups here
// app.use('/api/photos', photoRoutes);
// app.use('/api/faces', faceRoutes);
// app.use('/api/auth', authRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
