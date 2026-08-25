import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingIncludes: {
    "/**": ["./data/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    // Server Actions default to a 1MB body limit, well under the 5MB image
    // uploads this app actually accepts (see MAX_UPLOAD_BYTES in
    // src/lib/uploads.ts) — bump it so uploads near that limit don't fail
    // on multipart overhead alone.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
