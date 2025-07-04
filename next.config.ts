import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

export default nextConfig
