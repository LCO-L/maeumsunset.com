/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  assetPrefix: './',        // ⭐️ 정적 자산을 상대 경로로 로드 (Access 뒤에서 404 방지)
  // ⚠️ distDir 쓰지 마세요 (docs에 .next 덮어써서 꼬임)
};
export default nextConfig;


