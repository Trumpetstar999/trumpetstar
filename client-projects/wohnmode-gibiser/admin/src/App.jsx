import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Gauge,
  Settings2,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Save,
  Database,
  Layers,
  ListChecks,
  PhoneCall,
  BookCopy,
  Info,
  RefreshCcw,
  Loader2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import './app.css';

const NAV_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: <Gauge size={18} /> },
  { id: 'site', label: 'Brand & Basics', icon: <Settings2 size={18} /> },
  { id: 'meta', label: 'SEO / Meta', icon: <Sparkles size={18} /> },
  { id: 'hero', label: 'Hero & Slides', icon: <Layers size={18} /> },
  { id: 'leistungen', label: 'Leistungen', icon: <ListChecks size={18} /> },
  { id: 'story', label: 'Story & Proof', icon: <BookCopy size={18} /> },
  { id: 'contact', label: 'Kontakt', icon: <PhoneCall size={18} /> },
  { id: 'legal', label: 'Footer & Rechtliches', icon: <ShieldCheck size={18} /> },
  { id: 'images', label: 'Medien', icon: <ImageIcon size={18} /> },
  { id: 'build', label: 'Build & Deploy', icon: <Database size={18} /> }
];

const API = {
  content: '/api/content',
  images: '/api/images',
  upload: (filename) => `/api/upload/${encodeURIComponent(filename)}`,
  deleteImage: (filename) => `/api/delete/${encodeURIComponent(filename)}`,
  buildStatus: '/api/build-status'
};

const clone = (obj) => (typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)));

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const timeAgo = (date) => {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'soeben';
  if (mins < 60) return `${mins} min`; 
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `${days} d`;
};

function Field({ label, value, onChange, placeholder, multiline = false, hint, maxLength }) {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => { setLocal(value ?? ''); }, [value]);
  const chars = local?.length || 0;
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea
          value={local ?? ''}
          placeholder={placeholder}
          onChange={(e) => {
            setLocal(e.target.value);
            onChange(e.target.value);
          }}
        />
      ) : (
        <input
          value={local ?? ''}
          placeholder={placeholder}
          onChange={(e) => {
            setLocal(e.target.value);
            onChange(e.target.value);
          }}
        />
      )}
      <div className="field-meta">
        {hint && <span>{hint}</span>}
        {maxLength && <span className={chars > maxLength ? 'warn' : ''}>{chars}/{maxLength}</span>}
      </div>
    </label>
  );
}

function StackCard({ title, children, badge, onRemove }) {
  return (
    <div className="stack-card">
      <div className="stack-card__head">
        <div>
          <h4>{title}</h4>
          {badge && <span className="badge">{badge}</span>}
        </div>
        {onRemove && (
          <button className="ghost" onClick={onRemove}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="stack-card__body">{children}</div>
    </div>
  );
}

function useDirtyFlag(value) {
  const [snapshot, setSnapshot] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (snapshot === null && value) {
      setSnapshot(JSON.stringify(value));
      return;
    }
    if (snapshot && value) {
      setDirty(JSON.stringify(value) !== snapshot);
    }
  }, [value, snapshot]);

  const reset = useCallback((nextValue) => {
    setSnapshot(JSON.stringify(nextValue));
    setDirty(false);
  }, []);

  return { dirty, markDirty: () => setDirty(true), resetDirty: reset };
}

export default function App() {
  const [content, setContent] = useState(null);
  const [images, setImages] = useState([]);
  const [section, setSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [buildState, setBuildState] = useState({ state: 'unknown' });
  const { dirty, markDirty, resetDirty } = useDirtyFlag(content);

  const mutateContent = useCallback((updater) => {
    setContent((prev) => {
      const next = clone(prev || {});
      updater(next);
      return next;
    });
    markDirty();
  }, [markDirty]);

  const updatePath = useCallback((path, value) => {
    mutateContent((draft) => {
      let ref = draft;
      path.slice(0, -1).forEach((key) => {
        if (typeof key === 'number') {
          ref[key] = ref[key] ? ref[key] : {};
          ref = ref[key];
        } else {
          if (!ref[key]) ref[key] = {};
          ref = ref[key];
        }
      });
      const last = path[path.length - 1];
      ref[last] = value;
    });
  }, [mutateContent]);

  const showToast = useCallback((message, tone = 'info') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [contentRes, imagesRes, buildRes] = await Promise.all([
          fetchJson(API.content),
          fetchJson(API.images),
          fetchJson(API.buildStatus)
        ]);
        setContent(contentRes);
        setImages(imagesRes);
        setBuildState(transformBuild(buildRes));
        resetDirty(contentRes);
      } catch (error) {
        console.error(error);
        showToast('Fehler beim Laden der Daten', 'error');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const transformBuild = (payload) => {
    if (!payload) return { state: 'unknown' };
    if (payload.running) return { state: 'building', last: payload.lastBuild };
    if (payload.upToDate) return { state: 'ok', last: payload.lastBuild };
    return { state: 'outdated', last: payload.lastBuild };
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetchJson(API.content, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      showToast('Gespeichert – Build wird gestartet', 'success');
      resetDirty(content);
      setBuildState({ state: 'building', last: res?.lastBuild || null });
      pollBuild();
    } catch (error) {
      console.error(error);
      showToast('Speichern fehlgeschlagen', 'error');
    } finally {
      setSaving(false);
    }
  };

  const pollBuild = async () => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const status = await fetchJson(API.buildStatus);
        const mapped = transformBuild(status);
        setBuildState(mapped);
        if (mapped.state === 'ok' || mapped.state === 'outdated') {
          clearInterval(timer);
        }
      } catch (error) {
        console.error(error);
      }
      if (attempts > 60) {
        clearInterval(timer);
        setBuildState({ state: 'error' });
      }
    }, 2000);
  };

  const handleUpload = async (files) => {
    for (const file of files) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const formData = new FormData();
      formData.append('image', file);
      try {
        showToast(`Upload: ${cleanName}`);
        await fetchJson(API.upload(cleanName), {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        showToast(`Fehler bei ${cleanName}`, 'error');
      }
    }
    const refreshed = await fetchJson(API.images);
    setImages(refreshed);
  };

  const handleDeleteImage = async (filename) => {
    if (!confirm(`${filename} wirklich löschen?`)) return;
    try {
      await fetchJson(API.deleteImage(filename), { method: 'DELETE' });
      showToast(`${filename} gelöscht`, 'success');
      const refreshed = await fetchJson(API.images);
      setImages(refreshed);
    } catch (error) {
      showToast('Löschen fehlgeschlagen', 'error');
    }
  };

  const stats = useMemo(() => {
    if (!content) return {};
    return {
      slides: content.hero?.slides?.length || 0,
      services: content.leistungen?.items?.length || 0,
      testimonials: content.testimonials?.items?.length || 0,
      faq: content.faq?.items?.length || 0
    };
  }, [content]);

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={32} className="spin" />
        <p>Lade Admin Panel…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">WG</div>
          <div>
            <p>Wohnmode Gibiser</p>
            <span>Admin Studio</span>
          </div>
        </div>
        <nav>
          {NAV_SECTIONS.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${section === item.id ? 'active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {section === item.id && <span className="pill">live</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>Status: <strong>{buildState.state}</strong></p>
          <small>Letzter Build: {buildState?.last?.time ? new Date(buildState.last.time).toLocaleString('de-AT') : '—'}</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <h1>{NAV_SECTIONS.find((n) => n.id === section)?.label}</h1>
            {dirty && <span className="badge">nicht gespeichert</span>}
          </div>
          <div className="topbar-actions">
            <button className="ghost" onClick={() => pollBuild()}>
              <RefreshCcw size={16} /> Refresh Build
            </button>
            <button className="primary" disabled={!dirty || saving} onClick={handleSave}>
              {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
              Speichern
            </button>
          </div>
        </header>
        <main>
          {section === 'dashboard' && <Dashboard stats={stats} buildState={buildState} images={images} />}
          {section === 'site' && (
            <SiteSection content={content} updatePath={updatePath} />
          )}
          {section === 'meta' && (
            <MetaSection content={content} updatePath={updatePath} />
          )}
          {section === 'hero' && (
            <HeroSection content={content} updatePath={updatePath} mutateContent={mutateContent} />
          )}
          {section === 'leistungen' && (
            <ServiceSection content={content} mutateContent={mutateContent} updatePath={updatePath} />
          )}
          {section === 'story' && (
            <StorySection content={content} mutateContent={mutateContent} updatePath={updatePath} />
          )}
          {section === 'contact' && (
            <ContactSection content={content} mutateContent={mutateContent} updatePath={updatePath} />
          )}
          {section === 'legal' && (
            <LegalSection content={content} mutateContent={mutateContent} updatePath={updatePath} />
          )}
          {section === 'images' && (
            <ImageSection images={images} onUpload={handleUpload} onDelete={handleDeleteImage} />
          )}
          {section === 'build' && (
            <BuildSection buildState={buildState} />
          )}
        </main>
      </div>
      {toast && (
        <div className={`toast ${toast.tone}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

const Dashboard = ({ stats, buildState, images }) => (
  <section className="section">
    <div className="grid four">
      <div className="stat">
        <span>Hero Slides</span>
        <strong>{stats.slides}</strong>
      </div>
      <div className="stat">
        <span>Leistungen</span>
        <strong>{stats.services}</strong>
      </div>
      <div className="stat">
        <span>Testimonials</span>
        <strong>{stats.testimonials}</strong>
      </div>
      <div className="stat">
        <span>FAQ</span>
        <strong>{stats.faq}</strong>
      </div>
    </div>
    <div className="panel">
      <h3>Build Status</h3>
      <div className={`build-state ${buildState.state}`}>
        {buildState.state === 'building' && <Loader2 className="spin" size={18} />}
        <span>{buildState.state}</span>
      </div>
      <p>Letztes Build-Fenster: {buildState?.last?.time ? new Date(buildState.last.time).toLocaleString('de-AT') : '—'}</p>
    </div>
    <div className="panel">
      <h3>Medien-Schnappschuss</h3>
      <div className="media-preview">
        {images.slice(0, 4).map((img) => (
          <img key={img.name} src={img.path} alt={img.name} />
        ))}
      </div>
    </div>
  </section>
);

const SiteSection = ({ content, updatePath }) => {
  const site = content.site || {};
  return (
    <section className="section">
      <div className="panel">
        <h3>Brand Essentials</h3>
        <Field label="Name" value={site.name} onChange={(v) => updatePath(['site', 'name'], v)} />
        <Field label="Tagline" value={site.tagline} onChange={(v) => updatePath(['site', 'tagline'], v)} />
        <Field label="Beschreibung" multiline value={site.description} onChange={(v) => updatePath(['site', 'description'], v)} />
        <Field label="Website URL" value={site.url} onChange={(v) => updatePath(['site', 'url'], v)} placeholder="https://" />
        <div className="grid two">
          <Field label="Sprache (lang)" value={site.lang} onChange={(v) => updatePath(['site', 'lang'], v)} />
          <Field label="Locale" value={site.locale} onChange={(v) => updatePath(['site', 'locale'], v)} />
        </div>
      </div>
    </section>
  );
};

const MetaSection = ({ content, updatePath }) => {
  const meta = content.meta || {};
  return (
    <section className="section">
      <div className="panel">
        <h3>SEO Meta</h3>
        <Field label="Meta Title" value={meta.title} onChange={(v) => updatePath(['meta', 'title'], v)} maxLength={65} />
        <Field label="Meta Description" multiline value={meta.description} onChange={(v) => updatePath(['meta', 'description'], v)} maxLength={160} />
        <Field label="OG Image" value={meta.ogImage} onChange={(v) => updatePath(['meta', 'ogImage'], v)} placeholder="/images/hero-1.jpg" />
        <Field label="Canonical" value={meta.canonical} onChange={(v) => updatePath(['meta', 'canonical'], v)} placeholder="https://…" />
      </div>
    </section>
  );
};

const HeroSection = ({ content, updatePath, mutateContent }) => {
  const hero = content.hero || {};
  const slides = hero.slides || [];
  const addSlide = () => mutateContent((draft) => {
    draft.hero = draft.hero || {};
    draft.hero.slides = draft.hero.slides || [];
    draft.hero.slides.push({ src: '', alt: '' });
  });
  const removeSlide = (index) => mutateContent((draft) => {
    draft.hero.slides.splice(index, 1);
  });
  return (
    <section className="section">
      <div className="panel">
        <h3>Hero Copy</h3>
        <Field label="Headline" value={hero.headline} onChange={(v) => updatePath(['hero', 'headline'], v)} />
        <Field label="Subheadline" multiline value={hero.subheadline} onChange={(v) => updatePath(['hero', 'subheadline'], v)} />
        <div className="grid two">
          <Field label="CTA Primary Text" value={hero.cta?.primary?.text} onChange={(v) => updatePath(['hero', 'cta', 'primary', 'text'], v)} />
          <Field label="CTA Primary Link" value={hero.cta?.primary?.href} onChange={(v) => updatePath(['hero', 'cta', 'primary', 'href'], v)} />
        </div>
        <div className="grid two">
          <Field label="CTA Secondary Text" value={hero.cta?.secondary?.text} onChange={(v) => updatePath(['hero', 'cta', 'secondary', 'text'], v)} />
          <Field label="CTA Secondary Link" value={hero.cta?.secondary?.href} onChange={(v) => updatePath(['hero', 'cta', 'secondary', 'href'], v)} />
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3>Slides</h3>
          <button className="ghost" onClick={addSlide}><UploadCloud size={16} /> Slide hinzufügen</button>
        </div>
        <div className="stack-grid">
          {slides.map((slide, index) => (
            <StackCard key={index} title={`Slide ${index + 1}`} onRemove={() => removeSlide(index)}>
              <Field label="Bildpfad" value={slide.src} onChange={(v) => updatePath(['hero', 'slides', index, 'src'], v)} placeholder="/images/hero-1.jpg" />
              <Field label="Alt-Text" value={slide.alt} onChange={(v) => updatePath(['hero', 'slides', index, 'alt'], v)} />
            </StackCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const ServiceSection = ({ content, mutateContent, updatePath }) => {
  const services = content.leistungen?.items || [];
  const addService = () => mutateContent((draft) => {
    draft.leistungen = draft.leistungen || {};
    draft.leistungen.items = draft.leistungen.items || [];
    draft.leistungen.items.push({ title: '', text: '', image: '' });
  });
  const removeService = (index) => mutateContent((draft) => draft.leistungen.items.splice(index, 1));
  return (
    <section className="section">
      <div className="panel">
        <h3>Leistungen Intro</h3>
        <Field label="Headline" value={content.leistungen?.headline} onChange={(v) => updatePath(['leistungen', 'headline'], v)} />
        <Field label="Subheadline" value={content.leistungen?.subheadline} onChange={(v) => updatePath(['leistungen', 'subheadline'], v)} />
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3>Items</h3>
          <button className="ghost" onClick={addService}>+ Leistung</button>
        </div>
        <div className="stack-grid">
          {services.map((item, index) => (
            <StackCard key={index} title={item.title || `Eintrag ${index + 1}`} onRemove={() => removeService(index)}>
              <Field label="Titel" value={item.title} onChange={(v) => updatePath(['leistungen', 'items', index, 'title'], v)} />
              <Field label="Text" multiline value={item.text} onChange={(v) => updatePath(['leistungen', 'items', index, 'text'], v)} />
              <Field label="Bild" value={item.image} onChange={(v) => updatePath(['leistungen', 'items', index, 'image'], v)} placeholder="/images/service-1.jpg" />
            </StackCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const StorySection = ({ content, mutateContent, updatePath }) => {
  const testimonials = content.testimonials?.items || [];
  const gallery = content.gallery?.images || [];
  const highlights = content.about?.highlights || [];

  const addHighlight = () => mutateContent((draft) => {
    draft.about = draft.about || {};
    draft.about.highlights = draft.about.highlights || [];
    draft.about.highlights.push('');
  });
  const removeHighlight = (index) => mutateContent((draft) => draft.about.highlights.splice(index, 1));

  const addTestimonial = () => mutateContent((draft) => {
    draft.testimonials = draft.testimonials || {};
    draft.testimonials.items = draft.testimonials.items || [];
    draft.testimonials.items.push({ name: '', text: '' });
  });
  const removeTestimonial = (index) => mutateContent((draft) => draft.testimonials.items.splice(index, 1));

  const addGalleryItem = () => mutateContent((draft) => {
    draft.gallery = draft.gallery || {};
    draft.gallery.images = draft.gallery.images || [];
    draft.gallery.images.push({ src: '', alt: '', caption: '' });
  });
  const removeGalleryItem = (index) => mutateContent((draft) => draft.gallery.images.splice(index, 1));

  const faqItems = content.faq?.items || [];
  const addFaq = () => mutateContent((draft) => {
    draft.faq = draft.faq || {};
    draft.faq.items = draft.faq.items || [];
    draft.faq.items.push({ q: '', a: '' });
  });
  const removeFaq = (index) => mutateContent((draft) => draft.faq.items.splice(index, 1));

  return (
    <section className="section">
      <div className="panel">
        <h3>About</h3>
        <Field label="Headline" value={content.about?.headline} onChange={(v) => updatePath(['about', 'headline'], v)} />
        <Field label="Text" multiline value={content.about?.text} onChange={(v) => updatePath(['about', 'text'], v)} />
        <div className="stack-grid">
          {highlights.map((item, index) => (
            <StackCard key={index} title={`Highlight ${index + 1}`} onRemove={() => removeHighlight(index)}>
              <Field label="Text" value={item} onChange={(v) => updatePath(['about', 'highlights', index], v)} />
            </StackCard>
          ))}
        </div>
        <button className="ghost" onClick={addHighlight}>+ Highlight</button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Testimonials</h3>
          <button className="ghost" onClick={addTestimonial}>+ Testimonial</button>
        </div>
        <div className="stack-grid">
          {testimonials.map((item, index) => (
            <StackCard key={index} title={item.name || `Person ${index + 1}`} onRemove={() => removeTestimonial(index)}>
              <Field label="Name" value={item.name} onChange={(v) => updatePath(['testimonials', 'items', index, 'name'], v)} />
              <Field label="Zitat" multiline value={item.text} onChange={(v) => updatePath(['testimonials', 'items', index, 'text'], v)} />
            </StackCard>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Galerie</h3>
          <button className="ghost" onClick={addGalleryItem}>+ Bild</button>
        </div>
        <div className="stack-grid">
          {gallery.map((item, index) => (
            <StackCard key={index} title={item.caption || `Bild ${index + 1}`} onRemove={() => removeGalleryItem(index)}>
              <Field label="Bild" value={item.src} onChange={(v) => updatePath(['gallery', 'images', index, 'src'], v)} />
              <Field label="Alt-Text" value={item.alt} onChange={(v) => updatePath(['gallery', 'images', index, 'alt'], v)} />
              <Field label="Caption" value={item.caption} onChange={(v) => updatePath(['gallery', 'images', index, 'caption'], v)} />
            </StackCard>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>FAQ</h3>
          <button className="ghost" onClick={addFaq}>+ FAQ</button>
        </div>
        <div className="stack-grid">
          {faqItems.map((item, index) => (
            <StackCard key={index} title={item.q || `Frage ${index + 1}`} onRemove={() => removeFaq(index)}>
              <Field label="Frage" value={item.q} onChange={(v) => updatePath(['faq', 'items', index, 'q'], v)} />
              <Field label="Antwort" multiline value={item.a} onChange={(v) => updatePath(['faq', 'items', index, 'a'], v)} />
            </StackCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection = ({ content, mutateContent, updatePath }) => {
  const contact = content.contact || {};
  const hours = contact.hours || [];
  const addHour = () => mutateContent((draft) => {
    draft.contact = draft.contact || {};
    draft.contact.hours = draft.contact.hours || [];
    draft.contact.hours.push({ label: '', time: '' });
  });
  const removeHour = (index) => mutateContent((draft) => draft.contact.hours.splice(index, 1));
  return (
    <section className="section">
      <div className="panel">
        <h3>Kontakt Copy</h3>
        <Field label="Headline" value={contact.headline} onChange={(v) => updatePath(['contact', 'headline'], v)} />
        <Field label="Subheadline" multiline value={contact.subheadline} onChange={(v) => updatePath(['contact', 'subheadline'], v)} />
        <Field label="Telefon" value={contact.phone} onChange={(v) => updatePath(['contact', 'phone'], v)} />
        <Field label="E-Mail" value={contact.email} onChange={(v) => updatePath(['contact', 'email'], v)} />
        <Field label="Adresse" multiline value={contact.address} onChange={(v) => updatePath(['contact', 'address'], v)} />
        <Field label="Hinweis" value={contact.hoursNotice} onChange={(v) => updatePath(['contact', 'hoursNotice'], v)} />
        <div className="grid two">
          <Field label="Form Name" value={contact.formPlaceholder?.name} onChange={(v) => updatePath(['contact', 'formPlaceholder', 'name'], v)} />
          <Field label="Form Email" value={contact.formPlaceholder?.email} onChange={(v) => updatePath(['contact', 'formPlaceholder', 'email'], v)} />
        </div>
        <Field label="Form Nachricht" value={contact.formPlaceholder?.message} onChange={(v) => updatePath(['contact', 'formPlaceholder', 'message'], v)} />
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3>Öffnungszeiten</h3>
          <button className="ghost" onClick={addHour}>+ Zeile</button>
        </div>
        <div className="stack-grid">
          {hours.map((item, index) => (
            <StackCard key={index} title={item.label || `Slot ${index + 1}`} onRemove={() => removeHour(index)}>
              <Field label="Label" value={item.label} onChange={(v) => updatePath(['contact', 'hours', index, 'label'], v)} />
              <Field label="Zeit" value={item.time} onChange={(v) => updatePath(['contact', 'hours', index, 'time'], v)} />
            </StackCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const LegalSection = ({ content, mutateContent, updatePath }) => {
  const links = content.footer?.links || [];
  const lines = content.impressum?.lines || [];
  const addLink = () => mutateContent((draft) => {
    draft.footer = draft.footer || {};
    draft.footer.links = draft.footer.links || [];
    draft.footer.links.push({ text: '', href: '' });
  });
  const removeLink = (index) => mutateContent((draft) => draft.footer.links.splice(index, 1));
  const addLine = () => mutateContent((draft) => {
    draft.impressum = draft.impressum || {};
    draft.impressum.lines = draft.impressum.lines || [];
    draft.impressum.lines.push('');
  });
  const removeLine = (index) => mutateContent((draft) => draft.impressum.lines.splice(index, 1));
  return (
    <section className="section">
      <div className="panel">
        <h3>Footer</h3>
        <Field label="Copyright" value={content.footer?.copyright} onChange={(v) => updatePath(['footer', 'copyright'], v)} />
        <div className="grid two">
          {links.map((item, index) => (
            <StackCard key={index} title={item.text || `Link ${index + 1}`} onRemove={() => removeLink(index)}>
              <Field label="Text" value={item.text} onChange={(v) => updatePath(['footer', 'links', index, 'text'], v)} />
              <Field label="URL" value={item.href} onChange={(v) => updatePath(['footer', 'links', index, 'href'], v)} />
            </StackCard>
          ))}
        </div>
        <button className="ghost" onClick={addLink}>+ Link</button>
      </div>
      <div className="panel">
        <h3>Impressum</h3>
        <Field label="Titel" value={content.impressum?.title} onChange={(v) => updatePath(['impressum', 'title'], v)} />
        <div className="stack-grid">
          {lines.map((line, index) => (
            <StackCard key={index} title={`Zeile ${index + 1}`} onRemove={() => removeLine(index)}>
              <Field label="Text" value={line} onChange={(v) => updatePath(['impressum', 'lines', index], v)} />
            </StackCard>
          ))}
        </div>
        <button className="ghost" onClick={addLine}>+ Zeile</button>
      </div>
    </section>
  );
};

const ImageSection = ({ images, onUpload, onDelete }) => (
  <section className="section">
    <div className="panel">
      <h3>Upload</h3>
      <label className="upload">
        <UploadCloud size={24} />
        <p>Dateien hierher ziehen oder klicken</p>
        <input type="file" multiple accept="image/*" onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onUpload(files);
          e.target.value = '';
        }} />
      </label>
    </div>
    <div className="image-grid">
      {images.map((img) => (
        <div key={img.name} className="image-card">
          <img src={img.path} alt={img.name} />
          <div className="image-meta">
            <div>
              <strong>{img.name}</strong>
              <span>{formatBytes(img.size)}</span>
            </div>
            <button className="ghost" onClick={() => onDelete(img.name)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const BuildSection = ({ buildState }) => (
  <section className="section">
    <div className="panel">
      <h3>Deployment State</h3>
      <div className={`build-state ${buildState.state}`}>
        {buildState.state === 'building' && <Loader2 className="spin" size={18} />}
        <span>{buildState.state}</span>
      </div>
      <p>Letzter Build: {buildState?.last?.time ? new Date(buildState.last.time).toLocaleString('de-AT') : '—'}</p>
      <p>Status: {buildState?.last?.ok === false ? 'Fehler' : 'OK'}</p>
    </div>
  </section>
);
