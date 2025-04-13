/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポートを有効にして、ビルド時間を短縮
  output: 'export',
  // 画像最適化を無効化（静的エクスポートでは必要）
  images: {
    unoptimized: true,
  },
  // 不要なビルドステップをスキップ
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
