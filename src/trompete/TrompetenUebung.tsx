/* TrompetenUebung — die gemeinsame Huelle von ToeneUebung und
 * MelodieUebung.
 *
 * Gezeichnet wird hier nur das Geruest. Was sich waehrend des Uebens
 * bewegt — Noten, Griffbild, Stimmgeraet, Statuszeile, Start/Stopp —
 * schreibt die Maschine der Trompeten-App selbst hinein (siehe
 * kern.ts). Deshalb ist das Geruest eine eigene, gemerkte Komponente:
 * React zeichnet es nur neu, wenn sich Sprache, Art oder die Taktzahl
 * aendern, und kommt der Maschine sonst nicht in die Quere.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { anbinden, setzeSprache, spracheDerSeite, t, tx } from './kern';
import type { Art, Sprache, Steuerung } from './kern';
import { Button } from '@/components/ui/button';
import { Einstellungen } from './Einstellungen';
import './trompete.css';

export interface UebungProps {
  /** de, en oder es. Ohne Angabe: die Sprache der Seite (<html lang>). */
  sprache?: Sprache;
  /** Wo die Klang- und Analysedateien liegen (Ordner public/trompete/). */
  basisUrl?: string;
  /** Zeigt links oben "Zurueck" und ruft das beim Tippen auf. */
  onZurueck?: () => void;
  className?: string;
  style?: CSSProperties;
}

const TAKTE_SCHLUESSEL = 'trompete-lovable.takte';

function gemerkteTakte(): 2 | 4 {
  try { return localStorage.getItem(TAKTE_SCHLUESSEL) === '4' ? 4 : 2; } catch { return 2; }
}

export function TrompetenUebung({ art, sprache, basisUrl = '/trompete/', onZurueck, className, style }:
  UebungProps & { art: Art }) {
  const code = sprache ?? spracheDerSeite();
  /* Die Sprache gilt fuer die Maschine als Ganzes — gesetzt, bevor die
   * Texte des Geruests gelesen werden. */
  useMemo(() => setzeSprache(code), [code]);

  const wurzel = useRef<HTMLDivElement>(null);
  const steuerung = useRef<Steuerung | null>(null);
  const [takte, setzeTakte] = useState<2 | 4>(gemerkteTakte);
  const [menue, setzeMenue] = useState(false);


  /* Anbinden, wenn das Geruest steht; loesen, wenn es geht. */
  useEffect(() => {
    if (!wurzel.current) { return; }
    const s = anbinden(wurzel.current, basisUrl);
    steuerung.current = s;
    s.starte(art, gemerkteTakte());
    return () => { s.loesen(); steuerung.current = null; };
  }, [art, code, basisUrl]);

  const waehleTakte = useCallback((n: 2 | 4) => {
    setzeTakte(n);
    try { localStorage.setItem(TAKTE_SCHLUESSEL, String(n)); } catch { /* egal */ }
    steuerung.current?.starte('melodie', n);
  }, []);

  const oeffneMenue = useCallback(() => {
    steuerung.current?.anhalten();
    setzeMenue(true);
  }, []);

  const schliesseMenue = useCallback((geaendert: boolean) => {
    setzeMenue(false);
    if (geaendert) { steuerung.current?.einstellungenGeaendert(); }
  }, []);

  return (
    <div ref={wurzel} className={'tp-uebung' + (className ? ' ' + className : '')} data-art={art}
         lang={code} style={style}>
      <Geruest key={code} art={art} takte={takte} zurueck={!!onZurueck}
               onZurueck={onZurueck} onTakte={waehleTakte} onMenue={oeffneMenue} />
      {menue && <Einstellungen art={art} onSchliessen={schliesseMenue} />}
    </div>
  );
}

interface GeruestProps {
  art: Art;
  takte: 2 | 4;
  zurueck: boolean;
  onZurueck?: () => void;
  onTakte: (n: 2 | 4) => void;
  onMenue: () => void;
}

const Geruest = memo(function Geruest({ art, takte, zurueck, onZurueck, onTakte, onMenue }: GeruestProps) {
  const melodie = art === 'melodie';
  return (
    <div className="tp-raster">
      <div className="tp-leiste">
        {zurueck && (
          <Button variant="ghost" type="button" className="tp-zurueck" onClick={onZurueck}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            <span>{t('allg.zurueck', 'Zurück')}</span>
          </Button>
        )}
        <div className="tp-titelzeile"><b data-tp="titel" /></div>

        <div data-tp="punkte" className="tp-punkte aus" aria-hidden="true">
          <span className="punkt" /><span className="punkt" /><span className="punkt" /><span className="punkt" />
        </div>

        {melodie && (
          <div className="tp-segmente" role="group" aria-label={tx('Länge', 'Length', 'Duración', 'Dolžina')}>
            {([2, 4] as const).map((n) => (
              <Button variant="ghost" key={n} type="button" className={takte === n ? 'an' : ''} aria-pressed={takte === n}
                      onClick={() => onTakte(n)}>
                {n === 2 ? t('rhythmus.takte2', '2 Takte') : t('rhythmus.takte4', '4 Takte')}
              </Button>
            ))}
          </div>
        )}

        {melodie && (
          <div className="tp-segmente" role="group" aria-label={t('modus.aria', 'Wer spielt')}>
            <Button variant="ghost" type="button" data-tp="modus-mit">{t('modus.mit', 'Mitspielen')}</Button>
            <Button variant="ghost" type="button" data-tp="modus-solo">{t('modus.solo', 'Solo')}</Button>
          </div>
        )}

        <Button variant="ghost" type="button" className="tp-kapsel tp-zahnrad" onClick={onMenue}
                aria-label={t('einstellungen.titel', 'Einstellungen')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="6.4" /><circle cx="12" cy="12" r="2.3" />
            <path strokeWidth="3.3" strokeLinecap="butt"
                  d="M12 2.3v3.2M12 18.5v3.2M2.3 12h3.2M18.5 12h3.2M5.14 5.14l2.27 2.27M16.59 16.59l2.27 2.27M18.86 5.14l-2.27 2.27M7.41 16.59l-2.27 2.27" />
          </svg>
        </Button>

        <Button variant="ghost" type="button" data-tp="spielknopf" className="tp-spielknopf bereit" aria-label="Start">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <polygon className="ikon-play" points="26,14 88,50 26,86" />
            <rect className="ikon-stop" x="20" y="20" width="60" height="60" rx="12" />
          </svg>
          <span data-tp="spieltext">{t('leiste.start', 'Start')}</span>
        </Button>
      </div>

      <div data-tp="notenfeld" className="tp-notenfeld">
        <svg data-tp="noten" className="tp-noten" aria-hidden="true" />
      </div>

      <div className="tp-infofeld">
        <div className="tp-tonkopf">
          <div data-tp="tonname" className="tp-tonname" />
          <div className="tp-toninfo">
            <span data-tp="ton-griff" className="tp-ton-griff" />
            <span data-tp="ton-klingt" />
          </div>
        </div>
        <div data-tp="grifffeld" className="tp-grifffeld">
          <svg data-tp="griff" className="tp-griff" aria-hidden="true" />
        </div>
        <div data-tp="stimmung" className="tp-stimmung" aria-hidden="true">
          <div className="stimm-skala">
            <i className="stimm-gut" /><i className="stimm-mitte" />
            <i data-tp="stimm-zeiger" className="stimm-zeiger" />
          </div>
          <div className="stimm-zeile">
            <span>{t('stimm.tief', 'tiefer')}</span>
            <b data-tp="stimm-wert">–</b>
            <span>{t('stimm.hoch', 'höher')}</span>
          </div>
        </div>
      </div>

      <div data-tp="status" className="tp-status" role="status" aria-live="polite" />

      <div className="tp-fusszeile">
        <div data-tp="tempofeld" className="tp-tempofeld">
          <span className="tp-feldname">{t('tempo.titel', 'Tempo')}</span>
          <Button variant="ghost" type="button" data-tp="tempo-minus" className="tp-rund" aria-label={t('tempo.langsamer', 'Langsamer')}>−</Button>
          <b data-tp="tempozahl" className="tp-tempozahl">60</b>
          <Button variant="ghost" type="button" data-tp="tempo-plus" className="tp-rund" aria-label={t('tempo.schneller', 'Schneller')}>+</Button>
          <div data-tp="tempobahn" className="tp-tempobahn">
            <div className="tp-tempospur" />
            <div data-tp="tempogriff" className="tp-tempogriff" />
          </div>
        </div>
        <div className="tp-hilfen" role="group" aria-label={t('hilfen.aria', 'Hilfen im Notenbild')}>
          <Button variant="ghost" type="button" data-tp="hilfe-namen">{t('hilfen.namen.kurz', 'Notennamen')}</Button>
          <Button variant="ghost" type="button" data-tp="hilfe-zaehlen">{t('hilfen.zaehlen.kurz', 'Zählzeiten')}</Button>
        </div>
        <Button variant="ghost" type="button" data-tp="umblaettern" className="tp-kapsel tp-umblaettern">
          <span>{t('leiste.naechste', 'Nächste Übung')}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </Button>
      </div>

      <div data-tp="buehne" className="tp-buehne" aria-hidden="true" />
    </div>
  );
});
