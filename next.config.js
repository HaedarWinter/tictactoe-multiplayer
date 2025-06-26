/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Dimatikan untuk menghindari masalah dengan Socket.io
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: '/api/socketio',
      },
    ];
  },
};

module.exports = nextConfig; 