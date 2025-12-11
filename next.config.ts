import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude faiss-node from webpack bundling - it's a native module
      config.externals = config.externals || [];
      config.externals.push({
        'faiss-node': 'commonjs faiss-node',
      });
    }
    return config;
  },
  // Ensure experimental features are disabled for stability
  experimental: {
    serverComponentsExternalPackages: ['faiss-node'],
  },
};

export default nextConfig;
