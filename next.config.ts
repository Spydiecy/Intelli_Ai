import type { NextConfig } from "next";

const nextConfig: NextConfig = 
{
  images: {
  domains: ["imagedelivery.net","cdn2.suno.ai","via.placeholder.com","arwlfohblasffrwoxxfe.supabase.co","ipfs.io","arkworks-dev.s3.ap-northeast-2.amazonaws.com","walkerhill250520.s3.ap-northeast-2.amazonaws.com","w3s.link"],
},
  
  eslint: {
    ignoreDuringBuilds: true,
},
  /* config options here */
};

export default nextConfig;