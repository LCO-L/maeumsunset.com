# SunSet — static export (UI/UX preserved)
Changes:
- Added 'use client' to interactive pages/components (page.tsx, write/, campfire/, result/, EmotionMap.tsx)
- next.config.mjs: output:'export', basePath:'', trailingSlash:true, images.unoptimized:true
- postcss.config.js for Tailwind v4
- public/favicon.ico
- package scripts: build:docs, build:docs:domain
- docs/CNAME (maeumsunset.com), docs/.nojekyll

Build & Deploy:
npm ci
export DOMAIN=maeumsunset.com
npm run build:docs:domain
git add docs && git commit -m "Deploy" && git push
