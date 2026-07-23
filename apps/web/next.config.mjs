import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
};

export default withNextIntl(nextConfig);
