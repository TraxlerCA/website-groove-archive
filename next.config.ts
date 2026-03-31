import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow both local dev host and Playwright e2e host during `next dev`.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'soundcloud.com',
      },
      {
        protocol: 'https',
        hostname: 'www.soundcloud.com',
      },
      {
        protocol: 'https',
        hostname: '**.sndcdn.com',
      },
    ],
  },
};

export default nextConfig;
