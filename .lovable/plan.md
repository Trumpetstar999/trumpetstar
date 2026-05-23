## Ziel

Die Hintergrundfarben des neuen `CinematicHero` von dunkel (#06080F / #0A101D / #162C6D) auf die offiziellen Trumpetstar-Brand-Farben umstellen, damit der Hero nahtlos in die restliche Landingpage passt.

## Trumpetstar Brand-Farben (aus `src/index.css`)

- `--brand-blue-start`: `#1E86FF` (oben)
- `--brand-blue-mid`: `#0F5EDB` (mitte)
- `--brand-blue-end`: `#0B2E8A` (unten/tief)
- `--reward-gold`: `#FFCC00` (Akzent, bleibt)

## Änderungen in `src/components/landing/CinematicHero.tsx`

1. **Outer Container Background**
   - Von: `bg-[#06080F]`
   - Nach: vertikaler Gradient `linear-gradient(180deg, #1E86FF 0%, #0F5EDB 40%, #0B2E8A 100%)` (identisch zur Landingpage-Section darunter → fließender Übergang)

2. **`.premium-depth-card` Hintergrund**
   - Von: `linear-gradient(145deg, #162C6D 0%, #0A101D 100%)`
   - Nach: `linear-gradient(145deg, #0F5EDB 0%, #0B2E8A 100%)` (Brand-Blau Mid → End)
   - Shadows/insets bleiben für 3D-Tiefe erhalten

3. **iPhone-Screen Innenraum**
   - Von: `bg-[#0A101D]`
   - Nach: `bg-[#0B2E8A]` (Brand-Blau End) — falls Screenshot lädt, kaum sichtbar, sonst markenkonform

4. **Widget-Depth (Progress-Ring Overlay)**
   - Von: `rgba(20,30,60,...)` → `rgba(10,15,30,...)`
   - Nach: passend zum Brand-Blue End: `rgba(11,46,138,0.85) → rgba(15,94,219,0.85)`

5. **Akzent-Gold** in `text-gold-matte`, Floating-Badge-Icons, CTA-Button und Bullet-Points
   - Von: `#C9A24C` / `#FFE9A8`
   - Nach: `#FFCC00` (reward-gold) bzw. Gradient `#FFE066 → #FFCC00` für den Light-Button — passt exakt zur Trumpetstar Gold-Belohnungsfarbe

6. **`.bg-grid-theme`** Grid-Linien: heller machen, da Hintergrund jetzt blau (`rgba(255,255,255,0.10)` statt `0.06`)

## Was unverändert bleibt

- GSAP-Animationen, Timeline, Layout, Inhalte
- iPhone-Bezel (`#111` / `#52525B`) — Hardware soll realistisch dunkel bleiben
- Skeuomorphismus-Schatten und Inset-Highlights

## Dateien

- ✅ Edit: `src/components/landing/CinematicHero.tsx` (nur CSS-Werte im `INJECTED_STYLES`-Block + 2 inline Tailwind-Klassen)
- ❌ Keine Änderung an `LandingPage.tsx`, Tokens oder anderen Komponenten
