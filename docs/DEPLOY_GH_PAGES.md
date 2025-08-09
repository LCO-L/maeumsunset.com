# Deploy SunSet to GitHub Pages (docs/ folder)

## Steps
1) GitHub → **Settings → Pages**: Source = *Deploy from a branch*, Branch = `main`, Folder = `/docs`.
2) (Optional) Custom domain: add your domain in Pages, create DNS (CNAME → <username>.github.io), and commit `docs/CNAME`.
3) Local build:
   ```bash
   npm ci
   npm run build:docs   # creates ./docs with static site
   git add docs && git commit -m "Deploy" && git push
   ```

Notes:
- `trailingSlash: true` ensures deep links like `/campfire/` resolve as `campfire/index.html` on GitHub Pages.
- Tailwind v4 needs `postcss.config.js` with `@tailwindcss/postcss` plugin.
