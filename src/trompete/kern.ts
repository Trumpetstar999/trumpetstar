/* kern.ts — laedt die Maschine der Trompeten-App und reicht sie an die
 * React-Komponenten weiter.
 *
 * Die Dateien unter engine/ sind dieselben wie in der App (Tonerkennung,
 * Klang, Notensatz, die Uebungen). Sie haengen sich beim Laden an
 * globalThis — deshalb hier nur Importe "fuer die Nebenwirkung", in
 * dieser Reihenfolge: was spaeter kommt, braucht, was vorher kam.
 * Bitte nichts darin aendern; Aussehen und Texte stehen in den
 * Komponenten und in trompete.css.
 */
import './engine/audio/dsp.js';
import './engine/audio/sampler.js';
import './engine/audio/tracker.js';
import './engine/audio/motor.js';
import './engine/generator.js';
import './engine/bewertung.js';
import './engine/sprachen.js';
import './engine/fortschritt.js';
import './engine/render/noten.js';
import './engine/render/griff.js';
import './engine/ui/rueckmeldung.js';
import './engine/ui/tempo.js';
import './engine/ui/level1.js';
import './engine/ui/level2.js';
import './engine/ui/einstellungen.js';
import './engine/buehne.js';
import toene from './daten/toene';
import lieder from './daten/lieder';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

export type Sprache = 'de' | 'en' | 'es';
export type Art = 'toene' | 'melodie';

export interface Steuerung {
  starte(art: Art, takte?: 2 | 4): void;
  anhalten(): void;
  einstellungenGeaendert(): void;
  loesen(): void;
}

let basis = '/trompete/';

/** Haengt eine Uebung an ein Element. Klang und Mikrofon starten erst
 *  beim ersten Druck auf Start. */
export function anbinden(wurzel: HTMLElement, basisUrl: string): Steuerung {
  basis = basisUrl;
  return g.TrompeteBuehne.anbinden(wurzel, { toene, lieder, basis });
}

/** Was die ganze Seite teilt: Fortschritt (im localStorage), Tontabelle. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gemeinsam(): any {
  return g.TrompeteBuehne.gemeinsam({ toene, lieder, basis });
}

/** Text in der eingestellten Sprache; der deutsche Urtext steht im Aufruf. */
export function t(schluessel: string, urtext: string, werte?: Record<string, string | number>): string {
  return g.Sprachen.t(schluessel, urtext, werte);
}

/** Text, den es in der App noch nicht gab: alle drei Sprachen hier. */
export function tx(de: string, en: string, es: string): string {
  const jetzt = g.Sprachen.jetzt();
  return jetzt === 'en' ? en : jetzt === 'es' ? es : de;
}

export function setzeSprache(code: Sprache): void {
  g.Sprachen.setzen(code);
}

/** Die Sprache der Seite, wenn keine angegeben ist: <html lang="…">. */
export function spracheDerSeite(): Sprache {
  const lang = (typeof document !== 'undefined' && document.documentElement.lang || '').slice(0, 2);
  return lang === 'en' || lang === 'es' ? lang : 'de';
}

/** Tonname wie in der App: c¹, fis² (deutsch) oder C4, F♯5. */
export function tonName(id: string): string {
  return g.Sprachen.ton(id);
}

/** Eine Zeile je Tonhoehe, aufsteigend — fuer die Auswahl "von … bis". */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hoehen(): any[] {
  return g.Tracker.hoehen(gemeinsam().toene);
}

export function tonarten(): { id: string; name: string }[] {
  return g.Einstellungen.TONARTEN;
}

export function tonartToene(tonart: string, vonMidi: number, bisMidi: number): string[] {
  return g.TrompeteBuehne.tonartToene(gemeinsam().toene, tonart, vonMidi, bisMidi);
}
