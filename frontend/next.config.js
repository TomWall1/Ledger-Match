/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: 'loose'
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/index.html'
      }
    ];
  }
};

module.exports = nextConfig;