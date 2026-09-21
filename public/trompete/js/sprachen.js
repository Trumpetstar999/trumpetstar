/* sprachen.js — der Elternbereich in drei Sprachen.
 *
 * Das Kind sieht in dieser App keinen einzigen Satz: Noten, Farben,
 * Griffbilder, Tiere. Uebersetzt werden muss deshalb genau eine
 * Stelle — der Elternbereich. Er ist der einzige Ort, an dem Text
 * steht, und damit auch der einzige, den eine englisch- oder
 * spanischsprachige Familie ueberhaupt lesen muss.
 *
 * Der deutsche Text steht NICHT hier, sondern in index.html: dort ist
 * er im Zusammenhang lesbar und bleibt es. Diese Datei traegt nur die
 * Uebersetzungen. Ein Schluessel ohne Eintrag faellt damit auf den
 * deutschen Urtext zurueck — nie auf eine leere Zeile.
 *
 * Wer Text ergaenzt: data-t im HTML setzen, hier zwei Zeilen dazu.
 * test/test-sprachen-app.js meldet, was vergessen wurde.
 */
(function (root) {
  'use strict';

  var SPRACHEN = ['de', 'en', 'es'];

  /* Der deutsche Ton h heisst im Englischen wie im Spanischen B —
   * dieselbe Umbenennung, die auch die englische Ausgabe macht.
   * »h1« liest ein englischsprachiger Vater sonst als Tippfehler.
   *
   * Gemeint sind hier immer die NOTIERTEN Namen. Was die Trompete
   * dazu klingen laesst, liegt eine Stufe tiefer — das steht im
   * Elternbereich unter »Warum klingt es tiefer«. */
  var TON = { en: { h: 'B' }, es: { h: 'B' } };

  var TEXTE = {
    'eltern.titel':            { en: 'Parents',            es: 'Padres' },
    'eltern.quoten':           { en: 'Success rates',      es: 'Aciertos' },

    'eltern.tonumfang':        { en: 'Range of notes',     es: 'Ámbito de notas' },
    'eltern.tonumfang.hinweis': {
      en: 'Every note can be switched on and off on its own. As long as the '
        + 'choice is made by hand here, the app no longer adds notes by itself.',
      es: 'Cada nota se puede activar y desactivar por separado. Mientras la '
        + 'elección se haga a mano aquí, la aplicación ya no añade notas por su cuenta.' },
    'eltern.automatik':        { en: 'Back to automatic',  es: 'Volver a automático' },

    'eltern.strenge':          { en: 'How strictly should it listen?',
                                 es: '¿Con qué rigor debe escuchar?' },
    'eltern.strenge.superleicht': { en: 'Very easy',         es: 'Muy fácil' },
    'eltern.strenge.leicht':   { en: 'Easy',                es: 'Fácil' },
    'eltern.strenge.mittel':   { en: 'Medium',              es: 'Medio' },
    'eltern.strenge.schwer':   { en: 'Hard',                es: 'Difícil' },
    'eltern.strenge.hinweis': {
      en: 'This decides when a green tick appears: how exactly the note must be '
        + 'hit, how steadily it has to stand, and how far off the beat it may be. '
        + '<em>Very easy</em> is the default — at the start what counts is that '
        + 'something succeeds at all. If the ticks come too easily, move up one '
        + 'step. <em>Medium</em> matches what a practised child hits.',
      es: 'Esto decide cuándo aparece una marca verde: con qué exactitud hay que '
        + 'dar la nota, con qué firmeza debe sostenerse y cuánto puede alejarse '
        + 'del pulso. <em>Muy fácil</em> es lo predeterminado: al principio lo que '
        + 'cuenta es que algo salga bien. Si las marcas llegan con demasiada '
        + 'facilidad, suba un escalón. <em>Medio</em> corresponde a lo que acierta '
        + 'un niño con práctica.' },

    'eltern.notenbild':        { en: 'Notation',           es: 'Partitura' },
    'eltern.notenbild.bunt':   { en: 'Colour notes',       es: 'Notas en color' },
    'eltern.notenbild.schwarz': { en: 'Black notes',       es: 'Notas en negro' },
    'eltern.notenbild.buch':   { en: 'In the book',        es: 'En el libro' },
    'eltern.notenbild.buch.hinweis': {
      en: 'In the songs from the book the notes are black by default — just as they are '
        + 'printed on the page lying next to the iPad.',
      es: 'En las canciones del libro las notas son negras de forma predeterminada, tal como '
        + 'aparecen impresas en la página que está junto al iPad.' },
    'eltern.notenbild.hinweis': {
      en: 'Colour helps at the start: note head, valves and animal share one '
        + 'colour. Black shows notes and fingerings the way every other music '
        + 'book prints them — for the step across to ordinary note reading.',
      es: 'El color ayuda al principio: la cabeza de la nota, la digitación y el '
        + 'animal comparten un mismo color. El negro muestra las notas y las '
        + 'digitaciones como las imprime cualquier otro cuaderno de música: es el '
        + 'paso hacia la lectura normal.' },

    'eltern.mikrofon':         { en: 'Microphone',         es: 'Micrófono' },
    'mikro.ton':               { en: 'Detected note',      es: 'Nota detectada' },
    'mikro.hz':                { en: 'Frequency',          es: 'Frecuencia' },
    'mikro.cent':              { en: 'Deviation',          es: 'Desviación' },
    'mikro.db':                { en: 'Level',              es: 'Nivel' },
    'mikro.gate':              { en: 'Noise gate',         es: 'Umbral de ruido' },
    'mikro.weg':               { en: 'Analysis path',      es: 'Ruta de análisis' },

    'eltern.fortschritt':      { en: 'Progress',           es: 'Progreso' },
    'eltern.reset':            { en: 'Reset progress',     es: 'Restablecer el progreso' },

    'eltern.herkunft':         { en: 'Where the recordings come from',
                                 es: 'Origen de las grabaciones' },
    'eltern.herkunft.hinweis': {
      en: 'The notes the app plays are real recordings of a Yamaha Périnet '
        + 'trumpet, played by Mario Schulter. Out of seven takes per note the '
        + 'cleanest was chosen and all of them were matched in loudness. For horn '
        + 'and tenor horn the same recordings are moved down to the lower range and '
        + 'softened — a horn has fewer overtones than a trumpet.',
      es: 'Las notas que reproduce la aplicación son grabaciones reales de una '
        + 'trompeta Yamaha Périnet, interpretadas por Mario Schulter. De siete '
        + 'tomas por nota se eligió la más limpia y todas se igualaron en volumen. '
        + 'Para la trompa y el bombardino se llevan las mismas grabaciones al '
        + 'registro grave y se suavizan: una trompa tiene menos armónicos que una '
        + 'trompeta.' },

    'eltern.stimmung':         { en: 'Why does it sound lower than it is written?',
                                 es: '¿Por qué suena más grave de lo que está escrito?' },
    'eltern.stimmung.hinweis': {
      en: 'All four instruments are <em>transposing</em>: what is written as C sounds '
        + 'lower — a whole step on the B flat trumpet, a fifth on the horn in F, a '
        + 'sixth on the horn in E flat, a whole step plus an octave on the tenor '
        + 'horn. The app plays at that sounding pitch and listens at it too, so your '
        + 'child can play along without anything being transposed. Next to a piano it '
        + 'will sound lower than the same note there — that is correct.',
      es: 'Los cuatro instrumentos son <em>transpositores</em>: lo que está escrito '
        + 'como do suena más grave: un tono en la trompeta en si bemol, una quinta en '
        + 'la trompa en fa, una sexta en la trompa en mi bemol, un tono más una '
        + 'octava en el bombardino. La aplicación reproduce en esa altura real y '
        + 'también escucha en ella, de modo que su hijo puede tocar a la vez sin '
        + 'transponer nada. Junto a un piano sonará más grave que la misma nota '
        + 'allí: es correcto.' },

    'eltern.instrument':       { en: 'Instrument',          es: 'Instrumento' },
    'eltern.instrument.trompete': { en: 'Trumpet in B flat', es: 'Trompeta en si bemol' },
    'eltern.instrument.hornF':    { en: 'Horn in F',         es: 'Trompa en fa' },
    'eltern.instrument.hornEs':   { en: 'Horn in E flat',    es: 'Trompa en mi bemol' },
    'eltern.instrument.tenorhorn': { en: 'Tenor horn',       es: 'Bombardino' },
    'eltern.instrument.hinweis': {
      en: 'The notes stay the same on all four, and so do the fingerings: written D '
        + 'is 1 + 3 everywhere. The only difference is how low it sounds — that sets '
        + 'what the app plays and what it expects through the microphone. The '
        + 'fingering picture shows rotary valves on the horn and piston valves on '
        + 'trumpet and tenor horn. The <em>tenor horn</em> is written and fingered '
        + 'like a trumpet in B flat but sounds an octave lower. After switching, the '
        + 'app restarts; the progress is kept.',
      es: 'Las notas son las mismas en los cuatro, y también las digitaciones: re '
        + 'escrito es 1 + 3 en todos. Lo único distinto es cuánto más grave suena, y '
        + 'de eso dependen lo que reproduce la aplicación y lo que espera por el '
        + 'micrófono. La imagen de digitación muestra válvulas rotativas en la trompa '
        + 'y de pistón en trompeta y bombardino. El <em>bombardino</em> se escribe y '
        + 'se digita como una trompeta en si bemol, pero suena una octava más grave. '
        + 'Al cambiar, la aplicación se reinicia; el progreso se conserva.' },

    'eltern.zu':               { en: 'Back to the app',    es: 'Volver a la aplicación' },

    'eltern.knopf.aria':       { en: 'Settings for parents', es: 'Ajustes para padres' },

    /* Das Buch. Zu sehen ist davon nichts — die Karte zeigt den
     * Umschlag, die Reiter zeigen Farben. Die Marken stehen fuer den
     * Vorleser, der einem Kind vorliest, was sein Finger beruehrt. */
    'buch.karte.aria':         { en: 'The songs from the book',
                                 es: 'Las canciones del libro' },
    'buch.welten.aria':        { en: 'Worlds',             es: 'Mundos' },
    'buch.zurueck.aria':       { en: 'Back',               es: 'Atrás' },
    'buch.stimme1.aria':       { en: 'First part',         es: 'Primera voz' },
    'buch.stimme2.aria':       { en: 'Second part',        es: 'Segunda voz' },
    'buch.band.aria':          { en: 'Sections',           es: 'Fragmentos' },
    'buch.band.zeile':         { en: 'Line {n}',           es: 'Línea {n}' },
    'buch.band.ganz':          { en: 'The whole song',     es: 'La canción entera' },
    'haus.aria':               { en: 'Back',               es: 'Atrás' },
    'blaettern.vor.aria':      { en: 'Next page',          es: 'Página siguiente' },
    'blaettern.zurueck.aria':  { en: 'Previous page',      es: 'Página anterior' },
    'sprachwahl.aria':         { en: 'Language',           es: 'Idioma' },
    'sprache.de':              { en: 'German',             es: 'Alemán' },
    'sprache.en':              { en: 'English',            es: 'Inglés' },
    'sprache.es':              { en: 'Spanish',            es: 'Español' },

    /* Zeilen, die erst beim Fuellen entstehen. */
    'tab.nichtDabei':          { en: '(not yet included)', es: '(todavía no incluida)' },
    'tab.sitzt':               { en: 'solid',              es: 'dominada' },
    'ton.dabei':               { en: 'on',                 es: 'sí' },
    'ton.aus':                 { en: 'off',                es: 'no' },
    'vorrat.hand': {
      en: 'Chosen by hand: {liste}. The app is not adding notes of its own at the moment.',
      es: 'Elegidas a mano: {liste}. Por ahora la aplicación no añade notas por su cuenta.' },
    'vorrat.auto': {
      en: 'Automatic: the app adds a new note as soon as the last one is solid. '
        + 'At present {liste}.',
      es: 'Automático: la aplicación añade una nota nueva en cuanto la anterior está '
        + 'dominada. Por ahora {liste}.' },
    'mikro.naturton':          { en: '(next harmonic)',   es: '(armónico vecino)' },
    'einheit.cent':            { en: 'cents',              es: 'cents' }
  };

  var jetzt = 'de';

  function gueltig(code) { return SPRACHEN.indexOf(code) >= 0 ? code : 'de'; }

  /** Uebersetzung zu einem Schluessel; ohne Eintrag der deutsche Urtext. */
  function t(schluessel, urtext) {
    if (jetzt === 'de') { return urtext; }
    var e = TEXTE[schluessel];
    return (e && e[jetzt]) ? e[jetzt] : urtext;
  }

  /** Tonname in der eingestellten Sprache: h wird ausserhalb des
   *  Deutschen zu B, und die Buchstaben werden gross geschrieben —
   *  klein sind sie nur im deutschen Sprachraum ueblich. Genau so
   *  steht es auch in der englischen Buchausgabe. Die Oktavziffer
   *  bleibt, sie ist international. */
  function ton(id) {
    var tab = TON[jetzt];
    if (!tab) { return id; }
    var buchstabe = id.slice(0, id.length - 1), ziffer = id.slice(-1);
    return (tab[buchstabe] || buchstabe).toUpperCase() + ziffer;
  }

  /** Setzt die Sprache und schreibt allen Text im Dokument neu.
   *  Ohne Dokument — im Testlauf unter node — bleibt es beim Woerterbuch. */
  function setzen(code) {
    jetzt = gueltig(code);
    if (typeof document === 'undefined') { return; }
    document.documentElement.setAttribute('lang', jetzt);
    anwenden();
  }

  /* Beim ersten Durchgang wird der deutsche Urtext aus dem HTML
   * gesichert. Ohne das waere ein Wechsel en -> de eine Einbahnstrasse:
   * das deutsche Original stuende nirgends mehr. */
  function anwenden() {
    if (typeof document === 'undefined') { return; }
    ['data-t', 'data-t-html', 'data-t-aria'].forEach(function (merkmal) {
      var felder = document.querySelectorAll('[' + merkmal + ']');
      [].slice.call(felder).forEach(function (el) {
        if (!el.urtext) { el.urtext = {}; }
        if (el.urtext[merkmal] === undefined) {
          el.urtext[merkmal] = (merkmal === 'data-t-aria')
            ? (el.getAttribute('aria-label') || '')
            : (merkmal === 'data-t-html' ? el.innerHTML : el.textContent);
        }
        var wert = t(el.getAttribute(merkmal), el.urtext[merkmal]);
        if (merkmal === 'data-t-aria') { el.setAttribute('aria-label', wert); }
        else if (merkmal === 'data-t-html') { el.innerHTML = wert; }
        else { el.textContent = wert; }
      });
    });
  }

  root.Sprachen = {
    liste: SPRACHEN,
    jetzt: function () { return jetzt; },
    setzen: setzen,
    anwenden: anwenden,
    t: t,
    ton: ton,
    texte: TEXTE
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
