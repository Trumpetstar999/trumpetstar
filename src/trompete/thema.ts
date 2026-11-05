/* thema.ts — holt die Farben aus dem Theme des Lovable-Projekts.
 *
 * Lovable baut mit shadcn/ui. Dessen Farben stehen als CSS-Variablen an
 * <html>: --primary, --background, --card, --muted, --border … — in
 * aelteren Projekten als HSL-Dreiergruppe ("222 47% 11%", benutzt als
 * hsl(var(--primary))), in neueren als fertige Farbe ("oklch(…)",
 * benutzt als var(--primary)). Welche Schreibweise gilt, wird hier
 * einmal nachgesehen; die Uebung verweist dann auf die Variablen
 * selbst und folgt so auch dem Wechsel zwischen hell und dunkel.
 *
 * Findet sich kein Theme, bleiben die Farben aus trompete.css.
 * Einzelne Farben lassen sich jederzeit von aussen ueberschreiben,
 * z. B. style={{ '--tp-tint': '#e11d48' }}.
 */
import type { CSSProperties } from 'react';

type Form = 'hsl' | 'direkt' | null;

function form(): Form {
  if (typeof document === 'undefined') { return null; }
  const wert = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  if (!wert) { return null; }
  return /^-?[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%/.test(wert) ? 'hsl' : 'direkt';
}

export function themaVariablen(): CSSProperties {
  const f = form();
  if (!f) { return {}; }
  const farbe = (name: string) => (f === 'hsl' ? `hsl(var(--${name}))` : `var(--${name})`);
  const zart = (name: string, anteil: number) =>
    f === 'hsl' ? `hsl(var(--${name}) / ${anteil})` : `color-mix(in srgb, var(--${name}) ${anteil * 100}%, transparent)`;
  return {
    '--tp-flaeche': farbe('card'),
    '--tp-text': farbe('foreground'),
    '--tp-text-2': farbe('muted-foreground'),
    '--tp-rand': farbe('border'),
    '--tp-fuellung': farbe('muted'),
    '--tp-segment-an': farbe('background'),
    '--tp-tint': farbe('primary'),
    '--tp-auf-tint': farbe('primary-foreground'),
    '--tp-tint-zart': zart('primary', 0.12),
    '--tp-stopp': farbe('destructive'),
    // --destructive-foreground fehlt in neueren shadcn-Themes: dann weiss.
    '--tp-auf-stopp': f === 'hsl' ? 'hsl(var(--destructive-foreground, 0 0% 100%))'
                                  : 'var(--destructive-foreground, #fff)',
    '--tp-rund': 'var(--radius, 0.75rem)'
  } as CSSProperties;
}
