/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/sprachen.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* sprachen.js — die Oberflaeche in drei Sprachen, und die Tonnamen.
 *
 * Der deutsche Text steht NICHT hier, sondern dort, wo er gebraucht
 * wird: fest Stehendes in index.html (data-t), Bewegliches als Urtext
 * im Aufruf Sprachen.t('schluessel', 'deutscher Urtext'). So bleibt er
 * im Zusammenhang lesbar. Diese Datei traegt nur die Uebersetzungen.
 * Ein Schluessel ohne Eintrag faellt damit auf den deutschen Urtext
 * zurueck — nie auf eine leere Zeile.
 *
 * Wer Text ergaenzt: data-t im HTML setzen oder Sprachen.t() aufrufen,
 * hier zwei Zeilen dazu. test/test-sprachen-app.js meldet, was
 * vergessen wurde.
 */
(function (root) {
  'use strict';

  var SPRACHEN = ['de', 'en', 'es'];

  /* Tonnamen.
   *
   * Die IDs aus toene.json SIND die deutschen Namen: fis, c1, as2. Die
   * kleine Oktave traegt keine Ziffer, die eingestrichene eine 1, die
   * zweigestrichene eine 2 — angezeigt als hochgestellte Ziffer, wie
   * man es schreibt: c¹, as².
   *
   * Ausserhalb des Deutschen heisst h »B« und b »B♭«, und die Oktave
   * wird international gezaehlt: das eingestrichene c ist C4. »h1«
   * liest ein englischsprachiger Trompeter sonst als Tippfehler.
   *
   * Gemeint sind immer die NOTIERTEN Namen. Was die Trompete dazu
   * klingen laesst, liegt einen Ganzton tiefer — siehe hoehe(). */
  var HOCH = ['', '¹', '²', '³'];
  var INTERNATIONAL = {
    c: 'C', cis: 'C♯', des: 'D♭', d: 'D', dis: 'D♯', es: 'E♭', e: 'E', f: 'F',
    fis: 'F♯', ges: 'G♭', g: 'G', gis: 'G♯', as: 'A♭', a: 'A', ais: 'A♯', b: 'B♭', h: 'B'
  };
  /* Zwoelf Halbtoene in der gebraeuchlichsten Schreibweise — fuer die
   * klingende Hoehe, die nirgends notiert steht und deshalb keine
   * eigene Schreibweise mitbringt. */
  var HALBTOENE = ['c', 'des', 'd', 'es', 'e', 'f', 'fis', 'g', 'as', 'a', 'b', 'h'];

  var TEXTE = {
    /* ---------------- nur im Lovable-Export ---------------- */
    "lov.startet": {"en":"One moment – switching on sound and microphone …","es":"Un momento: activando el sonido y el micrófono…"},
    "lov.ohneMikro": {"en":"No access to the microphone. The exercise plays for you but cannot hear you – please allow the microphone in the browser.","es":"Sin acceso al micrófono. El ejercicio toca para ti, pero no te puede oír: permite el micrófono en el navegador."},
    "lov.ohneTon": {"en":"This browser cannot produce sound.","es":"Este navegador no puede producir sonido."},

    /* ---------------- Start ---------------- */
    'tor.titel':  { en: 'Learn the trumpet', es: 'Aprender trompeta' },
    'tor.text': {
      en: 'Notes, rhythm, melodies, songs and videos for adults. The app plays first, listens '
        + 'through the microphone and tells you exactly what it heard.',
      es: 'Notas, ritmo, melodías, canciones y vídeos para adultos. La aplicación toca primero, '
        + 'escucha por el micrófono y te dice exactamente lo que ha oído.' },
    'tor.punkt1': { en: 'Allow the microphone when the browser asks.',
                    es: 'Permite el micrófono cuando el navegador lo pida.' },
    'tor.punkt2': { en: 'Put the device in landscape, about an arm’s length away.',
                    es: 'Coloca el dispositivo en horizontal, a un brazo de distancia.' },
    'tor.punkt3': { en: 'The microphone is analysed on the device only – nothing is recorded or sent anywhere.',
                    es: 'El micrófono se analiza solo en el dispositivo: nada se graba ni se envía.' },
    'tor.knopf':  { en: 'Let’s go', es: 'Empezar' },
    'safari.text': {
      en: 'On this device the microphone only works in the browser. Please open the app in Safari.',
      es: 'En este dispositivo el micrófono solo funciona en el navegador. Abre la aplicación en Safari.' },
    'dreh.text':  { en: 'Please hold the device in landscape.', es: 'Gira el dispositivo a horizontal.' },

    /* ---------------- Uebersicht ---------------- */
    'app.titel':            { en: 'Trumpet', es: 'Trompeta' },
    'auswahl.material':     { en: 'Notes in use', es: 'Notas en uso' },
    'einstellungen.titel':  { en: 'Settings', es: 'Ajustes' },
    'karte.toene':          { en: 'Notes', es: 'Notas' },
    'karte.toene.text': {
      en: 'Hit single notes and hold them – with note name, fingering and tuner.',
      es: 'Acertar notas sueltas y sostenerlas, con nombre, digitación y afinador.' },
    'karte.rhythmus':       { en: 'Rhythm', es: 'Ritmo' },
    'karte.rhythmus.text': {
      en: 'Put rhythms together yourself and play or tap them in time.',
      es: 'Combina los ritmos tú mismo y tócalos o márcalos a tempo.' },
    'karte.melodie2':       { en: 'Melody · 2 bars', es: 'Melodía · 2 compases' },
    'karte.melodie2.text': {
      en: 'Short melodies at sight: play along first, then solo.',
      es: 'Melodías cortas a primera vista: primero acompañado, luego solo.' },
    'karte.melodie4':       { en: 'Melody · 4 bars', es: 'Melodía · 4 compases' },
    'karte.melodie4.text': {
      en: 'Longer melodies and well-known tunes over four bars.',
      es: 'Melodías más largas y piezas conocidas en cuatro compases.' },
    'karte.fuss.toene':     { en: '{von}–{bis} · {n} notes', es: '{von}–{bis} · {n} notas' },
    'karte.fuss.einton':    { en: 'Note {von}', es: 'Nota {von}' },
    'rhythmus.fuss':        { en: '{takt} · {n} rhythms', es: '{takt} · {n} ritmos' },
    'rhythmus.fuss.tippen': { en: 'tapping', es: 'marcando' },
    'material.kurz':        { en: '{von}–{bis} ({n})', es: '{von}–{bis} ({n})' },

    'karte.lieder':         { en: 'Songs', es: 'Canciones' },
    'karte.lieder.text': {
      en: 'Well-known songs with accompaniment – with or without trumpet, at your own tempo.',
      es: 'Canciones conocidas con acompañamiento: con o sin trompeta, a tu propio tempo.' },
    'lied.fuss':            { en: '{n} songs in 2 levels', es: '{n} canciones en 2 niveles' },

    'karte.videos':         { en: 'Videos', es: 'Vídeos' },
    'karte.videos.text': {
      en: 'Tutorial videos in levels – to watch and play along, at your own tempo.',
      es: 'Vídeos didácticos por niveles: para ver y tocar a la vez, a tu propio tempo.' },
    'video.fuss':           { en: '{n} videos in {l} levels', es: '{n} vídeos en {l} niveles' },

    /* ---------------- Videos ---------------- */
    'video.einleitung': {
      en: 'Tutorial videos, level by level. The tempo of every video can be set from 40 to 120 %; '
        + 'the pitch stays the same. The videos are loaded from Vimeo and need an internet connection.',
      es: 'Vídeos didácticos, nivel a nivel. El tempo de cada vídeo se ajusta del 40 al 120 %; la '
        + 'altura no cambia. Los vídeos se cargan desde Vimeo y necesitan conexión a internet.' },
    'video.anzahl':         { en: '{n} videos', es: '{n} vídeos' },
    'video.offline': {
      en: 'No connection. The videos are loaded from Vimeo and need the internet.',
      es: 'Sin conexión. Los vídeos se cargan desde Vimeo y necesitan internet.' },
    'video.fehler': {
      en: 'The video cannot be loaded. Is there an internet connection?',
      es: 'No se puede cargar el vídeo. ¿Hay conexión a internet?' },

    /* ---------------- Lieder ---------------- */
    'lied.einleitung': {
      en: 'Every song comes in two recordings: with trumpet, to listen and play along, and with '
        + 'the accompaniment only – then the melody is yours. The tempo can be set from 40 to '
        + '120 %; the pitch stays the same.',
      es: 'Cada canción tiene dos grabaciones: con trompeta, para escuchar y tocar a la vez, y solo '
        + 'con el acompañamiento; entonces la melodía es tuya. El tempo se ajusta del 40 al 120 %; '
        + 'la altura no cambia.' },
    'lied.hinweis': {
      en: 'A good way through a song: first listen with trumpet and read along, then play along '
        + 'slowly, then without trumpet – and only raise the tempo once it is secure slowly.',
      es: 'Un buen camino para cada canción: primero escuchar con trompeta y seguir la partitura, '
        + 'luego tocar despacio a la vez, después sin trompeta; y subir el tempo solo cuando salga '
        + 'seguro despacio.' },
    'lied.level':           { en: 'Level {n}', es: 'Nivel {n}' },
    'lied.level.text': {
      en: '{n} songs in order of difficulty · range {von} to {bis}',
      es: '{n} canciones en orden de dificultad · registro de {von} a {bis}' },
    'lied.mal':             { en: 'played {n}×', es: 'tocada {n}×' },
    'lied.tonart.C':        { en: 'C major', es: 'Do mayor' },
    'lied.tonart.G':        { en: 'G major', es: 'Sol mayor' },
    'lied.tonart.D':        { en: 'D major', es: 'Re mayor' },
    'lied.tonart.F':        { en: 'F major', es: 'Fa mayor' },
    'lied.tonart.B':        { en: 'B♭ major', es: 'Si♭ mayor' },
    'fassung.aria':         { en: 'Recording', es: 'Grabación' },
    'fassung.voll':         { en: 'With trumpet', es: 'Con trompeta' },
    'fassung.pb':           { en: 'Accompaniment only', es: 'Solo acompañamiento' },
    'lied.vonvorn':         { en: 'From the top', es: 'Desde el principio' },
    'lied.pause':           { en: 'Pause', es: 'Pausa' },
    'lied.laedt':           { en: 'Loading the recording …', es: 'Cargando la grabación…' },
    'lied.fehler': {
      en: 'The recording cannot be loaded. The first time, every song needs a connection.',
      es: 'No se puede cargar la grabación. La primera vez, cada canción necesita conexión.' },
    'lied.stumm': {
      en: 'The browser did not allow playback. Please tap Start once more.',
      es: 'El navegador no ha permitido la reproducción. Toca Empezar otra vez.' },
    'lied.bereit': {
      en: 'Start plays with a count-in. Tap a bar to begin there. {tempo}',
      es: 'Empezar toca con compases de entrada. Toca un compás para empezar ahí. {tempo}' },
    'lied.einzaehler':      { en: 'Count-in … {tempo}', es: 'Entrada… {tempo}' },
    'lied.auftakt':         { en: 'Pickup', es: 'Anacrusa' },
    'lied.takt':            { en: 'Bar {n} of {gesamt}', es: 'Compás {n} de {gesamt}' },
    'lied.fertig': {
      en: 'Played to the end – {n}× in total.', es: 'Tocada hasta el final: {n}× en total.' },

    /* ---------------- Rhythmus zusammenstellen ---------------- */
    'rhythmus.titel':       { en: 'Rhythm training', es: 'Entrenamiento de ritmo' },
    'allg.zurueck':         { en: 'Back', es: 'Volver' },
    'allg.fertig':          { en: 'Done', es: 'Listo' },
    'rhythmus.einleitung': {
      en: 'Put your exercise together. Each exercise is drawn afresh from the rhythms you '
        + 'choose – “Next exercise” brings another one.',
      es: 'Arma tu ejercicio. Cada ejercicio se sortea de nuevo con los ritmos elegidos; '
        + '«Siguiente ejercicio» trae otro.' },
    'rhythmus.taktart':     { en: 'Time signature', es: 'Compás' },
    'rhythmus.laenge':      { en: 'Length', es: 'Duración' },
    'rhythmus.takte2':      { en: '2 bars', es: '2 compases' },
    'rhythmus.takte4':      { en: '4 bars', es: '4 compases' },
    'rhythmus.bausteine':   { en: 'Rhythms', es: 'Ritmos' },
    'rhythmus.bausteine.hinweis': {
      en: 'Choose as many as you like. Two are enough to begin with; add new rhythms one at a time.',
      es: 'Elige los que quieras. Para empezar bastan dos; añade los ritmos nuevos de uno en uno.' },
    'rhythmus.material':    { en: 'Notes', es: 'Notas' },
    'rhythmus.einton':      { en: 'On one note', es: 'En una sola nota' },
    'rhythmus.vorrat':      { en: 'With my notes in use', es: 'Con mis notas en uso' },
    'rhythmus.ton':         { en: 'Note', es: 'Nota' },
    'rhythmus.eingabe':     { en: 'Input', es: 'Entrada' },
    'rhythmus.trompete':    { en: 'Trumpet (microphone)', es: 'Trompeta (micrófono)' },
    'rhythmus.tippen':      { en: 'Tapping (no instrument)', es: 'Marcar (sin instrumento)' },
    'rhythmus.eingabe.hinweis': {
      en: 'Tapping means knocking the rhythm on the tap pad or with the space bar. That way a new '
        + 'pattern can be understood first, before the trumpet joins in.',
      es: 'Marcar significa golpear el ritmo en el campo táctil o con la barra espaciadora. Así '
        + 'se entiende primero un patrón nuevo, antes de añadir la trompeta.' },
    'rhythmus.start':       { en: 'Start exercise', es: 'Empezar ejercicio' },
    'rhythmus.hinweis.einton': {
      en: 'Every note on {ton} – all attention stays on the rhythm.',
      es: 'Todas las notas en {ton}: toda la atención se queda en el ritmo.' },
    'rhythmus.hinweis.vorrat': {
      en: 'The pitch changes within your notes in use ({liste}).',
      es: 'La altura cambia dentro de tus notas en uso ({liste}).' },
    'baustein.ganze':        { en: 'Whole note', es: 'Redonda' },
    'baustein.halbe':        { en: 'Half notes', es: 'Blancas' },
    'baustein.viertel':      { en: 'Quarter notes', es: 'Negras' },
    'baustein.achtel':       { en: 'Eighth notes', es: 'Corcheas' },
    'baustein.punkthalbe':   { en: 'Dotted half', es: 'Blanca con puntillo' },
    'baustein.punktviertel': { en: 'Dotted quarter + eighth', es: 'Negra con puntillo + corchea' },
    'baustein.synkope':      { en: 'Syncopation', es: 'Síncopa' },
    'baustein.viertelpause': { en: 'Quarter rest', es: 'Silencio de negra' },
    'baustein.halbepause':   { en: 'Half rest', es: 'Silencio de blanca' },
    'baustein.achtelpause':  { en: 'Eighth rest + eighth', es: 'Silencio de corchea + corchea' },

    /* ---------------- Uebung ---------------- */
    'leiste.uebersicht':    { en: 'Overview', es: 'Inicio' },
    'leiste.start':         { en: 'Start', es: 'Empezar' },
    'leiste.stopp':         { en: 'Stop', es: 'Parar' },
    'leiste.rhythmen':      { en: 'Rhythms', es: 'Ritmos' },
    'leiste.naechste':      { en: 'Next exercise', es: 'Siguiente ejercicio' },
    'modus.aria':           { en: 'Who plays', es: 'Quién toca' },
    'modus.mit':            { en: 'Play along', es: 'Acompañado' },
    'modus.solo':           { en: 'Solo', es: 'Solo' },
    'stimm.tief':           { en: 'flat', es: 'bajo' },
    'stimm.hoch':           { en: 'sharp', es: 'alto' },
    'tipp.feld':            { en: 'Tap here', es: 'Marca aquí' },
    'tempo.titel':          { en: 'Tempo', es: 'Tempo' },
    'tempo.langsamer':      { en: 'Slower', es: 'Más lento' },
    'tempo.schneller':      { en: 'Faster', es: 'Más rápido' },
    'hilfen.aria':          { en: 'Reading aids', es: 'Ayudas de lectura' },
    'hilfen.namen.kurz':    { en: 'Note names', es: 'Nombres' },
    'hilfen.zaehlen.kurz':  { en: 'Counting', es: 'Conteo' },

    'titel.toene':          { en: 'Notes', es: 'Notas' },
    'titel.rhythmus':       { en: 'Rhythm · {takt}', es: 'Ritmo · {takt}' },
    'titel.melodie':        { en: 'Melody', es: 'Melodía' },

    'griff.wort':           { en: 'Fingering {g}', es: 'Digitación {g}' },
    'griff.offen':          { en: '0 (open)', es: '0 (al aire)' },
    'klingt.wort':          { en: 'sounds {ton}', es: 'suena {ton}' },

    'l1.bereit': {
      en: 'Press Start: the app plays the note, then it is your turn.',
      es: 'Pulsa Empezar: la aplicación toca la nota y luego te toca a ti.' },
    'l1.vorspielen':        { en: 'Listen …', es: 'Escucha…' },
    'l1.hoeren': {
      en: 'Your turn: tongue {ton} and hold it steady.',
      es: 'Tu turno: ataca {ton} y sostenla sin moverla.' },
    'l1.treffer':           { en: 'Got it – {ton}, {cent}.', es: 'Acertado: {ton}, {cent}.' },
    'cent.genau':           { en: 'well in tune', es: 'bien afinada' },
    'cent.tief':            { en: '{n} cents flat', es: '{n} cents baja' },
    'cent.hoch':            { en: '{n} cents sharp', es: '{n} cents alta' },
    'l1.ueberblasen': {
      en: 'Overblown: the fingering is right, but it came out as {gehoert}. Relax the lips and '
        + 'blow more gently.',
      es: 'Sobresoplado: la digitación es correcta, pero sonó {gehoert}. Relaja los labios y '
        + 'sopla con más calma.' },
    'l1.ungenau': {
      en: 'That was {ton}, but {cent} – too far off for the chosen strictness.',
      es: 'Eso fue {ton}, pero {cent}: demasiado lejos para el rigor elegido.' },
    'l1.anderer': {
      en: 'That was {gehoert} – the note wanted is {ton}, fingering {griff}.',
      es: 'Eso fue {gehoert}; la nota buscada es {ton}, digitación {griff}.' },
    'l1.stille': {
      en: 'Nothing heard. Here is the note again – closer to the microphone?',
      es: 'No se oyó nada. Ahí va la nota otra vez. ¿Más cerca del micrófono?' },

    'l2.bereit.mit': {
      en: 'Play along: the app plays the exercise with you. To get to know it – not scored.',
      es: 'Acompañado: la aplicación toca el ejercicio contigo. Para conocerlo, sin puntuar.' },
    'l2.bereit.solo': {
      en: 'Solo: only the metronome runs. Now it counts.',
      es: 'Solo: únicamente suena el metrónomo. Ahora sí cuenta.' },
    'l2.bereit.tippen': {
      en: 'Solo: tap the rhythm on the tap pad or with the space bar.',
      es: 'Solo: marca el ritmo en el campo táctil o con la barra espaciadora.' },
    'l2.vorzaehler':        { en: 'Count-in …', es: 'Cuenta previa…' },
    'l2.laeuft.mit':        { en: 'Playing along …', es: 'Acompañado…' },
    'l2.laeuft.solo':       { en: 'Solo …', es: 'Solo…' },
    'l2.nachMit': {
      en: 'Now solo: press Start when you are ready.',
      es: 'Ahora solo: pulsa Empezar cuando quieras.' },
    'l2.sauber':            { en: 'All {n} notes hit.', es: 'Las {n} notas acertadas.' },
    'l2.teils':             { en: '{g} of {n} notes hit.', es: '{g} de {n} notas acertadas.' },
    'l2.nichts': {
      en: 'No note detected. Move closer to the microphone – or play along first.',
      es: 'No se detectó ninguna nota. Acércate al micrófono o toca primero acompañado.' },
    'l2.nichts.tippen':     { en: 'No tap detected.', es: 'No se detectó ningún golpe.' },
    'zeit.genau':           { en: 'Timing spot on.', es: 'Ritmo exacto.' },
    'zeit.frueh':           { en: 'On average {ms} ms early.', es: 'De media, {ms} ms antes.' },
    'zeit.spaet':           { en: 'On average {ms} ms late.', es: 'De media, {ms} ms después.' },
    'l2.tempoTipp': {
      en: 'Three clean runs – time for a faster tempo?',
      es: 'Tres veces limpio: ¿hora de subir el tempo?' },
    'l2.weiter': {
      en: 'Once more, or “Next exercise”.',
      es: 'Otra vez, o «Siguiente ejercicio».' },
    'l2.lied':              { en: 'A tune you may know: {name}', es: 'Una pieza conocida: {name}' },

    /* ---------------- Einstellungen ---------------- */
    'sprachwahl.aria':      { en: 'Language', es: 'Idioma' },
    'sprache.de':           { en: 'German', es: 'Alemán' },
    'sprache.en':           { en: 'English', es: 'Inglés' },
    'sprache.es':           { en: 'Spanish', es: 'Español' },

    'material.titel':       { en: 'Notes in use', es: 'Notas en uso' },
    'material.hinweis': {
      en: 'Which notes appear in the exercises. The range runs from low F♯3 to A5. All names '
        + 'are written pitch – as they stand in trumpet music.',
      es: 'Qué notas aparecen en los ejercicios. El ámbito va de F♯3 a A5. Todos los nombres '
        + 'son los escritos, tal como figuran en las partituras de trompeta.' },
    'material.tonart':      { en: 'Key', es: 'Tonalidad' },
    'material.von':         { en: 'from', es: 'de' },
    'material.bis':         { en: 'to', es: 'a' },
    'material.setzen':      { en: 'Apply', es: 'Aplicar' },
    'material.einzeln': {
      en: 'Or one by one: every note can be switched on and off. Sharp and flat spelling of '
        + 'the same pitch stand side by side.',
      es: 'O de una en una: cada nota se puede activar y desactivar. La escritura con sostenido '
        + 'y con bemol de una misma altura están juntas.' },
    'material.automatik':   { en: 'Extend automatically again', es: 'Volver a ampliar automáticamente' },
    'material.auto': {
      en: 'Automatic: a new note is added as soon as the ones so far are solid. At present {liste}.',
      es: 'Automático: se añade una nota nueva en cuanto las anteriores están dominadas. Por ahora {liste}.' },
    'material.hand':        { en: 'Chosen by hand: {liste}.', es: 'Elegidas a mano: {liste}.' },
    'oktave.0':             { en: 'Low register (below C4)', es: 'Registro grave (bajo C4)' },
    'oktave.1':             { en: 'Middle register (C4–B4)', es: 'Registro medio (C4–B4)' },
    'oktave.2':             { en: 'High register (C5–A5)', es: 'Registro agudo (C5–A5)' },
    'tonart.C':             { en: 'C major / A minor', es: 'Do mayor / La menor' },
    'tonart.G':             { en: 'G major / E minor', es: 'Sol mayor / Mi menor' },
    'tonart.D':             { en: 'D major / B minor', es: 'Re mayor / Si menor' },
    'tonart.A':             { en: 'A major / F♯ minor', es: 'La mayor / Fa♯ menor' },
    'tonart.F':             { en: 'F major / D minor', es: 'Fa mayor / Re menor' },
    'tonart.B':             { en: 'B♭ major / G minor', es: 'Si♭ mayor / Sol menor' },
    'tonart.Es':            { en: 'E♭ major / C minor', es: 'Mi♭ mayor / Do menor' },
    'tonart.As':            { en: 'A♭ major / F minor', es: 'La♭ mayor / Fa menor' },
    'tonart.kreuz':         { en: 'Chromatic (sharps)', es: 'Cromática (sostenidos)' },
    'tonart.be':            { en: 'Chromatic (flats)', es: 'Cromática (bemoles)' },

    'notenbild.titel':      { en: 'Notation', es: 'Partitura' },
    'notenbild.schwarz':    { en: 'Black notes', es: 'Notas en negro' },
    'notenbild.bunt':       { en: 'Coloured notes', es: 'Notas en color' },
    'notenbild.hinweis': {
      en: 'Black is notation as it is printed everywhere. Coloured gives each natural note its '
        + 'own colour – a reading aid for the first steps.',
      es: 'El negro es la partitura tal como se imprime en todas partes. El color da a cada nota '
        + 'natural un color propio: una ayuda de lectura para empezar.' },
    'hilfen.namen':         { en: 'Note names under the notes', es: 'Nombres bajo las notas' },
    'hilfen.zaehlen':       { en: 'Counting under the notes', es: 'Conteo bajo las notas' },
    'hilfen.hinweis': {
      en: 'Both are training wheels. They can be switched off and on again with one tap while '
        + 'practising – you learn most by regularly trying without them.',
      es: 'Ambas son ruedines. Se pueden quitar y volver a poner con un toque mientras '
        + 'practicas; se aprende más intentándolo sin ellas con regularidad.' },

    'strenge.titel':        { en: 'How strictly should it listen?', es: '¿Con qué rigor debe escuchar?' },
    'strenge.superleicht':  { en: 'Very lenient', es: 'Muy indulgente' },
    'strenge.leicht':       { en: 'Lenient', es: 'Indulgente' },
    'strenge.mittel':       { en: 'Precise', es: 'Preciso' },
    'strenge.schwer':       { en: 'Strict', es: 'Estricto' },
    'strenge.hinweis': {
      en: 'This decides when a note counts as hit: how exact the pitch must be, how steadily it '
        + 'has to stand and how far off the beat it may be. <em>Very lenient</em> is the default '
        + '– at the start what counts is that something works at all, and a cold trumpet is flat '
        + 'anyway. Once the notes come reliably, move up: <em>Precise</em> allows 50 cents, '
        + '<em>Strict</em> only 30.',
      es: 'Esto decide cuándo una nota cuenta como acertada: con qué exactitud debe estar la '
        + 'altura, con qué firmeza debe sostenerse y cuánto puede alejarse del pulso. <em>Muy '
        + 'indulgente</em> es lo predeterminado: al principio lo que cuenta es que algo salga, y '
        + 'una trompeta fría suena baja de todos modos. Cuando las notas salgan con seguridad, '
        + 'sube un escalón: <em>Preciso</em> admite 50 cents, <em>Estricto</em> solo 30.' },

    'stimm.titel':          { en: 'Tuner and microphone', es: 'Afinador y micrófono' },
    'mikro.ton':            { en: 'Detected note (written)', es: 'Nota detectada (escrita)' },
    'mikro.cent':           { en: 'Deviation', es: 'Desviación' },
    'mikro.hz':             { en: 'Frequency (sounding)', es: 'Frecuencia (real)' },
    'mikro.db':             { en: 'Level', es: 'Nivel' },
    'mikro.gate':           { en: 'Noise gate', es: 'Umbral de ruido' },
    'mikro.weg':            { en: 'Analysis path', es: 'Ruta de análisis' },
    'mikro.latenz':         { en: 'Delay speaker → microphone', es: 'Retardo altavoz → micrófono' },
    'mikro.latenz.leer':    { en: 'not measured yet', es: 'aún sin medir' },
    'stimm.hinweis': {
      en: 'Play a note and hold it: this shows what the app hears. The place to look when a note '
        + 'is not detected – and a tuner for tuning up. The app measures the delay itself during '
        + 'the count-in; with headphones it stays empty.',
      es: 'Toca una nota y sostenla: aquí se ve lo que oye la aplicación. El sitio donde mirar '
        + 'cuando una nota no se detecta, y un afinador para afinar. El retardo lo mide la '
        + 'aplicación durante la cuenta previa; con auriculares queda vacío.' },
    'einheit.cent':         { en: 'cents', es: 'cents' },

    'statistik.titel':      { en: 'Success rates', es: 'Aciertos' },
    'statistik.leer':       { en: 'No attempts yet.', es: 'Aún no hay intentos.' },
    'statistik.reset':      { en: 'Reset progress', es: 'Restablecer el progreso' },
    'statistik.sicher':     { en: 'Really reset everything?', es: '¿Restablecer todo de verdad?' },
    'tab.sitzt':            { en: 'solid', es: 'dominada' },
    'tab.nichtDabei':       { en: '(not in use)', es: '(no está en uso)' },

    'wissen.titel':         { en: 'Good to know', es: 'Conviene saber' },
    'wissen.stimmung':      { en: 'Why does it sound lower than it is written?',
                              es: '¿Por qué suena más grave de lo que está escrito?' },
    'wissen.stimmung.text': {
      en: 'The trumpet is a <em>B flat instrument</em>: what is written as C sounds as B♭ – a '
        + 'whole tone lower. The app plays at that sounding pitch and listens at it too, so you '
        + 'can play along without transposing anything. Next to a piano the same note sounds a '
        + 'tone lower than there – that is correct, and true of every B♭ trumpet. That is why '
        + 'the sounding pitch is shown in small print under each note name.',
      es: 'La trompeta es un <em>instrumento en si bemol</em>: lo que está escrito como do suena '
        + 'como si bemol, un tono más grave. La aplicación toca en esa altura real y también '
        + 'escucha en ella, de modo que puedes tocar a la vez sin transponer nada. Junto a un '
        + 'piano la misma nota suena un tono más grave que allí: es correcto y ocurre con toda '
        + 'trompeta en si bemol. Por eso bajo cada nombre aparece, en pequeño, cómo suena.' },
    'wissen.naturton':      { en: 'Same fingering, different note', es: 'Misma digitación, otra nota' },
    'wissen.naturton.text': {
      en: 'Every fingering comes with a whole series of <em>natural notes</em>. Lip tension and '
        + 'air decide which of them sounds: C4, G4, C5, E5 and G5 are all played without a valve. '
        + 'If the next natural note up comes out instead of the one wanted, the fingering was '
        + 'right and only the tension too high. The app reports that as <em>overblown</em> and '
        + 'does not count it as a mistake.',
      es: 'A cada digitación le corresponde toda una serie de <em>armónicos</em>. La tensión de '
        + 'los labios y el aire deciden cuál suena: C4, G4, C5, E5 y G5 se tocan todas sin '
        + 'pistón. Si en lugar de la nota buscada sale el armónico siguiente, la digitación era '
        + 'correcta y solo sobraba tensión. La aplicación lo indica como <em>sobresoplado</em> y '
        + 'no lo cuenta como error.' },
    'wissen.ueben':         { en: 'How to practise with the app', es: 'Cómo practicar con la aplicación' },
    'wissen.ueben.text': {
      en: 'Ten minutes every day beat an hour once a week – the embouchure builds through '
        + 'regularity. A good order: a few <em>notes</em> to warm up, then <em>rhythm</em>, then '
        + '<em>melodies</em>. Only raise the tempo once an exercise has been clean several times '
        + 'slowly. And stop before the lips are tired: a tired embouchure mostly practises mistakes.',
      es: 'Mejor diez minutos cada día que una hora una vez por semana: la embocadura se forma '
        + 'con regularidad. Un buen orden: unas cuantas <em>notas</em> para calentar, luego '
        + '<em>ritmo</em> y después <em>melodías</em>. Sube el tempo solo cuando un ejercicio '
        + 'haya salido limpio varias veces despacio. Y para antes de que se cansen los labios: '
        + 'con la embocadura cansada se practican sobre todo errores.' },
    'wissen.aufnahmen':     { en: 'Where the recordings come from', es: 'Origen de las grabaciones' },
    'wissen.aufnahmen.text': {
      en: 'The notes the app plays are real recordings of a Yamaha Périnet trumpet, played by '
        + 'Mario Schulter. The nine notes from C4 to D5 were recorded; all others are retuned '
        + 'from them and therefore sound a little less natural in the low and high register. The '
        + 'microphone is analysed on the device only – nothing is recorded or sent anywhere.',
      es: 'Las notas que toca la aplicación son grabaciones reales de una trompeta Yamaha '
        + 'Périnet, interpretadas por Mario Schulter. Se grabaron las nueve notas de C4 a D5; '
        + 'las demás se reafinan a partir de ellas y por eso suenan algo menos naturales en el '
        + 'registro grave y en el agudo. El micrófono se analiza solo en el dispositivo: nada '
        + 'se graba ni se envía.' }
  };

  var jetzt = 'de';

  function gueltig(code) { return SPRACHEN.indexOf(code) >= 0 ? code : 'de'; }

  /** Uebersetzung zu einem Schluessel; ohne Eintrag der deutsche Urtext.
   *  `werte` fuellt Platzhalter der Form {name}. */
  function t(schluessel, urtext, werte) {
    var e = TEXTE[schluessel];
    var text = (jetzt !== 'de' && e && e[jetzt]) ? e[jetzt] : urtext;
    if (werte) {
      for (var k in werte) {
        if (Object.prototype.hasOwnProperty.call(werte, k)) {
          text = text.split('{' + k + '}').join(werte[k]);
        }
      }
    }
    return text;
  }

  function zerlege(id) {
    var m = /^([a-z]+?)([0-9])?$/.exec(String(id));
    return m ? { name: m[1], oktave: m[2] ? parseInt(m[2], 10) : 0 } : { name: String(id), oktave: 0 };
  }

  /** Tonname in der eingestellten Sprache: deutsch fis, c¹, as² —
   *  sonst F♯3, C4, A♭5. */
  function ton(id) {
    var z = zerlege(id);
    if (jetzt === 'de') { return z.name + (HOCH[z.oktave] || ''); }
    return (INTERNATIONAL[z.name] || z.name.toUpperCase()) + (z.oktave + 3);
  }

  /** Name einer Tonhoehe aus ihrer MIDI-Nummer — fuer die KLINGENDE
   *  Hoehe. 48 ist das kleine c, 60 das eingestrichene. */
  function hoehe(midi) {
    var oktave = Math.floor(midi / 12) - 4;
    var name = HALBTOENE[((midi % 12) + 12) % 12];
    if (oktave < 0) {
      // Grosse Oktave: im Deutschen gross geschrieben, sonst die Zahl.
      return jetzt === 'de' ? name.charAt(0).toUpperCase() + name.slice(1)
                            : (INTERNATIONAL[name] + (oktave + 3));
    }
    return ton(name + (oktave > 0 ? oktave : ''));
  }

  /** Setzt die Sprache und schreibt allen Text im Dokument neu.
   *  Ohne Dokument — im Testlauf unter node — bleibt es beim Woerterbuch. */
  function setzen(code) {
    jetzt = gueltig(code);
    if (typeof document === 'undefined') { return; }
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
    hoehe: hoehe,
    texte: TEXTE
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
