/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@trainflow/shared-types",
    "@trainflow/ui",
    "@trainflow/workout-math",
    "@trainflow/db",
  ],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "pdfkit", "exceljs"],
  },
};

export default nextConfig;
