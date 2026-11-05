/* <MelodieUebung /> — kurze Melodien vom Blatt, zwei oder vier Takte.
 *
 * Oben wird die Laenge gewaehlt (2 oder 4 Takte) und ob die App
 * mitspielt oder zuhoert. Ein Takt Vorzaehler, dann laeuft die Melodie
 * im Tempo durch; danach steht unter jeder Note, ob sie getroffen war.
 * Mehr dazu in LIESMICH.md. */
import { TrompetenUebung } from './TrompetenUebung';
import type { UebungProps } from './TrompetenUebung';

export function MelodieUebung(props: UebungProps) {
  return <TrompetenUebung art="melodie" {...props} />;
}
