/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@buildlink/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  },
  async rewrites() {
    const internalApiBase = process.env.INTERNAL_API_ORIGIN || 'http://127.0.0.1:5050';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${internalApiBase}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${internalApiBase}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
