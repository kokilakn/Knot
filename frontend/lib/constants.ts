/**
 * Image Processing Constants
 * Centralized configuration for image compression and quality settings.
 */

// Image compression settings for face embedding generation
export const IMAGE_MAX_WIDTH = 520; // pixels (average of user-specified 500-550px)
export const IMAGE_QUALITY = 0.7; // JPEG quality (0.0 - 1.0)

// Face matching tier thresholds (distance values)
// Lower distance = better match. Distance maps to percentage as: (1 - distance) * 100
export const MATCH_TIERS = {
    BEST: { maxDistance: 0.4, label: 'Best Matches' },      // 60-100% match
    GOOD: { maxDistance: 0.5, label: 'Good Matches' },      // 50-60% match
    OTHER: { maxDistance: 0.6, label: 'Other Photos' },     // 30-50% match
} as const;

// Backend service URL (internal, never exposed to browser)
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
