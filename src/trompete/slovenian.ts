// Extend the imported exercise dictionary without changing recognition logic.
const texts: Record<string, string> = {
  'lov.startet': 'Trenutek – vklapljanje zvoka in mikrofona …',
  'lov.ohneMikro': 'Ni dostopa do mikrofona. Vaja zaigra ton, vendar te ne sliši – dovoli mikrofon v brskalniku.',
  'lov.ohneTon': 'Ta brskalnik ne more predvajati zvoka.',
  'allg.zurueck': 'Nazaj', 'allg.fertig': 'Končano',
  'einstellungen.titel': 'Nastavitve', 'titel.toene': 'Toni', 'titel.melodie': 'Melodija',
  'rhythmus.takte2': '2 takta', 'rhythmus.takte4': '4 takti',
  'hilfen.aria': 'Pripomočki za branje', 'hilfen.namen.kurz': 'Imena tonov', 'hilfen.zaehlen.kurz': 'Štetje',
  'griff.wort': 'Prijem {g}', 'griff.offen': '0 (odprto)', 'klingt.wort': 'zveni {ton}',
  'leiste.start': 'Začni', 'leiste.stopp': 'Ustavi', 'leiste.naechste': 'Naslednja vaja',
  'modus.aria': 'Kdo igra', 'modus.mit': 'Ob spremljavi', 'modus.solo': 'Samostojno',
  'stimm.tief': 'prenizko', 'stimm.hoch': 'previsoko',
  'tempo.titel': 'Tempo', 'tempo.langsamer': 'Počasneje', 'tempo.schneller': 'Hitreje',
  'einheit.cent': 'centov',
  'l1.bereit': 'Pritisni »Začni«: aplikacija zaigra ton, nato si na vrsti ti.',
  'l1.vorspielen': 'Poslušaj …', 'l1.hoeren': 'Na vrsti si: zaigraj {ton} in ga drži enakomerno.',
  'l1.treffer': 'Uspelo je – {ton}, {cent}.', 'cent.genau': 'dobro uglašeno',
  'cent.tief': '{n} centov prenizko', 'cent.hoch': '{n} centov previsoko',
  'l1.ueberblasen': 'Preveč pihanja: prijem je pravilen, vendar je zazvenel {gehoert}. Sprosti ustnice in pihaj nežneje.',
  'l1.ungenau': 'To je bil {ton}, vendar {cent} – odstopanje je preveliko za izbrano strogost.',
  'l1.anderer': 'To je bil {gehoert} – iskani ton je {ton}, prijem {griff}.',
  'l1.stille': 'Ničesar nisem zaznal. Še enkrat zaigram ton – približaj se mikrofonu.',
  'l2.bereit.mit': 'Aplikacija igra vajo skupaj s tabo – brez ocenjevanja.',
  'l2.bereit.solo': 'Samostojno: teče samo metronom. Zdaj se šteje.',
  'l2.vorzaehler': 'Uvodno štetje …', 'l2.laeuft.mit': 'Igraš ob spremljavi …', 'l2.laeuft.solo': 'Samostojno …',
  'l2.nachMit': 'Zdaj samostojno: pritisni »Začni«, ko si pripravljen.',
  'l2.sauber': 'Zadetih vseh {n} tonov.', 'l2.teils': 'Zadetih {g} od {n} tonov.',
  'l2.nichts': 'Noben ton ni bil zaznan. Približaj se mikrofonu ali najprej igraj ob spremljavi.',
  'zeit.genau': 'Ritem je bil natančen.', 'zeit.frueh': 'V povprečju {ms} ms prezgodaj.', 'zeit.spaet': 'V povprečju {ms} ms prepozno.',
  'l2.tempoTipp': 'Trikrat brez napake – čas je za hitrejši tempo?',
  'l2.weiter': 'Ponovi ali izberi »Naslednja vaja«.', 'l2.lied': 'Morda poznaš ta napev: {name}',
  'material.titel': 'Nabor tonov', 'material.tonart': 'Tonaliteta', 'material.von': 'od', 'material.bis': 'do',
  'material.setzen': 'Uporabi', 'material.automatik': 'Znova samodejno razširi',
  'material.hand': 'Izbrano ročno: {liste}.', 'material.auto': 'Samodejno: nov ton se doda, ko so dosedanji zanesljivi. Trenutno: {liste}.',
  'strenge.titel': 'Kako strogo poslušati?', 'strenge.superleicht': 'Zelo prizanesljivo', 'strenge.leicht': 'Prizanesljivo',
  'strenge.mittel': 'Natančno', 'strenge.schwer': 'Strogo', 'notenbild.titel': 'Notni zapis',
  'hilfen.namen': 'Imena tonov pod notami', 'hilfen.zaehlen': 'Štetje pod notami',
  'tonart.C': 'C-dur / a-mol', 'tonart.G': 'G-dur / e-mol', 'tonart.D': 'D-dur / h-mol', 'tonart.A': 'A-dur / fis-mol',
  'tonart.F': 'F-dur / d-mol', 'tonart.B': 'B♭-dur / g-mol', 'tonart.Es': 'E♭-dur / c-mol', 'tonart.As': 'A♭-dur / f-mol',
  'tonart.kreuz': 'Kromatično (višaji)', 'tonart.be': 'Kromatično (nižaji)',
};
type Dictionary = { liste: string[]; texte: Record<string, Record<string, string>> };
const engine = (globalThis as typeof globalThis & { Sprachen?: Dictionary }).Sprachen;
if (engine) {
  engine.liste.push('sl');
  Object.entries(texts).forEach(([key, value]) => {
    engine.texte[key] = { ...engine.texte[key], sl: value };
  });
}