

## Plan: QR-Codes mit Videos und Audios verknüpfen

### Konzept
Eine neue Datenbanktabelle speichert die Zuordnung zwischen QR-Code-IDs und den jeweiligen Videos/Audios. Eine neue Route `/qr/:code` empfängt die Scans, prüft den Login-Status und leitet direkt zum richtigen Inhalt in der App weiter. Im Admin-Bereich können QR-Codes verwaltet werden.

### Ablauf beim Scannen
```text
QR-Code im Buch → Externe URL (z.B. trumpetstar.lovable.app/qr/ABC123)
  → Nicht eingeloggt? → Weiterleitung zu /auth mit Rücksprung-URL
  → Eingeloggt? → Weiterleitung zu /app mit passendem Tab + Video/Audio vorausgewählt
```

### Änderungen

**1. Neue Datenbank-Tabelle `qr_codes`**
- `id` (UUID, PK)
- `code` (TEXT, UNIQUE) – der kurze Code aus dem QR (z.B. "V001", "A042")
- `content_type` (TEXT) – `video` oder `audio`
- `video_id` (UUID, nullable, FK → videos)
- `audio_id` (UUID, nullable, FK → audio_files)
- `label` (TEXT) – Beschreibung für Admin (z.B. "Seite 12 – Tonleiter C-Dur")
- `is_active` (BOOLEAN, default true)
- RLS: Admins können alles, angemeldete User können lesen

**2. Neue Route `/qr/:code`** – `src/pages/QRRedirectPage.tsx`
- Schlägt den Code in der Tabelle nach
- Nicht eingeloggt → Redirect zu `/auth?redirect=/qr/:code`
- Eingeloggt + Video → Redirect zu `/app?tab=levels&video=<vimeo_id>`
- Eingeloggt + Audio → Redirect zu `/app?tab=audios&audio=<audio_id>`
- Ungültiger Code → Fehlermeldung

**3. App.tsx** – Neue Route registrieren

**4. LevelsPage & AudioPlayer** – Query-Parameter auswerten, um das richtige Video/Audio automatisch zu öffnen

**5. Admin-Bereich** – `src/components/admin/QRCodeManager.tsx`
- Liste aller QR-Codes mit Code, Label, Typ, Status
- Hinzufügen/Bearbeiten/Deaktivieren
- Dropdown zur Auswahl des Videos oder Audios
- Neuer Sub-Tab "QR-Codes" im Admin

### Technische Details
- Die externen QR-Codes müssen auf `https://trumpetstar.lovable.app/qr/<CODE>` zeigen – das müsste einmalig bei den bestehenden QR-Codes angepasst werden (oder ein Redirect vom aktuellen Ziel eingerichtet werden)
- SPA-Routing sorgt dafür, dass `/qr/:code` korrekt aufgelöst wird

