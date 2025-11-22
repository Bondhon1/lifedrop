import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
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
    ],
  },
};

export default nextConfig;
