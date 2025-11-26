import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "bn8lvxb5jjbtvlvi.public.blob.vercel-storage.com",
      },
    ],
    localPatterns: [
      {
        pathname: "/api/storage",
      },
      {
        pathname: "/uploads/**",
      },
      {
        // allow images placed at the project `public/` root like `/logo.png`
        pathname: "/logo.png",
      },
      {
        // common favicon path
        pathname: "/favicon.ico",
      },
      {
        // allow images stored under `public/images/**`
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
