/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Dimatikan untuk menghindari masalah dengan Socket.io
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/socket.io',
        destination: '/api/socket.io',
      },
      {
        source: '/socket.io/:path*',
        destination: '/api/socket.io/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 