import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Ensure all generated URLs are HTTPS
  trailingSlash: true,
  
  // Security headers to prevent mixed content
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          }
        ],
      },
    ];
  },

  // Fly.io specific optimizations
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  
  // Enable server actions if using Next.js 15 features
  experimental: {
    serverActions: {},
    optimizePackageImports: []
  }
};

export default nextConfig;