import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app (repo has multiple lockfiles).
  turbopack: {
    root: path.join(__dirname),
  },
  // Avoid compiling the whole icon/chart barrels on first dev compile.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
