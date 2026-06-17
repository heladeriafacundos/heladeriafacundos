import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  outputFileTracingExcludes: {
    "/*": ["dist-electron/**/*", ".next/standalone/dist-electron/**/*"],
    "/api/desktop/installer": ["dist-electron/**/*"],
  },
};

export default nextConfig;
