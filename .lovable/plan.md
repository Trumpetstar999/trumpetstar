## Ziel
Den dezenten "premium frame"-Effekt aus dem Cinematic Hero (tiefe Schatten, dunkler Verlauf-Rand, leichter Sheen-Glanz) auf die Screenshot-Bilder der Landingpage anwenden – ohne 3D-Mouse-Tilt.

## Betroffene Stellen in `src/pages/LandingPage.tsx`
1. **Hero-Slideshow-Container** (Zeile ~382–409): der klickbare Wrapper, der die rotierenden App-Screenshots zeigt.
2. **Zigzag-Bildrahmen "Ein Blick in die App"** (Zeile ~460–473): jeder Screenshot in den abwechselnden Rows.

Logos (`trumpetstar-logo`, `bekannt-aus`, `testimonials-real`) bleiben unberührt.

## Umsetzung
- Neue CSS-Utility-Klasse `.lp-premium-frame` in der vorhandenen `<style>`-Sektion der LandingPage (oder `index.css`) anlegen:
  - `background: linear-gradient(145deg, #162C6D 0%, #0A101D 100%)` als Rahmen-Fläche
  - `box-shadow`: kombinierter Außen-Drop + innerer Highlight + innerer Tiefen-Schatten (wie `premium-depth-card`, etwas reduziert)
  - `border: 1px solid rgba(255,255,255,0.06)`
  - Padding ~4–6px, damit das Bild als „eingelassen" wirkt
- Sheen-Overlay als `::after`-Pseudo-Element: statischer Radial-Gradient (oben-links), `mix-blend-mode: screen`, sehr dezent (~6% opacity), `pointer-events: none`. Kein Maus-Tracking → bessere Performance, ruhiger.
- Innere Bildkante: `border-radius` minimal kleiner als der äußere Rahmen für sauberen "Inset"-Look.

## Anwendung
- Hero-Slideshow: bestehenden Wrapper-`div` um die Klasse erweitern, äußeren `border`/`shadow` durch `.lp-premium-frame` ersetzen.
- Zigzag-Rows: den `lp-img-zoom`-Wrapper jeder Bildkachel mit `.lp-premium-frame` versehen, vorhandene `border-slate-200 shadow-2xl` entfernen.
- Hover-Verhalten (Lift) bleibt erhalten.

## Light/Dark Konsistenz
Die Zigzag-Section hat hellen Hintergrund – der dunkle Premium-Rahmen passt zum App-Branding (blau/gold) und schafft starken Kontrast wie ein echtes Display-Gehäuse. Gold-Glow-Halo hinter dem Bild bleibt bestehen.

## Out of Scope
- Keine Maus-Parallax/3D-Tilt.
- Keine Änderung an Logos, Testimonial-Bildern, Avataren oder dem Cinematic Hero selbst.
- Keine Layout-/Spacing-Änderungen.