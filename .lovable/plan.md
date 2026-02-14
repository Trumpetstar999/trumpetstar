
## Auth-Seite: WordPress-Button entfernen und "Angemeldet bleiben" hinzufuegen

### Aenderungen

**1. "Mit Trumpetstar-Konto anmelden" Button entfernen (Zeilen 313-336)**
- Den gesamten WordPress-SSO-Block entfernen (Button + Beschreibungstext)
- Den `useWordPressMembership`-Import und zugehoerige State-Variable (`isWpLoading`, `wpError`, `startOAuthFlow`) entfernen
- Den `handleWordPressLogin`-Handler entfernen
- Import von `ExternalLink` und `Sparkles` Icons entfernen (nicht mehr benoetigt)

**2. "Angemeldet bleiben"-Checkbox hinzufuegen**
- Neue State-Variable `rememberMe` (default: `true`, damit Kinder standardmaessig angemeldet bleiben)
- Checkbox mit Label "Angemeldet bleiben" im Login-Tab und im Magic-Link-Tab anzeigen
- Beim Login (`handleSignIn`) und Magic-Link: Wenn `rememberMe` aktiviert ist, bleibt die Standard-Supabase-Persistenz (`localStorage`) aktiv -- das ist bereits der Fall
- Wenn `rememberMe` NICHT aktiviert ist, nach dem Login die Session auf `sessionStorage` umstellen, sodass sie beim Schliessen des Browsers endet

**3. Maximale Session-Dauer sicherstellen**
- Der Supabase-Client ist bereits mit `persistSession: true` und `autoRefreshToken: true` konfiguriert
- Sessions werden automatisch per Refresh-Token erneuert, solange der Browser `localStorage` nutzt
- Das bedeutet: Kinder bleiben praktisch unbegrenzt angemeldet, solange sie den Browser-Cache nicht loeschen

### Technische Details

**Datei: `src/pages/AuthPage.tsx`**
- Zeilen 4, 10-11, 24: Imports von `lovable` (bleibt), `Sparkles`/`ExternalLink` (entfernen), `useWordPressMembership` (entfernen)
- Zeilen 191-201: `handleWordPressLogin` entfernen
- Zeilen 313-336: WordPress-SSO-Button-Block entfernen
- Neue State: `const [rememberMe, setRememberMe] = useState(true);`
- Checkbox-UI im Login-Tab (vor dem Submit-Button) und im Magic-Link-Tab einfuegen
- In `handleSignIn`: wenn `!rememberMe`, nach erfolgreichem Login die Session-Daten aus `localStorage` entfernen und in `sessionStorage` verschieben

**Datei: `src/pages/WordPressCallbackPage.tsx` und `src/hooks/useWordPressMembership.tsx`**
- Diese Dateien bleiben vorerst bestehen (koennen spaeter aufgeraeumt werden), werden aber nicht mehr von der Auth-Seite referenziert

**Datei: `src/App.tsx`**
- Route `/auth/wordpress/callback` und Import von `WordPressCallbackPage` koennen entfernt werden
- `WordPressMembershipProvider` Wrapper kann entfernt werden
