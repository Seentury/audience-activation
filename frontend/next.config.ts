import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_URL ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/audiences/:path*",
        destination: `${backendUrl}/audiences/:path*`,
      },
      {
        source: "/api/activations/:path*",
        destination: `${backendUrl}/activations/:path*`,
      },
    ];
  },
};

export default nextConfig;