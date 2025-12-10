import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Allow images from any domain (useful for personal blogs with various image sources)
    // For production, consider restricting to specific domains for better security
    unoptimized: false,
  },
  // Completely disable source maps everywhere
  productionBrowserSourceMaps: false,
  // Configure Turbopack (Next.js 16 default)
  turbopack: {},
  // Webpack config for --webpack flag
  webpack: (config, { dev }) => {
    if (dev) {
      // Completely disable source maps
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
