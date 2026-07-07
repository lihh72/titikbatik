import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/api/v1/images/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/api/v1/images/**",
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
