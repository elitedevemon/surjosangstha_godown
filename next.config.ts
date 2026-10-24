import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker / VPS / Render-এ ছোট ইমেজের জন্য (BUILD_STANDALONE=true দিলে চালু)
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" as const } : {}),
  // আপলোড করা ছবি base64/এক্সটার্নাল URL হতে পারে
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // Low-memory shared hosting (cPanel / CloudLinux LVE): keep the build
  // inside small heaps and few workers. Harmless on bigger machines.
  experimental: {
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 25,
  },
};

export default nextConfig;
