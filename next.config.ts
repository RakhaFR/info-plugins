import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'data.theotown.com',
      },
      {
        protocol: 'http',
        hostname: 'data.theotown.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'forum.theotown.com',
      },
    ],
  },
};

export default nextConfig;
