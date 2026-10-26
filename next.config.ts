import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // The Mars Booth API reads its scene image from disk.
  outputFileTracingIncludes: { "/api/booth": ["./public/wei-assets/booth-scene.jpg"] },
  images: {
    // Episode thumbnails may live on a CDN; allow any https host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
