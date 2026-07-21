/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@trainflow/shared-types",
    "@trainflow/ui",
    "@trainflow/workout-math",
  ],
};
export default nextConfig;
