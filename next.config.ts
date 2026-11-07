import type { NextConfig } from "next";

/**
 * Built as plain files in out/, for a static host. Static hosts have no image optimiser, so images are served as they
 * are (the captures are already WebP), and each page is a folder with an index.html so its URL works on any host.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
};

export default nextConfig;
