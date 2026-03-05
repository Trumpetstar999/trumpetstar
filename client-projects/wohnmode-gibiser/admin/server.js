// Gibiser Admin Server
const express = require('express');
const multer = require('multer');
const basicAuth = require('express-basic-auth');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 3004;

// Paths
const CONTENT_JSON = path.join(__dirname, '../content.json');
const IMAGES_DIR = path.join(__dirname, '../public/images');
const WEBROOT = '/var/www/wohnmode-gibiser';
const SITE_DIR = path.join(__dirname, '..');

// Ensure directories
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Build state
let buildRunning = false;
let lastBuildResult = { ok: null, time: null };

// Auth
app.use(basicAuth({
  users: { 'admin': 'Gibiser2026!' },
  challenge: true,
  realm: 'Wohnmode Gibiser Admin'
}));

// Body parsing
app.use(express.json({ limit: '2mb' }));

// Static files
const ADMIN_DIST = path.join(__dirname, 'frontend-dist');
app.use(express.static(ADMIN_DIST));
app.use('/site-images', express.static(IMAGES_DIR));

// SPA fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(ADMIN_DIST, 'index.html'));
});

// ════════════════════════════════════════════════════════════════════════
// API: Content
// ════════════════════════════════════════════════════════════════════════

// GET content
app.get('/api/content', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(CONTENT_JSON, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST content
app.post('/api/content', (req, res) => {
  try {
    fs.writeFileSync(CONTENT_JSON, JSON.stringify(req.body, null, 2), 'utf8');
    triggerBuild();
    res.json({ ok: true, message: 'Gespeichert – Build läuft…' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════════════════════════════════════════════════════════════
// API: Images
// ════════════════════════════════════════════════════════════════════════

// GET images list
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(IMAGES_DIR, f));
        return {
          name: f,
          path: `/site-images/${f}`,
          size: stat.size,
          mtime: stat.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json(files);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST upload image
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload/:filename', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Kein Bild' });
    }
    
    const filename = req.params.filename;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Security check
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ ok: false, error: 'Ungültiger Dateiname' });
    }
    
    fs.writeFileSync(filepath, req.file.buffer);
    triggerBuild();
    
    res.json({ 
      ok: true, 
      path: `/images/${filename}`,
      message: `${filename} hochgeladen – Build läuft…`
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE image
app.delete('/api/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Security check
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ ok: false, error: 'Ungültiger Dateiname' });
    }
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ ok: false, error: 'Datei nicht gefunden' });
    }
    
    fs.unlinkSync(filepath);
    triggerBuild();
    
    res.json({ ok: true, message: `${filename} gelöscht` });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════════════════════════════════════════════════════════════
// API: Build Status
// ════════════════════════════════════════════════════════════════════════

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
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════════════════════════════════════════════════════════════
// Build Helper
// ════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════
// Start Server
// ════════════════════════════════════════════════════════════════════════

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Gibiser Admin Panel: http://127.0.0.1:${PORT}/`);
});
