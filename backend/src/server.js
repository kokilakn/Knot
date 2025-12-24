/**
 * Server Entry Point
 *
 * This file starts the Express server and handles graceful shutdown.
 * Separated from app.js to enable easier testing.
 *
 * Responsibilities:
 * - Load environment variables
 * - Start the HTTP server
 * - Handle graceful shutdown
 * - Log startup information
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import app from './app.js';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

/**
 * Start the server
 */
const startServer = () => {
  server = app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 Knot Backend Server Started');
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log('========================================');
  });
};

/**
 * Graceful shutdown handler
 * Closes the server and any open connections
 */
const gracefulShutdown = () => {
  console.log('\n⏹️  Shutting down server gracefully...');

  if (server) {
    server.close(() => {
      console.log('✓ Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


// Start the server if running directly and NOT on Vercel
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1';

if (isMainModule && !isVercel) {
  startServer();
}

export default app;
