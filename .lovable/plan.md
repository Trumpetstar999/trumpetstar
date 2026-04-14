

# Plan: QR-Codes importieren und htaccess-Datei bereitstellen

## Zusammenfassung

Die 350 QR-Code-Einträge (V001-V350) werden aus der htaccess-Datei extrahiert und in die `qr_codes`-Datenbanktabelle eingefügt. Zusätzlich wird die htaccess-Datei als Download bereitgestellt.

## Schritte

### 1. QR-Codes in die Datenbank einfügen
- Ein Python-Skript parst die htaccess-Datei und extrahiert alle eindeutigen V-Codes (V001-V350)
- Für jeden Code wird ein Eintrag in `qr_codes` erstellt mit:
  - `code`: z.B. "V001"
  - `content_type`: "video" (Standard, da alle V-Codes auf Videos verweisen)
  - `video_id`: NULL (wird später im Admin-Panel zugeordnet)
  - `label`: Automatisch generiert aus dem Pfad (z.B. "Band 1 - Level 1 Lied 1")
  - `is_active`: true
- Die 5 externen Links (checkout, trumpetstar.com, neusnoise.com) werden **nicht** importiert, da sie keine V-Codes sind
- Insert erfolgt per `psql` oder Supabase Insert-Tool in Batches

### 2. htaccess-Datei bereitstellen
- Die hochgeladene htaccess-Datei wird nach `/mnt/documents/htaccess_qr_redirects.txt` kopiert und als Download-Artifact bereitgestellt

## Technische Details

- Die qr_codes-Tabelle existiert bereits mit dem passenden Schema (id, code, content_type, video_id, audio_id, label, is_active)
- Die Tabelle ist aktuell leer, kein Konfliktrisiko
- Nach dem Import können die Video-Zuordnungen im QR-Code-Manager im Admin-Panel vorgenommen werden
- Es werden ca. 350 INSERT-Statements ausgeführt

