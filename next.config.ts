import type { NextConfig } from "next";

const nextConfig: NextConfig = 
{
  images: {
  domains: ["imagedelivery.net","cdn2.suno.ai","via.placeholder.com","arwlfohblasffrwoxxfe.supabase.co","ipfs.io"],
},
  
  eslint: {
    ignoreDuringBuilds: true,
},
  /* config options here */
};

export default nextConfig;