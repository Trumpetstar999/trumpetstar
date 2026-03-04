---
name: onepager-builder
description: Build complete, production-ready one-page websites for small businesses (tradespeople, service providers, freelancers). Use when a user says "MAX-Code baue mir eine Website", "baue eine Landingpage für...", or provides a business brief and wants a full site. Produces an Astro SSG site with drag-and-drop admin panel, auto-deploy to VPS via Nginx, and optional Facebook/Maps integration. Covers build, deploy, git push in one autonomous run.
---

# Onepager Builder

Builds a full one-page business website from a brief. Uses the proven Tischlerei Fasching template as the structural and visual foundation — **always adapt design to the client's brand**.

## Workflow

### 1. Parse the Brief

Extract from the user's message (ask for missing critical fields only):

| Field | Required | Default |
|-------|----------|---------|
| `companyName` | ✅ | — |
| `industry` / `offer` | ✅ | — |
| `primaryColor` | ❌ | `#E8611A` |
| `phone` / `email` | ❌ | — |
| `address` | ❌ | — |
| `facebookUrl` | ❌ | skip |
| `logoPath` | ❌ | text-only nav |
| `vpsPort` | ❌ | next free port after 8080 |
| `adminPassword` | ❌ | generate random |

→ See `references/content-schema.md` for full `content.json` schema.

### 2. Set Up Project

```bash
PROJECT_SLUG=$(echo "$companyName" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
PROJECT_DIR="/root/.openclaw/workspace/$PROJECT_SLUG"
WEBROOT="/var/www/$PROJECT_SLUG"

# Copy template
cp -r ~/.openclaw/workspace/skills/onepager-builder/assets/template "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Install dependencies
npm install
cd admin && npm install && cd ..
```

### 3. Adapt the Design

→ See `references/design-system.md` for CSS variable reference and adaptation guide.

**Minimum required changes in `src/styles/global.css`:**
```css
:root {
  --orange:      <primaryColor>;
  --orange-dark: <primaryColor darkened 15%>;
  --charcoal:    <secondaryColor or #2C2C2C>;
  /* rest stays unless brief specifies otherwise */
}
```

Update the comment header in global.css to reflect the new client.

### 4. Fill content.json

Replace ALL placeholder values. Use the client's actual data.
→ Schema: `references/content-schema.md`

Key rules:
- `hero.slides`: at least 1 slide (use a real image URL or `/images/hero-1.jpg` placeholder)
- `leistungen.items`: each item needs a unique `image` (download externally or use gallery images)
- `contact.address`: will auto-link to Google Maps (already wired in template)
- Remove `"_note"` fields before going live

### 5. Source Images

```bash
# Download external images
curl -L "<url>" -o public/images/hero-1.jpg

# After download, always fix permissions
chmod 644 public/images/*.jpg
```

If no real images: use placeholder services temporarily:
```
https://placehold.co/1200x750/2C2C2C/E8611A?text=<CompanyName>
```

### 6. Update Admin Panel

In `admin/server.js` — change the password:
```js
users: { 'admin': '<adminPassword>' }
```

### 7. Build & Deploy

→ See `references/deploy.md` for full VPS + Nginx + process manager setup.

```bash
# Build
cd "$PROJECT_DIR" && npm run build

# Fix permissions (critical — prevents 403 on images)
cp -r dist/* "$WEBROOT/"
find "$WEBROOT" -type d -exec chmod 755 {} \;
find "$WEBROOT" -type f -exec chmod 644 {} \;

# Smoke test
curl -s -o /dev/null -w "HTTP %{http_code}" http://72.60.17.112:$vpsPort/
```

### 8. Git Push

```bash
REPO="/root/.openclaw/workspace/trumpetstar"
cp -r "$PROJECT_DIR/src" "$PROJECT_DIR/public" "$PROJECT_DIR/content.json" \
      "$PROJECT_DIR/admin" "$REPO/client-projects/$PROJECT_SLUG/"
cd "$REPO"
git add client-projects/$PROJECT_SLUG/
git commit -m "feat($PROJECT_SLUG): initial build"
git push origin main
```

### 9. Final Report

Always end with:
```
✅ Live: http://72.60.17.112:<port>/
🔐 Admin: http://72.60.17.112:<port>/admin/ (admin / <password>)
📦 Commit: <hash>
```

## Design Adaptation Guide

The template uses a **dark-hero, light-body** layout. Sections:
`Hero → Leistungen → About → Testimonials → Gallery → FAQ → Contact → Legal → Footer`

To change the look beyond colors, see `references/design-system.md`.

## What NOT to change without reason

- `IntersectionObserver` animation logic (tested, works)
- Google Maps link wiring on address field
- Admin server permission-fix after build (critical)
- `contact-info-content span { display: block }` (multi-line hours)
