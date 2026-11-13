import type { NextConfig } from "next";

// Bread photos uploaded from the POS admin live in the same public S3 bucket as config.json
// (under breads/). Pin next/image to that bucket so the optimizer can't be used for other hosts.
function breadImagesHostname(): string {
  const configUrl = process.env.NEXT_PUBLIC_CONFIG_S3_URL;
  if (configUrl) {
    try {
      return new URL(configUrl).hostname;
    } catch {
      // fall through
    }
  }
  return "*.s3.*.amazonaws.com";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: breadImagesHostname(),
        pathname: "/breads/**",
      },
    ],
  },
};

export default nextConfig;
