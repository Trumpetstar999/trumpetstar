# Deployment Guide

VPS details: `72.60.17.112` — Nginx on multiple ports.

## Port Selection

Check which ports are in use, pick the next free one:
```bash
grep -r "listen " /etc/nginx/sites-enabled/ | grep -oP '\d{4,5}' | sort -n
# Tischlerei Fasching uses 8080
# Next client: use 8081, 8082, etc.
```

## 1. Webroot Setup

```bash
PROJECT_SLUG="<slug>"
WEBROOT="/var/www/$PROJECT_SLUG"
PORT=8081   # adjust per above

mkdir -p "$WEBROOT"
```

## 2. Build & Deploy

```bash
cd "/root/.openclaw/workspace/$PROJECT_SLUG"
npm run build

cp -r dist/* "$WEBROOT/"

# CRITICAL: Fix permissions after every deploy
# Missing execute bit on dirs = 403 on all static files
find "$WEBROOT" -type d -exec chmod 755 {} \;
find "$WEBROOT" -type f -exec chmod 644 {} \;
```

## 3. Nginx Config

Create `/etc/nginx/sites-available/$PROJECT_SLUG`:

```nginx
server {
    listen <PORT>;
    listen [::]:<PORT>;
    server_name _;

    root /var/www/<PROJECT_SLUG>;
    index index.html;

    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml;
    gzip_min_length 256;

    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        expires 7d;
        add_header Cache-Control "public";
    }

    location = /admin { return 301 /admin/; }
    location /admin/ {
        proxy_pass http://127.0.0.1:<ADMIN_PORT>/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 10M;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Enable + reload:
```bash
ln -sf /etc/nginx/sites-available/$PROJECT_SLUG /etc/nginx/sites-enabled/
nginx -t && nginx -s reload
```

## 4. Admin Panel Setup

Admin port = site port + 1000 (e.g., site 8081 → admin 3002).
Update `admin/server.js`:
```js
const PORT = 3002;   // unique per project
users: { 'admin': '<generated-password>' }
```

Update the Nginx `/admin/` proxy_pass to match.

Start admin server:
```bash
cd "/root/.openclaw/workspace/$PROJECT_SLUG/admin"
npm install
node server.js &   # background via exec background:true
```

## 5. Smoke Tests

```bash
# Site live
curl -s -o /dev/null -w "Site: %{http_code}\n" http://72.60.17.112:<PORT>/

# Image accessible (catches permission issues)
curl -s -o /dev/null -w "Img: %{http_code}\n" http://72.60.17.112:<PORT>/images/hero-1.jpg

# Admin
curl -s -u admin:<password> -o /dev/null -w "Admin: %{http_code}\n" http://127.0.0.1:<ADMIN_PORT>/panel.html
```

All must return 200.

## 6. Git Integration

Repo: `/root/.openclaw/workspace/trumpetstar`
Projects live under: `client-projects/<PROJECT_SLUG>/`

```bash
REPO="/root/.openclaw/workspace/trumpetstar"
DEST="$REPO/client-projects/$PROJECT_SLUG"
mkdir -p "$DEST"

cp -r "/root/.openclaw/workspace/$PROJECT_SLUG/src" \
      "/root/.openclaw/workspace/$PROJECT_SLUG/public" \
      "/root/.openclaw/workspace/$PROJECT_SLUG/content.json" \
      "/root/.openclaw/workspace/$PROJECT_SLUG/astro.config.mjs" \
      "/root/.openclaw/workspace/$PROJECT_SLUG/package.json" \
      "/root/.openclaw/workspace/$PROJECT_SLUG/admin" \
      "$DEST/"

cd "$REPO"
git add "client-projects/$PROJECT_SLUG/"
git commit -m "feat($PROJECT_SLUG): initial build"
git push origin main
```

## Auto-Restart After VPS Reboot

The admin server does NOT auto-start after a reboot (no systemd service yet).
To add: create `/etc/systemd/system/admin-<PROJECT_SLUG>.service`.
Otherwise, after reboot: `cd /root/.openclaw/workspace/<slug>/admin && node server.js &`

## Re-deploy After Admin Changes (content.json update)

The admin server already handles this automatically:
`POST /api/content` → writes content.json → runs build → copies to webroot → fixes permissions.
No manual intervention needed for content-only updates.
