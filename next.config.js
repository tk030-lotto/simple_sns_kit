/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint v9 と Next.js 14 のオプション互換性エラーを回避
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
