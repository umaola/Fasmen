import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
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
