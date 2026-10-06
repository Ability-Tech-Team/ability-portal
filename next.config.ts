import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone for the Docker image.
  output: "standalone",
};

export default withNextIntl(nextConfig);
