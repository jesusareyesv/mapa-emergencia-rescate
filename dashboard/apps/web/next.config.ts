import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],

  // Emit a self-contained server bundle. Required for container deployments.
  output: "standalone",

  // Trace file dependencies from the monorepo root (dashboard/) so that
  // workspace packages (@repo/ui, @repo/config) are included in the standalone
  // output. Without this, Next traces from apps/web/ and misses packages/*.
  // import.meta.dirname = dashboard/apps/web — two levels up = dashboard/
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
};

export default nextConfig;
