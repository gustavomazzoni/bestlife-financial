import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['@lifeos/shared'],
};

export default nextConfig;
