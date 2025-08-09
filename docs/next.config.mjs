/** @type {import('next').NextConfig} */
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'REPLACE_WITH_REPO';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: `/${repo}`,
  trailingSlash: true
};

export default nextConfig;
