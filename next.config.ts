import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // In development we talk to the local Supabase storage emulator
    // on localhost, which Next.js treats as a private IP for the
    // image optimizer. Disable optimization in dev so images load.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
