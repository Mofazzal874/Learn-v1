import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['mongoose'],
  
  // Increase body size limit to handle larger file uploads (like videos)
  serverActions: {
    bodySizeLimit: '10mb', // Increase from default 1mb to 10mb
  },
};

export default nextConfig;