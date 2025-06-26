/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Dimatikan untuk menghindari masalah dengan Socket.io
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/socket.io',
        destination: '/api/socket.io.js',
      },
      {
        source: '/api/socket.io/:path*',
        destination: '/api/socket.io.js',
      }
    ];
  },
};

module.exports = nextConfig; 