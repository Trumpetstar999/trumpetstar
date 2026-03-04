---
name: website-angebot
description: Generates a professional Word (.docx) offer document for Mario Schulter Design's website service (onepager-builder). Use when asked to "erstelle ein Angebot", "generate an offer", or similar for a website client. Produces a branded .docx with logo, feature list, pricing (€1.390), preview link, admin panel info, and bank details. Sends the file via Telegram automatically.
---

# Website-Angebot Generator

Generates a branded Word offer for the onepager website service.

## Quick Usage

```bash
python3 ~/.openclaw/workspace/skills/website-angebot/scripts/generate_angebot.py \
  --firma       "Kundenname" \
  --adresse     "Straße, PLZ Ort" \
  --anrede      "Sehr geehrte Damen und Herren," \
  --preview     "http://vorschau-url/" \
  --admin-url   "http://vorschau-url/admin/" \
  --admin-login "admin / passwort" \
  --preis       "1.390" \
  --nummer      "2026/01" \
  --output      "/root/.openclaw/workspace/angebot-<slug>.docx"
```

All arguments are optional — defaults are set for quick testing.

## Workflow

### 1. Parse Brief

Extract from user message:
- `--firma` — Firmenname (required)
- `--adresse` — Straße, PLZ Ort (required)
- `--anrede` — e.g. "Sehr geehrter Herr Fasching," (optional, default: Damen und Herren)
- `--preview` — Live-URL der Website (from onepager-builder deployment)
- `--admin-url` — Admin-Panel URL
- `--admin-login` — "admin / passwort"
- `--preis` — Default: 1.390
- `--nummer` — Angebotsnummer (e.g. 2026/01, 2026/02 ...)

### 2. Generate

Run the script. It produces a `.docx` in the specified `--output` path.

### 3. Send via Telegram

```python
# Use message tool with filePath:
# message(action="send", filePath="/root/.openclaw/workspace/angebot-<slug>.docx",
#         caption="Angebot für <Firma> — €1.390,-")
```

Or use the `message` tool directly from the orchestrating agent with `filePath`.

## Document Contents

1. **Header** — Schulter Design Logo + contact (Webdesign | Werbegraafik | URL | Phone | Email)
2. **Address block** — Client address left, Date + Angebotsnummer right
3. **Subject** — "Angebot – Professionelle Website für [Firma]"
4. **Why a modern website matters** — 6 bullet points
5. **Feature table** — 15 features with descriptions (2-col table)
6. **Preview links** — Live-URL + Admin-URL with login credentials
7. **Price table** — Pos / Leistung / Betrag + SUMME row
8. **Kleinunternehmer note** — No VAT, legally compliant
9. **Signature** — Mario Schulter, BA BA MA
10. **Bank details footer** — Raiffeisen IBAN/BIC

## Assets

- `assets/schulter-design-logo.jpg` — Schulter Design Logo (used in header)

## Notes

- Angebotsnummer: keep a running counter (2026/01, 2026/02, ...)
- Preis default: €1.390,- — adjust with `--preis` if needed
- Date auto-formats to German (e.g. "4. März 2026")
- `prefers` German month names — already handled in script
