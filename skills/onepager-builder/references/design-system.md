# Design System Reference

The template uses the **"Refined Industrial Craftsman"** aesthetic — dark heroes, architectural sharp corners, orange accents, bold typography. It's a strong opinionated starting point. Adapt as needed.

## CSS Variables (src/styles/global.css :root)

```css
:root {
  /* Brand Colors — ALWAYS override these for new clients */
  --orange:        #E8611A;   /* Primary accent — CTA buttons, borders, highlights */
  --orange-dark:   #C5511A;   /* Hover states */
  --charcoal:      #2C2C2C;   /* Headlines, about-section bg, footer */
  --charcoal-mid:  #3D3D3D;   /* Gallery placeholder bg */

  /* Neutral Palette — rarely needs changing */
  --gray:          #888888;
  --gray-light:    #E0E0E0;
  --bg:            #F5F5F5;   /* Body background */
  --bg-white:      #FFFFFF;   /* Cards, form backgrounds */
  --text:          #2C2C2C;
  --text-light:    #666666;

  /* Shadows */
  --shadow:        0 2px 20px rgba(0,0,0,0.09);
  --shadow-md:     0 6px 30px rgba(0,0,0,0.15);

  /* Layout */
  --radius:        2px;        /* Sharp corners — increase for rounder look */
  --max-width:     1140px;
  --pad:           clamp(4rem, 9vw, 7rem);  /* Section vertical padding */
}
```

## Adapting for a New Client

### Color Swap (minimum)
1. Replace `--orange` + `--orange-dark` with client's brand color
2. Replace `--charcoal` if client has a dark brand color (navy, forest green, etc.)
3. Search-replace `#E8611A` and `#C5511A` in global.css as safety net

### Logo with White Background (JPEG)
Don't use `filter: brightness(0) invert(1)` — it creates black artifacts.
Instead use a chip approach:
```css
.nav-logo {
  background: rgba(255,255,255,0.18);
  padding: 8px 16px;
  border-radius: 3px;
  border-bottom: 3px solid var(--orange);
  /* NO invert filter */
}
```

### Logo with Transparent Background (PNG/SVG)
Can safely use `filter: brightness(0) invert(1)` for white version on dark backgrounds.

### Rounded vs Sharp
Template defaults to `--radius: 2px` (very sharp, architectural).
For softer industries (e.g. beauty, children): set `--radius: 8px` and replace all `border-radius: 0` with `border-radius: var(--radius)`.

### Light Hero
If client wants a light/white hero instead of dark:
- Remove `.hero-overlay` gradient
- Change `.hero h1` color to `var(--charcoal)`
- Adjust nav text colors

## Section Layout

```
Hero (100vh, dark, slideshow)
↓
Leistungen (white bg, image cards grid)
↓
About (charcoal bg, 2-col: text left / highlights right)
↓
Testimonials (light gray bg, 3-col cards)
↓
Gallery (charcoal bg, 3-col masonry)
↓
FAQ (white bg, accordion)
↓
Contact (light gray bg, info left / form right)
↓
Legal / Impressum (white bg, 2-col)
↓
Footer (near-black #1A1A1A, 1-row: logo / copyright / links / social)
```

## Key Components

### Leistungen Card
- Image: `width: 100%; height: 220px; object-fit: cover` — full bleed top
- Text: `padding: 1.5rem 1.75rem` below image
- Hover: orange left-border lifts card

### Hero Slideshow
- JS: auto-advances every 5s, pause on user interaction
- CSS: `.hero-slide.active { opacity: 1 }` cross-fade
- Dots: animated pill-to-wide (`.hero-dot.active { width: 44px }`)

### Nav Logo Behavior
- At top: 110px height, generous padding chip
- Scrolled (`.site-nav.scrolled`): 44px height, slim
- Transition: `cubic-bezier(0.4, 0, 0.2, 1)` — smooth shrink

### Scroll Animations
- Powered by `IntersectionObserver` (no library)
- Classes: `anim-ready anim-fade-up anim-delay-{1-6}`
- Respects `prefers-reduced-motion`
- Fire once (unobserve after trigger)

## Typography Scale

```
h1 hero:          clamp(3rem, 8vw, 6rem) — weight 900
h2 sections:      clamp(2rem, 4.5vw, 2.8rem) — weight 900
h3 cards:         1.1rem — weight 800
body:             1rem / 1.65 line-height
small labels:     0.72–0.85rem — uppercase, letter-spacing: 0.1em
buttons:          0.9–0.95rem — uppercase, weight 800, letter-spacing: 0.05em
```

Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`
To add a custom Google Font: import in global.css top, update `--font` variable.

## Chevron Motif
The `>>>` chevron is used as decorative CSS in `.hero-tagline::before` and `.about-names::before`. Remove or change for clients where it doesn't fit the brand.
