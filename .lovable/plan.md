## Ziel

Den Cinematic Hero (GSAP scroll-pinned Animation mit iPad-Mockup) ganz oben auf der Landingpage integrieren — mit echten Trumpetstar-Inhalten, Logo und Screenshots aus dem Projekt. Bestehende Sections bleiben unverändert darunter.

## Inhalte (Trumpetstar-spezifisch)

- **Brand**: Trumpetstar (Logo aus `@/assets/trumpetstar-logo.png`)
- **Tagline oben**: "Trompete lernen," / "kinderleicht."
- **Card-Headline**: "440+ Mitspielvideos. 24+ Levels."
- **Card-Beschreibung**: "Vom ersten Ton bis zum Konzertstück – mit Mario Schulter, KI-Coach Tim und der gamifizierten Starmethode."
- **Metric**: `440` mit Label "Mitspielvideos"
- **Floating Badges** rund ums iPhone-Mockup (echte USPs):
  - "4,9 ★ Bewertung"
  - "500+ Schüler:innen"
  - "30 Tage Geld-zurück"
  - "iOS · Android · Web"
- **iPhone-Screen** zeigt `shotLevels.webp` (statt generischem Mockup) mit overlay-Widget "Wochenfortschritt"
- **CTA-Ende**: "Starte heute mit Trompete." → Button "Jetzt kostenlos starten" (→ `/auth`) + "Pro ansehen" (→ `/pricing`)

## Technische Umsetzung

1. **Install**: `bun add gsap` (ScrollTrigger ist Teil des Pakets)
2. **Neue Datei**: `src/components/landing/CinematicHero.tsx`
  - Übernimmt das Template, bereinigt die im Snippet kaputten JSX-Stellen (Description-String, JSX-Return-Body fehlt im Snippet)
  - Baut vollständigen JSX-Tree: `containerRef` Wrapper (h-screen, sticky), `.hero-text-wrapper` mit `tagline1 / tagline2 / text-days`, `.main-card` Wrapper mit linkem Textblock, mittigem iPhone-Mockup (`.iphone-bezel` + `.screen-glare` + Bild + `.phone-widget` mit `progress-ring` SVG + `counter-val`), rechtem Textblock, `.floating-badge` Elementen absolut positioniert, `.cta-wrapper` als Endzustand
  - Mouse-parallax + GSAP Timeline exakt wie im Snippet (pin, scrub, 7000px scroll length)
  - Inject-Styles via `<style>{INJECTED_STYLES}</style>` im Root
  - Verwendet semantische Tokens wo möglich, behält Hardcoded-Werte nur in der `.premium-depth-card`/`.iphone-bezel` (Skeuomorphismus erfordert es)
3. **Integration in `src/pages/LandingPage.tsx**`:
  - Import `CinematicHero` und einbinden ganz oben, **vor** der bisherigen Hero-Section
  - Props: `brandName`, `tagline1`, `tagline2`, `cardHeading`, `cardDescription`, `metricValue={440}`, `metricLabel`, `ctaHeading`, `ctaDescription`, plus neue `screenshotSrc` (für iPhone) und `onPrimaryCta` / `onSecondaryCta` Handler die zu `/auth` bzw. `/pricing` navigieren
  - Bestehender Hero-Slider/Sections bleiben unverändert darunter
4. **Performance**: Lazy-load Screenshots; ScrollTrigger cleanup via `ctx.revert()` (bereits im Snippet)
5. **Responsiveness**: Snippet hat bereits `isMobile` Branching; iPad-first beachten (>768px = Desktop-Layout)

## Hinweise

- Das Snippet im Prompt enthält Truncierungen (z.B. abgebrochene `cardDescription`-Default, leerer Return-Block, `@/components/ui/cinematic-landing-hero";` Fragment). Ich rekonstruiere den vollständigen, lauffähigen JSX-Baum gemäß GSAP-Timeline-Selektoren (`.text-track`, `.text-days`, `.main-card`, `.mockup-scroll-wrapper`, `.phone-widget`, `.floating-badge`, `.card-left-text`, `.card-right-text`, `.cta-wrapper`, `.counter-val`, `.progress-ring`).
- GSAP ist gratis (Standard-Plugins inkl. ScrollTrigger). Kein zusätzlicher Lizenz-/Secret-Bedarf.
- Dark Glassmorphism + Gold passt zur bestehenden Brand; die Hardcoded Card-Dunkelheit ist mit der Trumpetstar-Optik kompatibel.

## Was sich ändert

- ✅ Neu: `src/components/landing/CinematicHero.tsx`
- ✅ Edit: `src/pages/LandingPage.tsx` (Hero ganz oben einbinden)
- ✅ Dep: `gsap` hinzugefügt
- ❌ Keine Änderung an bestehenden Sections, Routing, Backend