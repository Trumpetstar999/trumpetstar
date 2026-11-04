(function () {
  'use strict';
  var language = new URLSearchParams(location.search).get('lang');
  if (['de', 'en', 'es', 'sl'].indexOf(language) < 0) language = 'de';
  document.documentElement.lang = language;
  var source = ['Rhythmus', 'Zurück zum Home-Bildschirm', 'Home', 'Taktart', 'Vier-Viertel-Takt', 'Drei-Viertel-Takt', 'Ton wechseln', 'Anhören als Klatschen oder auf der Trompete', 'Klatschen', 'Trompete', 'Würfeln', 'Letzten Baustein löschen', 'Alles löschen', 'Tipp unten auf die Bausteine und bau dir deinen Rhythmus!', 'Rhythmus-Bausteine', 'Tempo', 'Langsamer', 'Schneller', 'Anhören', 'Stopp', 'Selbst spielen', 'Zurück zum Baukasten', 'Baukasten', 'Wer spielt?', 'Mitspielen: die Trompete spielt mit', 'Mitspielen', 'Solo: du spielst allein', 'Solo', 'Los', 'Super – du bist ein Star!', 'Für Solo braucht die App dein Mikrofon. Mitspielen geht auch ohne.'];
  var catalogs = {
    en: ['Rhythm', 'Back to Home', 'Home', 'Time signature', 'Four-four time', 'Three-four time', 'Change note', 'Listen with claps or trumpet', 'Claps', 'Trumpet', 'Random rhythm', 'Remove last block', 'Clear all', 'Tap the blocks below to create your rhythm!', 'Rhythm blocks', 'Tempo', 'Slower', 'Faster', 'Listen', 'Stop', 'Play yourself', 'Back to builder', 'Builder', 'Who plays?', 'Play along: the trumpet plays with you', 'Play along', 'Solo: you play on your own', 'Solo', 'Start', 'Great – you are a star!', 'Solo needs microphone access. You can play along without it.'],
    es: ['Ritmo', 'Volver al inicio', 'Inicio', 'Compás', 'Compás de cuatro cuartos', 'Compás de tres cuartos', 'Cambiar nota', 'Escuchar con palmas o trompeta', 'Palmas', 'Trompeta', 'Ritmo aleatorio', 'Quitar el último bloque', 'Borrar todo', '¡Toca los bloques de abajo para crear tu ritmo!', 'Bloques rítmicos', 'Tempo', 'Más lento', 'Más rápido', 'Escuchar', 'Parar', 'Tocar tú', 'Volver al constructor', 'Constructor', '¿Quién toca?', 'Tocar juntos: la trompeta te acompaña', 'Tocar juntos', 'Solo: tocas tú', 'Solo', 'Empezar', '¡Genial, eres una estrella!', 'Solo necesita acceso al micrófono. Puedes tocar juntos sin él.'],
    sl: ['Ritem', 'Nazaj na začetni zaslon', 'Domov', 'Taktovski način', 'Štiričetrtinski takt', 'Tričetrtinski takt', 'Spremeni ton', 'Poslušaj s ploskanjem ali trobento', 'Ploskanje', 'Trobenta', 'Naključni ritem', 'Odstrani zadnji gradnik', 'Izbriši vse', 'Tapni spodnje gradnike in sestavi svoj ritem!', 'Ritmični gradniki', 'Tempo', 'Počasneje', 'Hitreje', 'Poslušaj', 'Ustavi', 'Igraj sam', 'Nazaj na sestavljanje', 'Sestavljanje', 'Kdo igra?', 'Igraj zraven: trobenta igra s teboj', 'Igraj zraven', 'Solo: igraš sam', 'Solo', 'Začni', 'Odlično – prava zvezda si!', 'Za solo potrebuješ mikrofon. Igranje zraven deluje tudi brez njega.'],
  };
  function translate(value) {
    var i = source.indexOf(value.trim());
    return i < 0 || language === 'de' ? value : catalogs[language][i];
  }
  function localize() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && /^(SCRIPT|STYLE)$/.test(node.parentElement.tagName)) continue;
      var text = translate(node.nodeValue);
      if (text !== node.nodeValue) node.nodeValue = text;
    }
    document.querySelectorAll('[aria-label],[title]').forEach(function (el) {
      ['aria-label', 'title'].forEach(function (attr) {
        var value = el.getAttribute(attr);
        if (value && translate(value) !== value) el.setAttribute(attr, translate(value));
      });
    });
    // Musical syllables remain the supplied pedagogical content; note naming follows locale.
    if (language === 'en' && window.RhythmusWerkstatt) {
      ['rh-ton-kreis', 'ue-tonname'].forEach(function (id) { var el = document.getElementById(id); if (el.textContent === 'h') el.textContent = 'b'; });
    }
    document.title = translate('Rhythmus') + ' · Trumpetstar';
  }
  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    queueMicrotask(function () { pending = false; localize(); });
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  localize();
  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || event.source !== parent || event.data?.typ !== 'trumpetstar-rhythmus-theme') return;
    var allowed = ['--ts-sky','--ts-deep','--ts-bright','--ts-gold','--ts-red','--ts-ink','--ts-ink-muted','--ts-surface','--ts-card','--ts-on-gradient','--tuner-tuned'];
    allowed.forEach(function (key) {
      var value = event.data.tokens?.[key];
      if (typeof value === 'string' && /^[\d.\s%]+$/.test(value)) document.documentElement.style.setProperty(key, value);
    });
  });
})();