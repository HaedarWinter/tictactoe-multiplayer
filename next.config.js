/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Dimatikan untuk menghindari masalah dengan Socket.io
  swcMinify: true,
};

module.exports = nextConfig; 