import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: false,
  // Ensure dynamic routes work properly in production
  experimental: {
    // Enable experimental features if needed
  },
  // Configure rewrite rules to ensure proper routing
  async rewrites() {
    return [
      // Ensure table routes are handled correctly
      {
        source: '/table/:tableId',
        destination: '/table/:tableId'
      }
    ]
  }
};

export default nextConfig;
