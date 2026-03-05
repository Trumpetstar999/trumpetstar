// Gibiser Admin Panel - Modern Vanilla JS (Productized Edition)
const API_BASE = '';

// State
let content = {};
let images = [];
let currentSection = 'dashboard';
let hasChanges = false;
let buildStatusSnapshot = null;

const NAV_GROUPS = [
  {
    title: 'Setup',
    description: 'Grundlagen & SEO',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'site', label: 'Projekt-Basis', icon: '🏷️' },
      { id: 'meta', label: 'SEO / Meta & OG', icon: '🔍' },
      { id: 'hero', label: 'Hero & Bühne', icon: '🏠' },
      { id: 'cta', label: 'Calls-to-Action', icon: '🎯' },
      { id: 'leistungen', label: 'Leistungen', icon: '🛠️' }
    ]
  },
  {
    title: 'Story',
    description: 'Emotion & Social Proof',
    items: [
      { id: 'about', label: 'About & Highlights', icon: 'ℹ️' },
      { id: 'testimonials', label: 'Testimonials', icon: '💬' },
      { id: 'gallery', label: 'Galerie', icon: '🖼️' }
    ]
  },
  {
    title: 'Experience',
    description: 'FAQ & Kontaktflächen',
    items: [
      { id: 'faq', label: 'FAQ', icon: '❓' },
      { id: 'contact', label: 'Kontakt & Öffnungszeiten', icon: '📞' },
      { id: 'footer', label: 'Footer & Links', icon: '🔗' },
      { id: 'impressum', label: 'Impressum', icon: '📜' }
    ]
  },
  {
    title: 'System',
    description: 'Medien & Deploy',
    items: [
      { id: 'images', label: 'Medienbibliothek', icon: '📁' },
      { id: 'build', label: 'Build & Status', icon: '⚙️' }
    ]
  }
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
  await loadImages();
  await loadBuildStatus();
  renderNavigation();
  showSection('dashboard');
  setupEventListeners();
});

// API Functions
async function loadContent() {
  try {
    const res = await fetch(`${API_BASE}/api/content`);
    content = await res.json();
  } catch (e) {
    console.error('Failed to load content:', e);
    showToast('Fehler beim Laden der Inhalte', 'error');
  }
}

async function loadImages() {
  try {
    const res = await fetch(`${API_BASE}/api/images`);
    images = await res.json();
  } catch (e) {
    console.error('Failed to load images:', e);
  }
}

async function loadBuildStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/build-status`);
    buildStatusSnapshot = await res.json();
    applyBuildStatusSnapshot();
  } catch (e) {
    console.warn('Build status unavailable', e);
    setBuildStatus('error');
  }
}

async function saveContent() {
  try {
    const res = await fetch(`${API_BASE}/api/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
    const result = await res.json();
    if (result.ok) {
      hasChanges = false;
      updateSaveButton();
      showToast('✅ Gespeichert! Build läuft…', 'success');
      pollBuildStatus();
    } else {
      showToast('❌ Fehler beim Speichern', 'error');
    }
  } catch (e) {
    showToast('❌ Fehler: ' + e.message, 'error');
  }
}

async function uploadImage(file, filename = null) {
  if (!filename) filename = file.name;
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const formData = new FormData();
  formData.append('image', file);
  try {
    showToast(`⏳ Lade ${filename}…`, 'info');
    const res = await fetch(`${API_BASE}/api/upload/${encodeURIComponent(filename)}`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (result.ok) {
      showToast(`✅ ${filename} hochgeladen`, 'success');
      await loadImages();
      return result.path;
    } else {
      showToast('❌ Upload fehlgeschlagen', 'error');
      return null;
    }
  } catch (e) {
    showToast('❌ Upload Fehler: ' + e.message, 'error');
    return null;
  }
}

async function deleteImage(filename) {
  if (!confirm(`🗑️ "${filename}" wirklich löschen?`)) return;
  try {
    showToast(`⏳ Lösche ${filename}…`, 'info');
    const res = await fetch(`${API_BASE}/api/delete/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (result.ok) {
      showToast(`✅ ${filename} gelöscht`, 'success');
      await loadImages();
      renderCurrentSection();
    } else {
      showToast('❌ Löschen fehlgeschlagen', 'error');
    }
  } catch (e) {
    showToast('❌ Fehler: ' + e.message, 'error');
  }
}

async function pollBuildStatus() {
  setBuildStatus('building');
  let attempts = 0;
  const maxAttempts = 30;
  const check = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/build-status`);
      const status = await res.json();
      buildStatusSnapshot = status;
      if (status.running) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 2000);
        } else {
          setBuildStatus('error');
        }
      } else if (status.upToDate) {
        setBuildStatus('ok');
        showToast('✅ Build abgeschlossen!', 'success');
      } else {
        setBuildStatus('outdated');
      }
    } catch (e) {
      setBuildStatus('error');
    }
  };
  check();
}

function applyBuildStatusSnapshot() {
  if (!buildStatusSnapshot) {
    setBuildStatus('outdated');
    return;
  }
  if (buildStatusSnapshot.running) {
    setBuildStatus('building');
  } else if (buildStatusSnapshot.upToDate) {
    setBuildStatus('ok');
  } else {
    setBuildStatus('outdated');
  }
}

// UI Functions
function renderNavigation() {
  const nav = document.getElementById('main-nav');
  nav.innerHTML = NAV_GROUPS.map(group => `
    <div class="nav-group">
      <div class="nav-group-title">
        <div>
          <div class="nav-group-label">${group.title}</div>
          <div class="nav-group-desc">${group.description}</div>
        </div>
      </div>
      ${group.items.map(item => `
        <button class="nav-item ${currentSection === item.id ? 'active' : ''}" onclick="showSection('${item.id}')">
          <span class="nav-icon">${item.icon}</span>
          <div class="nav-item-text">
            <span>${item.label}</span>
            ${sectionBadge(item.id)}
          </div>
        </button>
      `).join('')}
    </div>
  `).join('');
}

function sectionBadge(sectionId) {
  if (sectionId === 'meta') {
    const titleLen = (content.meta?.title || '').length;
    const descLen = (content.meta?.description || '').length;
    if (titleLen > 65 || descLen > 160) {
      return '<span class="badge warning">Limit</span>';
    }
  }
  if (sectionId === 'hero' && !(content.hero?.slides?.length)) {
    return '<span class="badge warning">Slide fehlt</span>';
  }
  return '';
}

function showSection(section) {
  currentSection = section;
  renderNavigation();
  renderCurrentSection();
}

function renderCurrentSection() {
  const main = document.getElementById('main-content');
  switch (currentSection) {
    case 'dashboard':
      main.innerHTML = renderDashboard();
      break;
    case 'site':
      main.innerHTML = renderSite();
      break;
    case 'meta':
      main.innerHTML = renderMeta();
      break;
    case 'hero':
      main.innerHTML = renderHero();
      break;
    case 'cta':
      main.innerHTML = renderCTA();
      break;
    case 'leistungen':
      main.innerHTML = renderLeistungen();
      break;
    case 'about':
      main.innerHTML = renderAbout();
      break;
    case 'testimonials':
      main.innerHTML = renderTestimonials();
      break;
    case 'gallery':
      main.innerHTML = renderGallery();
      break;
    case 'faq':
      main.innerHTML = renderFAQ();
      break;
    case 'contact':
      main.innerHTML = renderContact();
      break;
    case 'footer':
      main.innerHTML = renderFooter();
      break;
    case 'impressum':
      main.innerHTML = renderImpressum();
      break;
    case 'images':
      main.innerHTML = renderImages();
      break;
    case 'build':
      main.innerHTML = renderBuildStatus();
      break;
    default:
      main.innerHTML = '<p>Bereich nicht gefunden.</p>';
  }
  setupEditableFields();
  refreshCharCounts();
}

function renderDashboard() {
  return `
    <div class="section">
      <h1>Dashboard</h1>
      <div class="card callout info">
        <strong>Produktstatus</strong>
        <p>Alle Inhalte werden live auf http://72.60.17.112:8083/ ausgespielt. Speichern löst automatisch einen Build inkl. Deployment aus.</p>
      </div>
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-label">Hero Slides</div>
          <div class="stat-value">${content.hero?.slides?.length || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Leistungen</div>
          <div class="stat-value">${content.leistungen?.items?.length || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Testimonials</div>
          <div class="stat-value">${content.testimonials?.items?.length || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">FAQ-Einträge</div>
          <div class="stat-value">${content.faq?.items?.length || 0}</div>
        </div>
      </div>
      <div class="quick-actions">
        <h2>Schnellzugriff</h2>
        <div class="action-buttons">
          <button onclick="showSection('hero')" class="btn btn-secondary">🏠 Hero optimieren</button>
          <button onclick="showSection('meta')" class="btn btn-secondary">🔍 Meta & OG</button>
          <button onclick="showSection('images')" class="btn btn-secondary">📁 Medien verwalten</button>
        </div>
      </div>
    </div>
  `;
}

function renderSite() {
  const site = content.site || {};
  return `
    <div class="section">
      <h1>Projekt-Basis</h1>
      <div class="card-grid">
        <div class="card">
          <h3>Markenname</h3>
          <div class="editable" data-path="site.name" contenteditable="true">${site.name || ''}</div>
          <p class="hint">Pflichtfeld · erscheint überall im Frontend.</p>
        </div>
        <div class="card">
          <h3>Tagline</h3>
          <div class="editable" data-path="site.tagline" contenteditable="true">${site.tagline || ''}</div>
        </div>
        <div class="card">
          <h3>URL</h3>
          <div class="editable" data-path="site.url" contenteditable="true">${site.url || ''}</div>
          <p class="hint">Bitte mit https:// starten.</p>
        </div>
        <div class="card">
          <h3>Beschreibung</h3>
          <div class="editable multiline" data-path="site.description" contenteditable="true">${site.description || ''}</div>
        </div>
        <div class="card">
          <h3>Sprache / Locale</h3>
          <div class="form-row">
            <div>
              <label>Lang (ISO)</label>
              <div class="editable" data-path="site.lang" contenteditable="true">${site.lang || ''}</div>
            </div>
            <div>
              <label>Locale</label>
              <div class="editable" data-path="site.locale" contenteditable="true">${site.locale || ''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMeta() {
  const meta = content.meta || {};
  return `
    <div class="section">
      <h1>SEO / Meta</h1>
      <div class="card callout info">
        <strong>Best Practice</strong>
        <p>Title max. 65 Zeichen, Description max. 160 Zeichen. OG-Image wird auf Social Media angezeigt (1200×630px).</p>
      </div>
      <div class="card">
        <h3>Meta Title</h3>
        <div class="editable" data-path="meta.title" contenteditable="true">${meta.title || ''}</div>
        <div class="char-count" data-count-for="meta.title" data-max="65"></div>
      </div>
      <div class="card">
        <h3>Meta Description</h3>
        <div class="editable multiline" data-path="meta.description" contenteditable="true">${meta.description || ''}</div>
        <div class="char-count" data-count-for="meta.description" data-max="160"></div>
      </div>
      <div class="card-grid">
        <div class="card">
          <h3>OG Image</h3>
          <img src="${meta.ogImage || content.hero?.slides?.[0]?.src || '/images/placeholder.jpg'}" class="preview-image" onclick="selectImageFor('meta.ogImage')">
          <button class="btn btn-secondary" onclick="selectImageFor('meta.ogImage')">🖼️ Bild wählen</button>
        </div>
        <div class="card">
          <h3>Canonical URL</h3>
          <div class="editable" data-path="meta.canonical" contenteditable="true">${meta.canonical || ''}</div>
        </div>
      </div>
    </div>
  `;
}

function renderHero() {
  const hero = content.hero || {};
  return `
    <div class="section">
      <div class="section-head">
        <h1>Hero & Bühne</h1>
        <div class="badge neutral">${hero.slides?.length || 0} Slides</div>
      </div>
      <div class="card">
        <h3>Headline</h3>
        <div class="editable" data-path="hero.headline" contenteditable="true">${hero.headline || ''}</div>
      </div>
      <div class="card">
        <h3>Subline</h3>
        <div class="editable multiline" data-path="hero.subheadline" contenteditable="true">${hero.subheadline || ''}</div>
      </div>
      <div class="card">
        <div class="callout warn">
          <strong>Hero Slides</strong>
          <p>Mindestens 1 Slide, ideal 3–4. Bildgröße ≥ 2000px, JPG/WebP &lt; 800 KB.</p>
        </div>
        <div class="slides-grid">
          ${(hero.slides || []).map((slide, i) => `
            <div class="slide-card">
              <img src="${slide.src}" class="slide-preview" onclick="selectImageFor('hero.slides.${i}.src')">
              <div class="editable" data-path="hero.slides.${i}.alt" contenteditable="true" placeholder="Alt-Text">${slide.alt || ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCTA() {
  ensureCTA();
  const primary = content.hero.cta.primary;
  const secondary = content.hero.cta.secondary;
  return `
    <div class="section">
      <h1>Calls-to-Action</h1>
      <div class="card-grid">
        <div class="card">
          <h3>Primary CTA</h3>
          <label>Button-Text</label>
          <div class="editable" data-path="hero.cta.primary.text" contenteditable="true">${primary.text || ''}</div>
          <label>Link / Ziel</label>
          <div class="editable" data-path="hero.cta.primary.href" contenteditable="true">${primary.href || ''}</div>
          <p class="hint">Unterstützt https://, mailto:, tel:</p>
        </div>
        <div class="card">
          <h3>Secondary CTA</h3>
          <label>Text</label>
          <div class="editable" data-path="hero.cta.secondary.text" contenteditable="true">${secondary.text || ''}</div>
          <label>Link</label>
          <div class="editable" data-path="hero.cta.secondary.href" contenteditable="true">${secondary.href || ''}</div>
        </div>
      </div>
    </div>
  `;
}

function renderLeistungen() {
  const items = content.leistungen?.items || [];
  return `
    <div class="section">
      <h1>Leistungen</h1>
      <div class="card">
        <div class="form-row">
          <div>
            <label>Headline</label>
            <div class="editable" data-path="leistungen.headline" contenteditable="true">${content.leistungen?.headline || ''}</div>
          </div>
          <div>
            <label>Subheadline</label>
            <div class="editable" data-path="leistungen.subheadline" contenteditable="true">${content.leistungen?.subheadline || ''}</div>
          </div>
        </div>
      </div>
      <div class="items-list">
        ${items.map((item, i) => `
          <div class="item-card">
            <div class="item-header">
              <img src="${item.image || '/images/placeholder.jpg'}" class="item-image" onclick="selectImageFor('leistungen.items.${i}.image')">
              <div class="item-actions">
                <button onclick="selectImageFor('leistungen.items.${i}.image')" class="btn btn-small">🖼️ Bild</button>
                <button onclick="removeLeistung(${i})" class="btn btn-small btn-danger">🗑️</button>
              </div>
            </div>
            <div class="item-content">
              <label>Titel</label>
              <div class="editable" data-path="leistungen.items.${i}.title" contenteditable="true">${item.title || ''}</div>
              <label>Beschreibung</label>
              <div class="editable multiline" data-path="leistungen.items.${i}.desc" contenteditable="true">${item.desc || item.text || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="addLeistung()" class="btn btn-primary add-btn">➕ Neue Leistung</button>
    </div>
  `;
}

function renderAbout() {
  const about = content.about || {};
  const highlights = about.highlights || [];
  return `
    <div class="section">
      <h1>About & Highlights</h1>
      <div class="card-grid">
        <div class="card">
          <h3>Headline</h3>
          <div class="editable" data-path="about.headline" contenteditable="true">${about.headline || ''}</div>
          <h3>Text</h3>
          <div class="editable multiline" data-path="about.text" contenteditable="true">${about.text || ''}</div>
        </div>
        <div class="card">
          <h3>Bild</h3>
          <img src="${about.image || '/images/placeholder.jpg'}" class="preview-image" onclick="selectImageFor('about.image')">
          <button class="btn btn-secondary" onclick="selectImageFor('about.image')">🖼️ Bild auswählen</button>
        </div>
      </div>
      <div class="card">
        <div class="section-head">
          <h3>Highlights</h3>
          <button class="btn btn-small" onclick="addHighlight()">➕ Highlight</button>
        </div>
        <div class="chip-list">
          ${highlights.map((h, i) => `
            <div class="chip">
              <span>${h}</span>
              <button onclick="removeHighlight(${i})">×</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTestimonials() {
  const items = content.testimonials?.items || [];
  return `
    <div class="section">
      <div class="section-head">
        <h1>Testimonials</h1>
        <button class="btn btn-small" onclick="addTestimonial()">➕ Testimonial</button>
      </div>
      <div class="items-list">
        ${items.length ? items.map((item, i) => `
          <div class="item-card">
            <label>Name</label>
            <div class="editable" data-path="testimonials.items.${i}.name" contenteditable="true">${item.name || ''}</div>
            <label>Text</label>
            <div class="editable multiline" data-path="testimonials.items.${i}.text" contenteditable="true">${item.text || ''}</div>
            <button class="btn btn-small btn-danger" onclick="removeTestimonial(${i})">🗑️ Löschen</button>
          </div>
        `).join('') : `<div class="empty-state">Noch keine Testimonials – starte mit ➕.</div>`}
      </div>
    </div>
  `;
}

function renderGallery() {
  const gallery = content.gallery || {};
  const imgs = gallery.images || [];
  return `
    <div class="section">
      <div class="section-head">
        <h1>Galerie</h1>
        <button class="btn btn-small" onclick="addGalleryImage()">➕ Bild</button>
      </div>
      <div class="gallery-grid">
        ${imgs.length ? imgs.map((img, i) => `
          <div class="gallery-item">
            <img src="${img.src}" class="gallery-preview" onclick="selectImageFor('gallery.images.${i}.src')">
            <div class="editable" data-path="gallery.images.${i}.caption" contenteditable="true">${img.caption || ''}</div>
            <button class="btn btn-small btn-danger" onclick="removeGalleryImage(${i})">🗑️</button>
          </div>
        `).join('') : '<div class="empty-state">Noch keine Bilder – bitte Medien auswählen.</div>'}
      </div>
    </div>
  `;
}

function renderFAQ() {
  const items = content.faq?.items || [];
  return `
    <div class="section">
      <div class="section-head">
        <h1>FAQ</h1>
        <button class="btn btn-small" onclick="addFAQ()">➕ Frage</button>
      </div>
      <div class="items-list">
        ${items.map((item, i) => `
          <div class="item-card faq-card">
            <label>Frage</label>
            <div class="editable" data-path="faq.items.${i}.q" contenteditable="true">${item.q || ''}</div>
            <label>Antwort</label>
            <div class="editable multiline" data-path="faq.items.${i}.a" contenteditable="true">${item.a || ''}</div>
            <button class="btn btn-small btn-danger" onclick="removeFAQ(${i})">🗑️</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderContact() {
  const contact = content.contact || {};
  const hours = contact.hours || [];
  const placeholders = contact.formPlaceholder || {};
  return `
    <div class="section">
      <h1>Kontakt & Öffnungszeiten</h1>
      <div class="card-grid">
        <div class="card">
          <label>Telefon</label>
          <div class="editable" data-path="contact.phone" contenteditable="true">${contact.phone || ''}</div>
          <label>E-Mail</label>
          <div class="editable" data-path="contact.email" contenteditable="true">${contact.email || ''}</div>
          <label>Adresse</label>
          <div class="editable multiline" data-path="contact.address" contenteditable="true">${contact.address || ''}</div>
        </div>
        <div class="card">
          <h3>Formular Placeholder</h3>
          <label>Name</label>
          <div class="editable" data-path="contact.formPlaceholder.name" contenteditable="true">${placeholders.name || ''}</div>
          <label>E-Mail</label>
          <div class="editable" data-path="contact.formPlaceholder.email" contenteditable="true">${placeholders.email || ''}</div>
          <label>Nachricht</label>
          <div class="editable" data-path="contact.formPlaceholder.message" contenteditable="true">${placeholders.message || ''}</div>
          <label>Button</label>
          <div class="editable" data-path="contact.formPlaceholder.submit" contenteditable="true">${placeholders.submit || ''}</div>
        </div>
      </div>
      <div class="card">
        <div class="section-head">
          <h3>Öffnungszeiten</h3>
        </div>
        ${hours.map((h, i) => `
          <div class="hours-row">
            <div class="editable" data-path="contact.hours.${i}.label" contenteditable="true">${h.label || ''}</div>
            <div class="editable" data-path="contact.hours.${i}.time" contenteditable="true">${h.time || ''}</div>
          </div>
        `).join('')}
        <label>Hinweis</label>
        <div class="editable" data-path="contact.hoursNotice" contenteditable="true">${contact.hoursNotice || ''}</div>
      </div>
    </div>
  `;
}

function renderFooter() {
  const footer = content.footer || {};
  const links = footer.links || [];
  return `
    <div class="section">
      <div class="section-head">
        <h1>Footer & Links</h1>
        <button class="btn btn-small" onclick="addFooterLink()">➕ Link</button>
      </div>
      <div class="card">
        <label>Copyright Text</label>
        <div class="editable" data-path="footer.copyright" contenteditable="true">${footer.copyright || ''}</div>
      </div>
      <div class="items-list">
        ${links.map((link, i) => `
          <div class="item-card">
            <label>Link-Text</label>
            <div class="editable" data-path="footer.links.${i}.text" contenteditable="true">${link.text || ''}</div>
            <label>URL</label>
            <div class="editable" data-path="footer.links.${i}.href" contenteditable="true">${link.href || ''}</div>
            <button class="btn btn-small btn-danger" onclick="removeFooterLink(${i})">🗑️ Entfernen</button>
          </div>
        `).join('')}
        ${links.length === 0 ? '<div class="empty-state">Noch keine Footer-Links.</div>' : ''}
      </div>
    </div>
  `;
}

function renderImpressum() {
  const impressum = content.impressum || {};
  const lines = impressum.lines || [];
  return `
    <div class="section">
      <div class="section-head">
        <h1>Impressum</h1>
        <button class="btn btn-small" onclick="addImpressumLine()">➕ Zeile</button>
      </div>
      <div class="card">
        <label>Überschrift</label>
        <div class="editable" data-path="impressum.title" contenteditable="true">${impressum.title || ''}</div>
      </div>
      <div class="items-list">
        ${lines.map((line, i) => `
          <div class="item-card simple">
            <div class="editable" data-path="impressum.lines.${i}" contenteditable="true">${line || ''}</div>
            <button class="btn btn-small btn-danger" onclick="removeImpressumLine(${i})">🗑️</button>
          </div>
        `).join('')}
        ${lines.length === 0 ? '<div class="empty-state">Noch keine Zeilen angelegt.</div>' : ''}
      </div>
    </div>
  `;
}

function renderImages() {
  return `
    <div class="section">
      <h1>Medienbibliothek</h1>
      <div class="upload-zone" id="upload-zone">
        <div class="upload-icon">📁</div>
        <p><strong>Bilder hierher ziehen</strong> oder klicken zum Auswählen</p>
        <p class="upload-hint">Mehrere Bilder auf einmal möglich</p>
        <input type="file" id="file-input" multiple accept="image/*" style="display:none">
      </div>
      <div class="images-grid" id="images-grid">
        ${images.map(img => `
          <div class="image-card">
            <img src="${img.path}?t=${Date.now()}" class="image-thumb">
            <div class="image-info">
              <div class="image-name">${img.name}</div>
              <div class="image-size">${Math.round(img.size / 1024)} KB</div>
            </div>
            <div class="image-actions">
              <button class="btn btn-small btn-danger" onclick="deleteImage('${img.name}')">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderBuildStatus() {
  const status = buildStatusSnapshot;
  return `
    <div class="section">
      <div class="section-head">
        <h1>Build & Deployment</h1>
        <button class="btn btn-small" onclick="loadBuildStatus()">↻ Refresh</button>
      </div>
      <div class="card">
        ${status ? `
          <p><strong>Status:</strong> ${status.running ? 'Baut…' : status.upToDate ? 'Live' : 'Veraltet'}</p>
          <p><strong>Letzter Build:</strong> ${status.lastBuild?.time ? new Date(status.lastBuild.time).toLocaleString() : '–'}</p>
          <p><strong>Resultat:</strong> ${status.lastBuild?.ok ? '✅ Erfolgreich' : status.lastBuild?.ok === false ? '❌ Fehler' : '–'}</p>
        ` : '<p>Keine Build-Daten verfügbar.</p>'}
        <div class="callout info">
          <strong>Hinweis</strong>
          <p>Jeder Speichervorgang erzeugt einen neuen Build inklusive Rechte-Fix im Webroot. Bei Fehlern bitte Logs prüfen.</p>
        </div>
      </div>
    </div>
  `;
}

// Data Modification Functions

function ensureCTA() {
  if (!content.hero) content.hero = {};
  if (!content.hero.cta) content.hero.cta = {};
  if (!content.hero.cta.primary) content.hero.cta.primary = { text: '', href: '' };
  if (!content.hero.cta.secondary) content.hero.cta.secondary = { text: '', href: '' };
}

function addLeistung() {
  if (!content.leistungen) content.leistungen = {};
  if (!content.leistungen.items) content.leistungen.items = [];
  content.leistungen.items.push({ title: 'Neue Leistung', desc: 'Beschreibung…', image: '' });
  markChanged();
  renderCurrentSection();
}

function removeLeistung(index) {
  if (!confirm('Wirklich löschen?')) return;
  content.leistungen.items.splice(index, 1);
  markChanged();
  renderCurrentSection();
}

function addGalleryImage() {
  if (!content.gallery) content.gallery = {};
  if (!content.gallery.images) content.gallery.images = [];
  content.gallery.images.push({ src: '/images/placeholder.jpg', caption: '' });
  markChanged();
  renderCurrentSection();
}

function removeGalleryImage(index) {
  if (!confirm('Wirklich löschen?')) return;
  content.gallery.images.splice(index, 1);
  markChanged();
  renderCurrentSection();
}

function addFAQ() {
  if (!content.faq) content.faq = {};
  if (!content.faq.items) content.faq.items = [];
  content.faq.items.push({ q: 'Neue Frage', a: 'Antwort…' });
  markChanged();
  renderCurrentSection();
}

function removeFAQ(index) {
  if (!confirm('Wirklich löschen?')) return;
  content.faq.items.splice(index, 1);
  markChanged();
  renderCurrentSection();
}

function addHighlight() {
  if (!content.about) content.about = {};
  if (!content.about.highlights) content.about.highlights = [];
  content.about.highlights.push('Neues Highlight');
  markChanged();
  renderCurrentSection();
}

function removeHighlight(index) {
  content.about.highlights.splice(index, 1);
  markChanged();
  renderCurrentSection();
}

function addTestimonial() {
  if (!content.testimonials) content.testimonials = {};
  if (!content.testimonials.items) content.testimonials.items = [];
  content.testimonials.items.push({ name: 'Neue Kundin', text: 'Feedback…' });
  markChanged();
  renderCurrentSection();
}

function removeTestimonial(index) {
  if (!confirm('Wirklich löschen?')) return;
  content.testimonials.items.splice(index, 1);
  markChanged();
  renderCurrentSection();
}

function addFooterLink() {
  if (!content.footer) content.footer = {};
  if (!content.footer.links) content.footer.links = [];
  content.footer.links.push({ text: 'Neuer Link', href: 'https://…' });
  markChanged();
  renderCurrentSection();
}

function removeFooterLink(index) {
  content.footer.links.splice(index, 1);
  markChanged();
  renderCurrentSection();
}

function addImpressumLine() {
  if (!content.impressum) content.impressum = {};
  if (!content.impressum.lines) content.impressum.lines = [];
  content.impressum.lines.push('Neue Zeile');
  markChanged();
  renderCurrentSection();
}

function removeImpressumLine(index) {
  content.impressum.lines.splice(index, 1);
  markChanged();
  renderCurrentSection();
}

// Image Picker (unchanged)
async function selectImageFor(path) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🖼️ Bild auswählen</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="picker-grid">
          ${images.map(img => `
            <div class="picker-item" onclick="pickImage('${path}', '${img.path}')">
              <img src="${img.path}" alt="${img.name}">
              <div class="picker-name">${img.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeModal()" class="btn btn-secondary">Abbrechen</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function pickImage(path, imagePath) {
  setNestedValue(content, path, imagePath);
  markChanged();
  closeModal();
  renderCurrentSection();
  showToast('🖼️ Bild ausgewählt', 'success');
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

// Helpers
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);
}

function markChanged() {
  hasChanges = true;
  updateSaveButton();
}

function updateSaveButton() {
  const btn = document.getElementById('save-btn');
  if (btn) {
    btn.textContent = hasChanges ? '💾 Speichern*' : '💾 Speichern';
    btn.classList.toggle('unsaved', hasChanges);
  }
}

function setBuildStatus(status) {
  const indicator = document.getElementById('build-indicator');
  if (!indicator) return;
  const texts = {
    ok: { text: '✅ Live', class: 'ok' },
    building: { text: '⏳ Baut…', class: 'building' },
    outdated: { text: '⚠️ Veraltet', class: 'outdated' },
    error: { text: '❌ Fehler', class: 'error' }
  };
  const info = texts[status] || texts.outdated;
  indicator.textContent = info.text;
  indicator.className = `build-status ${info.class}`;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function refreshCharCounts() {
  document.querySelectorAll('[data-count-for]').forEach(el => {
    const path = el.dataset.countFor;
    const max = parseInt(el.dataset.max || '0', 10) || null;
    const value = getNestedValue(content, path) || '';
    const len = value.length;
    el.textContent = max ? `${len}/${max} Zeichen` : `${len} Zeichen`;
    el.classList.toggle('over-limit', max && len > max);
  });
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('save-btn')?.addEventListener('click', saveContent);
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  if (uploadZone) {
    uploadZone.addEventListener('click', () => fileInput?.click());
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      for (const file of files) {
        await uploadImage(file);
      }
      await loadImages();
      renderCurrentSection();
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        await uploadImage(file);
      }
      await loadImages();
      renderCurrentSection();
      fileInput.value = '';
    });
  }
}

function setupEditableFields() {
  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
    el.addEventListener('input', () => {
      const path = el.dataset.path;
      if (path) {
        setNestedValue(content, path, el.textContent);
        markChanged();
        updateCharCount(path);
      }
    });
  });
}

function updateCharCount(path) {
  const target = document.querySelector(`[data-count-for="${path}"]`);
  if (!target) return;
  const max = parseInt(target.dataset.max || '0', 10) || null;
  const len = (getNestedValue(content, path) || '').length;
  target.textContent = max ? `${len}/${max} Zeichen` : `${len} Zeichen`;
  target.classList.toggle('over-limit', max && len > max);
}

// Make functions globally available
window.showSection = showSection;
window.addLeistung = addLeistung;
window.removeLeistung = removeLeistung;
window.addGalleryImage = addGalleryImage;
window.removeGalleryImage = removeGalleryImage;
window.addFAQ = addFAQ;
window.removeFAQ = removeFAQ;
window.selectImageFor = selectImageFor;
window.pickImage = pickImage;
window.closeModal = closeModal;
window.deleteImage = deleteImage;
window.addHighlight = addHighlight;
window.removeHighlight = removeHighlight;
window.addTestimonial = addTestimonial;
window.removeTestimonial = removeTestimonial;
window.addFooterLink = addFooterLink;
window.removeFooterLink = removeFooterLink;
window.addImpressumLine = addImpressumLine;
window.removeImpressumLine = removeImpressumLine;
window.loadBuildStatus = loadBuildStatus;
