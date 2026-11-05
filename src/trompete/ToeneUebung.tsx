/* <ToeneUebung /> — einzelne Toene treffen und halten.
 *
 * Die App spielt den Ton vor, hoert ueber das Mikrofon zu und sagt, was
 * sie gehoert hat; daneben stehen Tonname, Griff und ein Stimmgeraet.
 * Mehr dazu in LIESMICH.md. */
import { TrompetenUebung } from './TrompetenUebung';
import type { UebungProps } from './TrompetenUebung';

export function ToeneUebung(props: UebungProps) {
  return <TrompetenUebung art="toene" {...props} />;
}
