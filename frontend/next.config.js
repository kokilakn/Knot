/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development warnings
  reactStrictMode: true,

  // Environment variables for API communication
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
