import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/applyme-2027-fall" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/applyme-2027-fall/" : "",
  images: { unoptimized: true },
};

export default nextConfig;
