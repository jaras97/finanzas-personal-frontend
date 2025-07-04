import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  
  async headers() {
    // Solo aplicar en producción
    if (process.env.NODE_ENV === 'production') {
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
    }
    // En desarrollo, permitir conexiones HTTP locales
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self' 'unsafe-inline' http://localhost:*; connect-src 'self' http://localhost:* ws://localhost:*`
          }
        ]
      }
    ];
  },

  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  
  experimental: {
    serverActions: {},
    optimizePackageImports: []
  }
};

export default nextConfig;