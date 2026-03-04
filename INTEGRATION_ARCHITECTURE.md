# Trumpetstar + Dashboard Integration Architecture

## Systemübersicht

```
┌─────────────────────────────────────────────────────────┐
│                      SUPABASE                           │
│  (Gemeinsame Datenbank für beide Systeme)               │
├─────────────────────────────────────────────────────────┤
│  App-Tables          │  Dashboard-Tables                │
│  ─────────────       │  ────────────────                │
│  • user_progress     │  • tasks                         │
│  • practice_sessions │  • team_members                  │
│  • achievements      │  • content_pipeline              │
│  • video_progress    │  • calendar_events               │
│  • memberships       │  • social_posts                  │
│  • recordings        │  • digistore_orders              │
└─────────────────────────────────────────────────────────┘
            │                           │
            ▼                           ▼
┌─────────────────────┐    ┌──────────────────────────────┐
│  TRUMPETSTAR APP    │    │  CLAWBOT DASHBOARD           │
│  (Lern-App)         │    │  (Mission Control)           │
│                     │    │                              │
│  • Lern-Fortschritt │    │  • Zeigt App-Statistiken     │
│  • Video-Player     │    │  • Managed Content           │
│  • Pitch Detection  │    │  • Team Koordination         │
│  • Gamification     │    │  • Marketing Pipeline        │
└─────────────────────┘    └──────────────────────────────┘
```

## Datenflüsse

### 1. App → Dashboard (Echtzeit-Statistiken)
```
user_progress ──┐
practice_sessions ──┼──► Dashboard Widgets
achievements ───────┤    (Aktive User, Fortschritt)
memberships ────────┘
```

### 2. Dashboard → App (Content & Tasks)
```
content_pipeline ────┐
social_posts ────────┼──► App Content Feed
seo_content_items ───┘    (Ankündigungen, Tipps)

tasks ───────────────► App Notifications
(reminders, new features)
```

### 3. Cross-System Automatisierungen
```
DigiStore24 Order ───┐
     │               │
     ▼               │
Dashboard (Log)      │
     │               │
     ▼               │
App (New Member) ◄───┘
     │
     ▼
Welcome Sequence
```

## Neue Tabellen (Vorschläge)

### `app_analytics` (Dashboard liest App-Daten)
```sql
- id
- metric_type (active_users, completed_lessons, etc.)
- value
- timestamp
- period (daily, weekly, monthly)
```

### `content_publications` (Verknüpfung)
```sql
- id
- content_pipeline_id (Dashboard)
- app_section (where to show in app)
- publish_status
- published_at
- target_audience (all, beginners, advanced)
```

### `user_insights` (Dashboard analysiert)
```sql
- id
- insight_type (churn_risk, upsell_potential)
- user_id
- data_snapshot
- recommended_action
- created_at
```

## Integration Features

### Dashboard zeigt:
1. **Live-App-Stats**
   - Aktive User (heute)
   - Absolvierte Übungen
   - Neueste Achievements
   - Churn-Warnungen

2. **Content Performance**
   - Welche Videos werden geschaut?
   - Social Posts → App-Traffic
   - Conversion Funnel

3. **Automatisierte Tasks**
   - User inaktiv seit 7 Tagen → Task erstellen
   - Neue Mitgliedschaft → Willkommens-Sequenz
   - Support-Anfrage → Ticket im Dashboard

### App zeigt Dashboard-Content:
1. **Ankündigungen** (aus Content Pipeline)
2. **Tipps der Woche** (aus Social Posts)
3. **Team-Updates** (aus Team Activity)
4. **Events** (aus Calendar)

## API Endpoints (nötig)

### Neue Edge Functions in Supabase:

```typescript
// 1. get-app-stats.ts
// Dashboard ruft App-Statistiken ab

// 2. sync-content-to-app.ts  
// Publiziert Content aus Dashboard in App

// 3. user-insights-generator.ts
// Analysiert User-Verhalten, erstellt Insights

// 4. webhook-bridge.ts
// Verbindet DigiStore24 → Dashboard → App
```

## Implementierungsphasen

### Phase 1: Read-Only Integration (Woche 1)
- Dashboard zeigt App-Statistiken
- Keine Code-Änderungen in App nötig

### Phase 2: Content-Sync (Woche 2)
- Dashboard Content erscheint in App
- App zeigt "News" Feed

### Phase 3: Automatisierung (Woche 3-4)
- Webhooks zwischen Systemen
- Automatische Tasks bei Events

## Technische Anforderungen

1. **Supabase Row Level Security**
   - Dashboard: Vollzugriff auf alle Tables
   - App: Nur eigene User-Daten lesen

2. **Realtime Subscriptions**
   - Dashboard live-updates bei App-Events
   - App live-updates bei neuem Content

3. **Edge Functions**
   - Für komplexe Joins zwischen Systemen
   - Für externe API-Integrationen

## Files zu bearbeiten

### Dashboard (clawbot-command):
```
src/
├── components/
│   └── analytics/
│       ├── AppStatsWidget.tsx      # NEU
│       ├── UserActivityChart.tsx   # NEU
│       └── ContentPerformance.tsx  # NEU
├── hooks/
│   └── useAppAnalytics.ts          # NEU
└── pages/
    └── AnalyticsDashboard.tsx      # NEU
```

### App (trumpetstar):
```
src/
├── components/
│   └── dashboard/
│       ├── NewsFeed.tsx            # NEU
│       └── TeamUpdates.tsx         # NEU
├── hooks/
│   └── useDashboardContent.ts      # NEU
└── pages/
    └── NewsPage.tsx                # NEU
```
