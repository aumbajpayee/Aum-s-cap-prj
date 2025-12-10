import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow remote images from Appwrite storage (profile photos)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cloud.appwrite.io",
        port: "",
        pathname: "/v1/storage/buckets/**",
      },
      // keep any other remote hosts you might need here
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/photos/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
