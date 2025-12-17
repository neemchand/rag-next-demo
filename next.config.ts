import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default
  turbopack: {
    // Set the root directory to silence the lockfile warning
    root: __dirname,
  },

  // Webpack config is kept for backward compatibility
  // It will only apply when running with --webpack flag
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore optional ChromaDB dependencies when using ChromaDB
      // This is only needed if VECTOR_STORE_PROVIDER is set to 'chromadb'
      const vectorStoreProvider = process.env.VECTOR_STORE_PROVIDER || 'chromadb';

      if (vectorStoreProvider === 'chromadb') {
        config.resolve = config.resolve || {};
        config.resolve.fallback = {
          ...config.resolve.fallback,
          '@chroma-core/default-embed': false,
        };
      }
    }
    return config;
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
