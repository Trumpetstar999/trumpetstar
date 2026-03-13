// admin/server.js — Tischlerei Fasching Admin Panel
const express = require('express');
const multer = require('multer');
const basicAuth = require('express-basic-auth');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

const CONTENT_JSON = path.join(__dirname, '../content.json');
const IMAGES_DIR = path.join(__dirname, '../public/images');
const WEBROOT = '/var/www/tischlerei-fasching';
const SITE_DIR = path.join(__dirname, '..');

// Ensure images dir exists
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ── Basic Auth ──────────────────────────────────────────────────────────────
app.use(basicAuth({
  users: { 'admin': '7c4PVA2P3XM' },
  challenge: true,
  realm: 'Tischlerei Fasching Admin'
}));

app.use(express.json({ limit: '2mb' }));

// Serve admin panel files (panel.html etc.)
app.use(express.static(__dirname, { index: 'panel.html' }));
// Root redirect to panel.html
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'panel.html')));

// Serve site images under /site-images
app.use('/site-images', express.static(IMAGES_DIR));

// ── Build helper ─────────────────────────────────────────────────────────────
let buildRunning = false;
let lastBuildResult = { ok: null, time: null };

function triggerBuild() {
  if (buildRunning) {
    console.log('[build] already running, skipping');
    return;
  }
  buildRunning = true;
  console.log('[build] starting…');
  exec(
    `cd "${SITE_DIR}" && npm run build && cp -r dist/* "${WEBROOT}/" && find "${WEBROOT}" -type d -exec chmod 755 {} \; && find "${WEBROOT}" -type f -exec chmod 644 {} \;`,
    { timeout: 180000 },
    (err, stdout, stderr) => {
      buildRunning = false;
      if (err) {
        console.error('[build] ERROR:', err.message);
        lastBuildResult = { ok: false, time: new Date().toISOString(), error: err.message };
      } else {
        console.log('[build] OK');
        lastBuildResult = { ok: true, time: new Date().toISOString() };
      }
    }
  );
}

// ── API: Content ─────────────────────────────────────────────────────────────

// GET /api/content
app.get('/api/content', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(CONTENT_JSON, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/content
app.post('/api/content', (req, res) => {
  try {
    fs.writeFileSync(CONTENT_JSON, JSON.stringify(req.body, null, 2), 'utf8');
    triggerBuild();
    res.json({ ok: true, message: 'Gespeichert – Site wird neu gebaut…' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── API: Image Upload ─────────────────────────────────────────────────────────

// POST /api/upload/:target
app.post('/api/upload/:target', (req, res) => {
  const target = req.params.target;

  const uploadSingle = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, IMAGES_DIR),
      filename: (req, file, cb) => cb(null, target)
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Nur Bilddateien erlaubt'));
    }
  }).single('image');

  uploadSingle(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, error: err.message });
    triggerBuild();
    res.json({
      ok: true,
      path: `/images/${target}`,
      message: `${target} hochgeladen – Site wird aktualisiert…`
    });
  });
});

// ── API: Images list ──────────────────────────────────────────────────────────

app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(IMAGES_DIR, f));
        return { name: f, path: `/site-images/${f}`, size: stat.size, mtime: stat.mtime };
      });
    res.json(files);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── API: Build status ─────────────────────────────────────────────────────────

app.get('/api/build-status', (req, res) => {
  try {
    const distPath = path.join(SITE_DIR, 'dist/index.html');
    const distStat = fs.existsSync(distPath) ? fs.statSync(distPath) : null;
    const contentStat = fs.statSync(CONTENT_JSON);
    res.json({
      ok: true,
      running: buildRunning,
      upToDate: distStat ? distStat.mtime >= contentStat.mtime : false,
      lastBuild: lastBuildResult,
      distMtime: distStat ? distStat.mtime : null,
      contentMtime: contentStat.mtime
    });
  } catch (e) {
    res.json({ ok: false, error: e.message, running: buildRunning });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✓ Fasching Admin Panel: http://127.0.0.1:${PORT}/panel.html`);
});
