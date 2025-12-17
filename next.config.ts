import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
