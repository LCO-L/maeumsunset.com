/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true
  // distDir 절대 쓰지 않기!
};
export default nextConfig;


