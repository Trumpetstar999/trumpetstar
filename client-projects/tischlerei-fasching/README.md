# Tischlerei Fasching OG — Landingpage

**Variant D (Minimal/Premium)** — Astro Static Site

---

## In 10 Minuten Inhalte ändern

Alle Texte, Bilder, CTAs und Kontaktdaten findest du in einer einzigen Datei:

**→ `content.json`**

### Texte ändern
Öffne `content.json` und passe die Werte an. Danach neu builden:
```bash
npm run build
```

### Bilder tauschen
1. Lege deine Bilder in `/public/images/` ab (empfohlen: WebP oder JPG, max 1 MB)
2. Trage den Dateinamen in `content.json` ein:
   - Hero-Bilder: `hero.slides[].src` (z.B. `"/images/hero-wohnzimmer.jpg"`)
   - Galerie: `gallery.images[].src`
3. Setze immer einen sinnvollen `alt`-Text (wichtig für SEO & Barrierefreiheit)

**Empfohlene Bildgrößen:**
- Hero: 1400 × 900 px
- Galerie: 800 × 600 px
- OG-Image: 1200 × 630 px (für Social Media)

### Varianten (A/B/C/D)
Ändere `"variant": "D"` in `content.json` — aktuell ist nur Variant D implementiert.

### Kontaktformular
Das Formular verwendet `mailto:` als Fallback (kein Server nötig). Für ein robusteres Formular empfehlen wir:
- [Formspree](https://formspree.io) (kostenlos bis 50/Monat)
- [Netlify Forms](https://www.netlify.com/products/forms/) (wenn auf Netlify gehostet)

Ersetze dazu im Formular-Tag:
```html
<!-- Aktuell: -->
<form action="mailto:office@wohnen-fasching.com" method="get">

<!-- Mit Formspree: -->
<form action="https://formspree.io/f/DEINE-FORM-ID" method="POST">
```

---

## Bauen & Deploy

```bash
# Entwicklungsserver
npm run dev

# Produktions-Build → erzeugt /dist Ordner
npm run build

# Lokale Vorschau des Builds
npm run preview
```

### Deploy: /dist Ordner auf Server kopieren

```bash
# Beispiel mit rsync
rsync -avz dist/ user@your-server:/var/www/wohnen-fasching/

# Oder mit scp
scp -r dist/* user@your-server:/var/www/wohnen-fasching/
```

### Deploy auf VPS (Nginx)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name wohnen-fasching.com www.wohnen-fasching.com;

    # HTTPS redirect (empfohlen mit Let's Encrypt)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name wohnen-fasching.com www.wohnen-fasching.com;

    ssl_certificate /etc/letsencrypt/live/wohnen-fasching.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wohnen-fasching.com/privkey.pem;

    root /var/www/wohnen-fasching/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching für Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml;
}
```

### Deploy auf Netlify/Vercel

**Netlify:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Vercel:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## Projekt-Struktur

```
tischlerei-fasching/
├── content.json          ← ✏️ HIER ALLE INHALTE ANPASSEN
├── astro.config.mjs
├── src/
│   ├── layouts/
│   │   └── Base.astro    ← HTML-Grundstruktur, Meta-Tags, Schema.org
│   ├── pages/
│   │   └── index.astro   ← Alle Sections der One-Pager
│   └── styles/
│       └── global.css    ← Alle CSS-Styles
└── public/
    ├── images/           ← ✏️ BILDER HIER ABLEGEN
    ├── sitemap.xml
    └── robots.txt
```

---

## SEO-Checkliste

- [x] Meta Title + Description
- [x] Open Graph Tags (Facebook/LinkedIn)
- [x] Twitter Card
- [x] Canonical URL
- [x] Schema.org LocalBusiness JSON-LD
- [x] sitemap.xml
- [x] robots.txt
- [ ] **OG-Image** → echtes Foto unter `/public/images/og-image.jpg` ablegen (1200×630px)
- [ ] **Google Search Console** verifizieren

---

## ⚠️ Offene ToDos

1. **Echte Fotos** in `/public/images/` ablegen (Hero + Galerie)
2. **Testimonials** durch echte Kundenbewertungen ersetzen (PLATZHALTER-Hinweis in der Seite sichtbar)
3. **Kontaktformular-Backend** einrichten (Formspree, Netlify Forms oder eigener Server)
4. **Google My Business** Profil verlinken/einbetten
5. **SSL-Zertifikat** (Let's Encrypt) auf dem Server einrichten
6. **Öffnungszeiten** in Schema.org JSON-LD eintragen (in `Base.astro`)

---

## Technische Details

- **Framework:** Astro 4.x (Static Output)
- **Variant:** D — Minimal/Premium
- **Fonts:** System Fonts (keine Google Fonts → bessere Performance)
- **Tracking:** Keines (kein Cookie-Banner nötig)
- **CSS:** Custom Properties, kein Framework (lightweight)
- **Accessibility:** Skip-Link, ARIA-Labels, `<details>` FAQ, Focus-Visible
- **Performance:** Kritisches CSS inline, Lazy Loading, fetchpriority="high" für LCP-Bild

---

*Erstellt mit MAX-Code / OpenClaw · März 2026*
