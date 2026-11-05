/* Das Einstellungsmenue der Uebungen — eine Auswahl dessen, was die App
 * in ihren Einstellungen anbietet:
 *
 *   Tonmaterial   Tonart und Umfang (von … bis), oder wieder automatisch
 *   Strenge       wie genau die App zuhoert
 *   Notenbild     Notennamen und Zaehlzeiten, schwarze oder farbige Noten
 *
 * Gespeichert wird alles sofort (localStorage, wie in der App). Beim
 * Schliessen wird die Uebung mit dem neuen Stand neu aufgeschlagen.
 */
import { useMemo, useState } from 'react';
import { gemeinsam, hoehen, t, tonarten, tonartToene, tonName, tx } from './kern';
import type { Art } from './kern';

const STRENGE: [string, string, string][] = [
  ['superleicht', 'strenge.superleicht', 'Sehr nachsichtig'],
  ['leicht', 'strenge.leicht', 'Nachsichtig'],
  ['mittel', 'strenge.mittel', 'Genau'],
  ['schwer', 'strenge.schwer', 'Streng']
];

export function Einstellungen({ art, onSchliessen }: { art: Art; onSchliessen: (geaendert: boolean) => void }) {
  const f = gemeinsam().fortschritt;
  const [, setzeStand] = useState(0);
  const [geaendert, setzeGeaendert] = useState(false);
  const neu = () => { setzeGeaendert(true); setzeStand((n) => n + 1); };

  /* von/bis: eine Zeile je Tonhoehe; voreingestellt ist das jetzige Material. */
  const zeilen = useMemo(hoehen, []);
  const toene = gemeinsam().toene;
  const vorrat: string[] = f.vorratGesamt();
  const midi = (id: string) => toene.find((x: { id: string }) => x.id === id).notiertMidi;
  const vorratMidi = vorrat.map(midi).sort((a: number, b: number) => a - b);
  const [tonart, setzeTonart] = useState('C');
  const [von, setzeVon] = useState<number>(vorratMidi[0]);
  const [bis, setzeBis] = useState<number>(Math.max(vorratMidi[vorratMidi.length - 1], vorratMidi[0] + 7));

  /* Kreuz- und Be-Schreibweise derselben Tonhoehe: "fis / ges". */
  const hoeheName = (id: string) => {
    const zwilling = toene.find((x: { wie?: string }) => x.wie === id);
    return tonName(id) + (zwilling ? ' / ' + tonName(zwilling.id) : '');
  };
  const liste = [...vorrat].sort((a, b) => midi(a) - midi(b)).map(tonName).join(', ');
  const hand: boolean = f.handbetrieb();

  function uebernehmen() {
    const ids = tonartToene(tonart, von, bis);
    if (ids.length) { f.setzeVorrat(ids); neu(); }
  }

  return (
    <div className="tp-menue" role="dialog" aria-modal="true" aria-label={t('einstellungen.titel', 'Einstellungen')}>
      <div className="tp-menue-blatt">
        <div className="tp-menue-kopf">
          <h2>{t('einstellungen.titel', 'Einstellungen')}</h2>
          <button type="button" className="tp-textaktion" onClick={() => onSchliessen(geaendert)}>
            {t('allg.fertig', 'Fertig')}
          </button>
        </div>

        <h3>{t('material.titel', 'Tonmaterial')}</h3>
        <div className="tp-gruppe">
          <label className="tp-zeile">
            <span>{t('material.tonart', 'Tonart')}</span>
            <select value={tonart} onChange={(e) => setzeTonart(e.target.value)}>
              {tonarten().map((x) => <option key={x.id} value={x.id}>{t('tonart.' + x.id, x.name)}</option>)}
            </select>
          </label>
          <label className="tp-zeile">
            <span>{t('material.von', 'von')}</span>
            <select value={von} onChange={(e) => setzeVon(Number(e.target.value))}>
              {zeilen.map((x) => <option key={x.id} value={x.notiertMidi}>{hoeheName(x.id)}</option>)}
            </select>
          </label>
          <label className="tp-zeile">
            <span>{t('material.bis', 'bis')}</span>
            <select value={bis} onChange={(e) => setzeBis(Number(e.target.value))}>
              {zeilen.map((x) => <option key={x.id} value={x.notiertMidi}>{hoeheName(x.id)}</option>)}
            </select>
          </label>
          <button type="button" className="tp-zeile tp-aktion" onClick={uebernehmen}>
            {t('material.setzen', 'Übernehmen')}
          </button>
          <button type="button" className="tp-zeile tp-aktion" disabled={!hand}
                  onClick={() => { f.automatik(); neu(); }}>
            {t('material.automatik', 'Wieder automatisch erweitern')}
          </button>
        </div>
        <p className="tp-hinweis">
          {hand ? t('material.hand', 'Von Hand gewählt: {liste}.', { liste })
                : t('material.auto', 'Automatisch: Ein neuer Ton kommt dazu, sobald die bisherigen sitzen. Zurzeit {liste}.', { liste })}
        </p>

        <h3>{t('strenge.titel', 'Wie streng zuhören?')}</h3>
        <div className="tp-segmente tp-breit">
          {STRENGE.map(([wert, schluessel, urtext]) => (
            <button key={wert} type="button" className={f.schwierigkeit() === wert ? 'an' : ''}
                    aria-pressed={f.schwierigkeit() === wert}
                    onClick={() => { f.setzeSchwierigkeit(wert); neu(); }}>
              {t(schluessel, urtext)}
            </button>
          ))}
        </div>
        <p className="tp-hinweis">
          {tx('Sehr nachsichtig ist die Voreinstellung. Sobald die Töne sicher kommen, eine Stufe weiter: Genau lässt 50 Cent zu, Streng noch 30.',
              'Very lenient is the default. Once the notes come reliably, go one step further: Exact allows 50 cents, Strict only 30.',
              'Muy indulgente es lo predeterminado. Cuando las notas salgan seguras, un paso más: Exacto admite 50 cents, Estricto solo 30.')}
        </p>

        <h3>{t('notenbild.titel', 'Notenbild')}</h3>
        <div className="tp-gruppe">
          {(['namen', 'zaehlen'] as const).map((name) => (
            <button key={name} type="button" className={'tp-zeile' + (f.hilfe(name) ? ' an' : '')}
                    aria-pressed={f.hilfe(name)}
                    onClick={() => { f.setzeHilfe(name, !f.hilfe(name)); neu(); }}>
              <span>{name === 'namen' ? t('hilfen.namen', 'Notennamen unter den Noten')
                                      : t('hilfen.zaehlen', 'Zählzeiten unter den Noten')}</span>
              <i className="tp-schalter" />
            </button>
          ))}
        </div>
        {art === 'toene' && (
          <p className="tp-hinweis">
            {tx('Notennamen und Zählzeiten erscheinen bei den Melodien.',
                'Note names and counting appear in the melodies.',
                'Los nombres y el conteo aparecen en las melodías.')}
          </p>
        )}
        <div className="tp-segmente tp-breit tp-abstand">
          {(['schwarz', 'bunt'] as const).map((farbe) => (
            <button key={farbe} type="button" className={f.notenfarbe() === farbe ? 'an' : ''}
                    aria-pressed={f.notenfarbe() === farbe}
                    onClick={() => { f.setzeNotenfarbe(farbe); neu(); }}>
              {farbe === 'schwarz' ? t('notenbild.schwarz', 'Schwarze Noten') : t('notenbild.bunt', 'Farbige Noten')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
