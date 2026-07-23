import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Keep in sync with `src/lib/security-headers.ts` (CSP is middleware-only). */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), gyroscope=(), magnetometer=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Trace from monorepo root so pnpm-hoisted Prisma engines are included.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: [
    "@trainflow/shared-types",
    "@trainflow/ui",
    "@trainflow/workout-math",
    "@trainflow/db",
  ],
  serverExternalPackages: ["@prisma/client", "pdfkit", "exceljs"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  /**
   * Static security headers. Content-Security-Policy is set per-request in
   * middleware (Clerk strict/nonce) — see `src/lib/security-headers.ts`.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
