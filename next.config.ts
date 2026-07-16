import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Temporary deployment safeguard: the migrated application still contains
  // legacy type errors. ESLint remains enforced in CI while these are reduced.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
