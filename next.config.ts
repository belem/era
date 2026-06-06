import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allow LAN IPs (testing on phone, second device, etc.) to load the dev
  // server's HMR/JS bundles. Without this, cross-origin requests are blocked
  // and the page renders but never hydrates — buttons appear but do nothing.
  allowedDevOrigins: ["10.239.159.43", "localhost", "127.0.0.1"],
};

export default withNextIntl(nextConfig);
