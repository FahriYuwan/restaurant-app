import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: false,
  // Ensure dynamic routes work properly in production
  experimental: {
    esmExternals: 'loose'
  }
};

export default nextConfig;
