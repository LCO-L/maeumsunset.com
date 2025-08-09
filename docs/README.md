# SunSet — GitHub Pages (custom domain)
- Domain: maeumsunset.com
- Pages → Branch: main, Folder: /docs

## Local deploy
npm ci
export DOMAIN=maeumsunset.com
npm run build:docs:domain
git add docs && git commit -m "Deploy" && git push
