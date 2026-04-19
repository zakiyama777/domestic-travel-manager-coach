/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWAは次フェーズでnext-pwa等を追加予定。骨格では副作用を最小化。
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
