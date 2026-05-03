import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@workout/shared", "@workout/importer", "@workout/analytics", "@workout/progression", "@workout/sync", "@workout/export"]
};

export default nextConfig;
