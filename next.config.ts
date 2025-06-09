import type { NextConfig } from "next";

const nextConfig: NextConfig = 
{
  images: {
    unoptimized: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  transpilePackages: ['@tomo-inc/tomo-evm-kit', '@tomo-wallet/uikit-lite', '@tomo-inc/shared-type'],
  
  /* config options here */
};

export default nextConfig;