# content.json Schema

Complete schema for the onepager content file. All text, images, and metadata lives here.

## Top-level structure

```json
{
  "site":         { ... },
  "meta":         { ... },
  "variant":      "D",
  "hero":         { ... },
  "leistungen":   { ... },
  "about":        { ... },
  "testimonials": { ... },
  "gallery":      { ... },
  "faq":          { ... },
  "contact":      { ... },
  "footer":       { ... },
  "impressum":    { ... }
}
```

---

## site

```json
"site": {
  "name":        "Firmenname OG",
  "tagline":     "Kurzes Versprechen. In einem Satz.",
  "description": "SEO-Beschreibung der Firma für Meta-Tags.",
  "url":         "https://www.domain.at",
  "lang":        "de",
  "locale":      "de_AT"
}
```

---

## meta

```json
"meta": {
  "title":       "Firmenname | Leistung – Ort",
  "description": "Max 160 Zeichen. Enthält Hauptleistung + Ort + USP.",
  "ogImage":     "/images/og-image.jpg",
  "canonical":   "https://www.domain.at"
}
```

---

## hero

```json
"hero": {
  "headline":    "Headline,\ndie bleibt.",
  "subheadline": "1-2 Sätze. Was der Kunde bekommt, warum er anrufen soll.",
  "cta": {
    "primary":   { "text": "Jetzt Termin anfragen", "href": "#kontakt" },
    "secondary": { "text": "0123/456789",           "href": "tel:+430123456789" }
  },
  "slides": [
    { "src": "/images/hero-1.jpg", "alt": "Beschreibung für Screenreader" },
    { "src": "/images/hero-2.jpg", "alt": "..." }
  ]
}
```

`headline` supports `\n` for line breaks. Keep it short (2–5 words per line).

---

## leistungen

```json
"leistungen": {
  "headline":    "Unsere Leistungen",
  "subheadline": "Vom Entwurf bis zur Ausführung – alles aus einer Hand.",
  "items": [
    {
      "image": "/images/leistung-1.jpg",
      "title": "Leistungsname",
      "text":  "1-2 Sätze Beschreibung."
    }
  ]
}
```

**Rules:**
- Each item needs a UNIQUE `image`. Download different images for each service.
- 4–6 items optimal for layout
- No `icon` field in current template (image-only)

---

## about

```json
"about": {
  "headline":   "Familienbetrieb mit Leidenschaft",
  "text":       "2–3 Sätze über die Firma. Geschichte, Werte, Team.",
  "highlights": [
    "Familiengeführt seit 20XX",
    "Regional verwurzelt",
    "Persönliche Beratung",
    "Höchste Materialqualität"
  ]
}
```

---

## testimonials

```json
"testimonials": {
  "headline": "Was unsere Kunden sagen",
  "items": [
    {
      "name": "Familie Mustermann, Ort",
      "text": "Zitat des Kunden."
    }
  ]
}
```

Note: Do NOT include `"_note"` field in production.

---

## gallery

```json
"gallery": {
  "headline": "Einblicke in unsere Arbeit",
  "images": [
    {
      "src":     "/images/gallery-1.jpg",
      "alt":     "Beschreibung",
      "caption": "Kurze Bildunterschrift"
    }
  ]
}
```

6 images = 3×2 grid. 3 images = 3×1. Aspect ratio 4:3 recommended.

---

## faq

```json
"faq": {
  "headline": "Häufig gestellte Fragen",
  "items": [
    {
      "q": "Wie lange dauert die Lieferung?",
      "a": "Antwort in 2–3 Sätzen."
    }
  ]
}
```

4–6 FAQ items ideal.

---

## contact

```json
"contact": {
  "headline":    "Kontakt aufnehmen",
  "subheadline": "Kein Projekt zu groß oder zu klein.",
  "phone":       "01234/56789",
  "email":       "office@domain.at",
  "address":     "Straße 1, 1234 Ort",
  "hours": [
    { "label": "Mo – Fr", "time": "08:00 – 17:00" },
    { "label": "Sa",      "time": "Geschlossen" }
  ],
  "formPlaceholder": {
    "name":    "Ihr Name",
    "email":   "Ihre E-Mail",
    "message": "Beschreiben Sie kurz Ihr Projekt...",
    "submit":  "Anfrage senden"
  }
}
```

`address` is auto-linked to Google Maps (wired in template).

---

## footer

```json
"footer": {
  "copyright": "© 2026 Firmenname",
  "links": [
    { "text": "Impressum",  "href": "#impressum" },
    { "text": "Datenschutz","href": "#datenschutz" }
  ],
  "social": [
    { "name": "Facebook", "href": "https://www.facebook.com/...", "icon": "facebook" }
  ]
}
```

`social` is optional. Only Facebook icon is pre-wired. For other platforms, add SVG manually.

---

## impressum

```json
"impressum": {
  "title": "Impressum",
  "lines": [
    "Firmenname OG",
    "Straße, PLZ Ort",
    "Tel: 01234/56789",
    "E-Mail: office@domain.at",
    "Firmenbuch: FN XXXXXX x",
    "UID: ATUXXXXXXXX",
    "Gesellschafter: Vorname Nachname",
    "Behörde: Bezirkshauptmannschaft ...",
    "Berufsrecht: Gewerbeordnung (GewO) – www.ris.bka.gv.at"
  ]
}
```
