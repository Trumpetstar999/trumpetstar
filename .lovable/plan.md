
# Conversion-starke Landingpage + App-Routing Umbau

## Ubersicht

Die Root-Route "/" wird von der geschutzten App zu einer oeffentlichen Conversion-Landingpage umgebaut. Eingeloggte Nutzer werden sofort nach "/app" weitergeleitet. Deep-Links werden nach Login korrekt fortgesetzt.

---

## Routing-Architektur (Vorher -> Nachher)

```text
VORHER:
  /           -> Index.tsx (geschutzt, redirect zu /auth)
  /auth       -> AuthPage.tsx (Login/Signup)

NACHHER:
  /           -> LandingPage.tsx (oeffentlich, Auto-Redirect wenn eingeloggt)
  /login      -> AuthPage.tsx (Magic Link + Passwort, mit returnTo-Support)
  /signup     -> AuthPage.tsx (Tab "signup" vorausgewaehlt)
  /app        -> Index.tsx (geschuetzt, die gesamte App)
  /app/*      -> Deep-Link-faehig (gespeichert in sessionStorage bei Gate)
```

---

## Schritt-fuer-Schritt Plan

### 1. Neue Landingpage erstellen (`src/pages/LandingPage.tsx`)

- **Sofortige Session-Pruefung**: Beim Laden `supabase.auth.getSession()` pruefen. Wenn Session vorhanden -> `navigate('/app', { replace: true })`. Dabei kurzer Loader (max 300ms), kein Landing-Flash.
- **Above the fold**:
  - Headline: "Trompete lernen -- kinderleicht. Auch fur Erwachsene."
  - Subheadline: "Playbacks, Lernvideos und Ube-Tools in einer App -- perfekt zu den Trumpetstar-Heften."
  - Primar-CTA: "Kostenlos starten" -> /signup
  - Sekundar-CTA: "Ich habe schon einen Account" -> /login
- **Sektionen**:
  - 3 USPs (Playbacks, Videos, Tools wie Metronom/Stimmgerat/Grifftabelle)
  - "So funktioniert's" (3 Schritte)
  - Social Proof ("Von Musikpadagogen entwickelt")
  - Kurzfassung FAQ (3-4 Fragen)
  - Footer: Datenschutz, Impressum, Support-Links
- **Design**: Trumpetstar-Design (blauer Gradient, Glassmorphismus) analog zu bestehenden SEO-Seiten mit `SEOPageLayout`.
- **UTM-Parameter**: Query-Params werden durchgereicht zu /signup und /login.

### 2. AuthPage erweitern (`src/pages/AuthPage.tsx`)

- **returnTo-Support**: Wenn `?returnTo=...` Query-Param oder `sessionStorage.getItem('returnTo')` vorhanden, nach Login dorthin redirecten statt nach `/app`.
- **Kontextuelles Gate-Banner**: Wenn `returnTo` vorhanden, oben "Du bist 1 Klick vom Inhalt entfernt" anzeigen.
- **Tab-Vorauswahl**: Route `/signup` oeffnet AuthPage mit `defaultValue="signup"`, `/login` mit `defaultValue="login"`.
- **Redirect-Ziel andern**: Standard-Redirect nach Login geht nun zu `/app` statt `/`.

### 3. Index.tsx (App) verschieben auf `/app`

- **Route**: `/app` statt `/`.
- **Auth-Guard**: Bleibt bestehen. Wenn nicht eingeloggt -> `navigate('/login')` (nicht mehr `/auth`).
- **Deep-Link-Gate**: Wenn nicht eingeloggt, wird die aktuelle URL in `sessionStorage.setItem('returnTo', location.pathname)` gespeichert, dann Redirect zu `/login`.

### 4. App.tsx Routing aktualisieren

Alle bestehenden geschuetzten Routen bekommen das `/app`-Prefix:

```text
/app                   -> Index.tsx (Haupt-App)
/app/admin             -> AdminPage
/app/chats             -> ChatsPage
/app/game/play         -> GamePlayPage
/app/practice/sessions -> SessionListPage
/app/musicxml/:id      -> MusicXMLViewerPage
/app/hilfe             -> HelpCenterPage
...etc
```

Oeffentliche Routen bleiben unverndert:
```text
/                      -> LandingPage (NEU)
/login                 -> AuthPage
/signup                -> AuthPage (Tab signup)
/pricing               -> PricingPage
/trompete-lernen       -> SEO Pages
/practice/sessions/share/:slug -> SharedSessionPage
```

### 5. Protected Route Wrapper (`src/components/auth/ProtectedRoute.tsx`)

Neuer Wrapper der:
- Auth-Status prueft
- Bei fehlender Session: URL in `sessionStorage('returnTo')` speichert
- Redirect zu `/login`
- Loading-Spinner waehrend Session-Restore zeigt

```tsx
<Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
```

### 6. MobileRouteGuard anpassen

- Mobile-Routen bleiben auf `/mobile/*`
- Desktop-Redirect von `/mobile/*` geht nun zu `/app`
- isMiniMode-Redirect in Index.tsx geht zu `/mobile/home`

### 7. Navigation-Updates (alle Dateien)

Alle internen Navigationen aktualisieren:

| Alt | Neu |
|-----|-----|
| `navigate('/')` | `navigate('/app')` |
| `navigate('/auth')` | `navigate('/login')` |
| `navigate('/', { state: { activeTab: 'x' } })` | `navigate('/app', { state: { activeTab: 'x' } })` |

Betroffene Dateien:
- `Header.tsx` (Logo-Click, Hilfe-Center, Sign-Out -> `/`)
- `MusicXMLViewerPage.tsx`, `GamePlayPage.tsx`, `SessionListPage.tsx`
- `AdminPage.tsx`, `SharedSessionPage.tsx`, `WordPressCallbackPage.tsx`
- `MobileRouteGuard.tsx`
- `HelpCenterPage.tsx`
- `useAuth.tsx` (signOut -> redirect)

### 8. Analytics-Events tracken

In `logActivity()` (bestehendes System) diese Events tracken:
- `landing_view` -- LandingPage mount (nur wenn nicht eingeloggt)
- `cta_start_click` -- "Kostenlos starten" Click
- `login_view` -- AuthPage mount
- `signup_start` -- Signup-Tab ausgewaehlt
- `auth_success` -- Erfolgreicher Login
- `auto_redirect_to_app` -- Eingeloggter User auf "/" -> "/app"
- `deep_link_gate_view` -- Login-Gate mit returnTo
- `deep_link_resume_success` -- Nach Login zurueck zum Deep-Link

Analytics wird ueber `supabase.from('activity_logs').insert()` direkt gemacht (kein Auth-Context noetig fuer public events, Auth-Events nutzen den bestehenden Auth-Provider).

### 9. Session-Persistence (bereits vorhanden)

Das bestehende Setup ist bereits optimal:
- `localStorage` Persistenz in `client.ts`
- `autoRefreshToken: true`
- `persistSession: true`
- "Angemeldet bleiben" Checkbox in AuthPage

Keine Aenderungen noetig.

---

## Technische Details

### Neue Dateien
- `src/pages/LandingPage.tsx` -- Oeffentliche Conversion-Landingpage
- `src/components/auth/ProtectedRoute.tsx` -- Auth-Guard mit returnTo-Support

### Wesentlich geaenderte Dateien
- `src/App.tsx` -- Komplettes Routing-Update
- `src/pages/AuthPage.tsx` -- returnTo + Tab-Vorauswahl + Gate-Banner
- `src/pages/Index.tsx` -- Auth-Redirect zu `/login`, Basis-Route `/app`
- `src/components/layout/Header.tsx` -- Nav-Links aktualisieren
- `src/components/mobile/MobileRouteGuard.tsx` -- Pfad-Anpassungen

### Leicht geaenderte Dateien (nur navigate-Pfade)
- `MusicXMLViewerPage.tsx`, `GamePlayPage.tsx`, `SessionListPage.tsx`
- `AdminPage.tsx`, `SharedSessionPage.tsx`, `WordPressCallbackPage.tsx`
- `HelpCenterPage.tsx`

### Risiken & Mitigations
- **Bestehende Magic-Link-URLs**: Magic Links redirecten aktuell zu `window.location.origin + '/'`. Da "/" nun die Landingpage ist und eingeloggte User automatisch zu `/app` weitergeleitet werden, funktionieren bestehende Magic Links weiterhin.
- **SEO-Seiten**: Bleiben unveraendert auf ihren aktuellen Routen.
- **Bookmarks**: Bestehende Bookmarks auf "/" werden fuer eingeloggte User transparent zu "/app" weitergeleitet.
