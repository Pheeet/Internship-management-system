import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/intern",
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb'
    }
  }
};

export default nextConfig;
