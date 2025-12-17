/**
 * Health Check Routes
 *
 * Provides endpoints to verify the backend is running and healthy.
 * Useful for monitoring, load balancers, and frontend health verification.
 *
 * Endpoints:
 * - GET /api/health - Returns server health status with timestamp
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/health
 *
 * Health check endpoint
 * Returns:
 * {
 *   status: "ok",
 *   timestamp: ISO 8601 timestamp,
 *   uptime: server uptime in seconds
 * }
 *
 * Use cases:
 * - Frontend verification that backend is running
 * - Kubernetes/Docker health checks
 * - Load balancer monitoring
 * - System status monitoring
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
