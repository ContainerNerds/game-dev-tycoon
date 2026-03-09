import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  basePath: isGhPages ? "/game-dev-tycoon" : "",
  images: { unoptimized: true },
};

export default nextConfig;
