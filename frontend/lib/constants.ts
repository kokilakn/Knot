/**
 * Image Processing Constants
 * Centralized configuration for image compression and quality settings.
 */

// Image compression settings for face embedding generation
export const IMAGE_MAX_WIDTH = 520;
export const IMAGE_QUALITY = 0.7;

// Image compression settings for storage (client-side before upload)
export const STORAGE_MAX_WIDTH = 2048;
export const STORAGE_QUALITY = 0.8;

// Face matching tier thresholds (distance values)
// Lower distance = better match. Distance maps to percentage as: (1 - distance) * 100
export const MATCH_TIERS = {
    BEST: { maxDistance: 0.4, label: 'Best Matches' },      // 60-100% match
    GOOD: { maxDistance: 0.5, label: 'Good Matches' },      // 50-60% match
    OTHER: { maxDistance: 0.6, label: 'Other Photos' },     // 30-50% match
} as const;

// Backend service URL (internal, never exposed to browser)
export const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

