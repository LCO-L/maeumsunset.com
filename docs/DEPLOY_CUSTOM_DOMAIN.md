# Custom Domain Deploy (maeumsunset.com)

1) GitHub → Settings → Pages
   - Source: Deploy from a branch
   - Branch: main, Folder: /docs

2) DNS
   - CNAME of `maeumsunset.com` → `<username>.github.io`

3) Build (creates docs/ + CNAME)
   ```bash
   npm ci
   export DOMAIN=maeumsunset.com
   npm run build:docs:domain
   git add docs && git commit -m "Deploy" && git push
   ```

Notes:
- next.config.mjs uses basePath = '' for a root custom domain.
- trailingSlash = true so /campfire/ etc. resolve to folders.
