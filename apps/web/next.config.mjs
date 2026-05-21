/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The shared workspace package ships TS source; let Next transpile it.
  transpilePackages: ['shared'],
};

export default nextConfig;
