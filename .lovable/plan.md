

## Favicon und Browser-Tab-Titel aktualisieren

### Was wird gemacht

1. **Favicon austauschen**: Die hochgeladene Datei `faviconTS2.ico` wird nach `public/favicon.ico` kopiert und im `index.html` korrekt referenziert.
2. **Browser-Tab-Titel andern**: Der `<title>`-Tag in `index.html` wird von "Musikstudio - Lerne Musik mit Videos" auf "Trumpetstar-APP" geandert.

### Technische Details

**Dateianderungen:**

- `public/favicon.ico` -- wird durch die hochgeladene Datei ersetzt (via `lov-copy`)
- `index.html` -- zwei Anderungen:
  - Zeile `<title>` wird zu `<title>Trumpetstar-APP</title>`
  - Ein expliziter `<link rel="icon" href="/favicon.ico" type="image/x-icon">` wird hinzugefuegt (falls noch nicht vorhanden), um sicherzustellen, dass der Browser das Icon korrekt ladt

