// Standalone game locale adapter. No external translation requests.
(() => {
  const language = new URLSearchParams(location.search).get('lang');
  window.snowtoneLanguage = ['de','en','es','sl'].includes(language) ? language : 'de';
  window.snowtoneLocale = {de:'de-DE',en:'en-GB',es:'es-ES',sl:'sl-SI'}[window.snowtoneLanguage];
  document.documentElement.lang = window.snowtoneLanguage;
  const rows = [
    ['Spiel den richtigen Ton und schmilz die Schneemänner!','Play the right note and melt the snowmen!','¡Toca la nota correcta y derrite los muñecos de nieve!','Zaigraj pravi ton in stopi snežake!'],
    ['Instrument','Instrument','Instrumento','Glasbilo'],['Schwierigkeit','Difficulty','Dificultad','Težavnost'],
    ['Blechbläser','Brass','Viento metal','Trobila'],['Holzbläser','Woodwind','Viento madera','Pihala'],
    ['Trompete in B','B♭ trumpet','Trompeta en Si♭','Trobenta v B'],['Horn in F','F horn','Trompa en Fa','Rog v F'],['Horn in Es','E♭ horn','Trompa en Mi♭','Rog v Es'],['Tenorhorn in B','B♭ tenor horn','Bombardino en Si♭','Tenorski rog v B'],['Posaune (Bassschlüssel)','Trombone (bass clef)','Trombón (clave de fa)','Pozavna (basovski ključ)'],['Tuba (Bassschlüssel)','Tuba (bass clef)','Tuba (clave de fa)','Tuba (basovski ključ)'],['Posaune','Trombone','Trombón','Pozavna'],['Flöte in C','C flute','Flauta en Do','Flavta v C'],['Sopranblockflöte','Soprano recorder','Flauta dulce soprano','Sopranska kljunasta flavta'],['Altsaxophon in Es','E♭ alto saxophone','Saxofón alto en Mi♭','Altovski saksofon v Es'],
    ['Leicht','Easy','Fácil','Lahko'],['Mittel','Medium','Medio','Srednje'],['Schwer','Hard','Difícil','Težko'],
    ['Notennamen zeigen','Show note names','Mostrar nombres de notas','Pokaži imena not'],['Soundeffekte','Sound effects','Efectos de sonido','Zvočni učinki'],['Mikrofon-Empfindlichkeit','Microphone sensitivity','Sensibilidad del micrófono','Občutljivost mikrofona'],
    ['Höher = reagiert auch auf leises Spiel. Niedriger bei lauter Umgebung.','Higher = detects quieter playing. Lower in noisy surroundings.','Más alta = detecta sonidos suaves. Más baja en ambientes ruidosos.','Višje = zazna tišje igranje. Nižje v glasnem okolju.'],
    ['📱 Tipp: Halte dein Handy quer, dann werden die Noten auf den Schneemännern viel größer.','📱 Turn your phone sideways for larger notes.','📱 Gira el móvil para ver las notas más grandes.','📱 Obrni telefon vodoravno za večje note.'],
    ["Los geht's!",'Let’s play!','¡A jugar!','Začnimo!'],['So geht\'s:','How to play:','Cómo jugar:','Kako igrati:'],
    ['Auf jedem Schneemann steht eine Note. Spiel diesen Ton (so wie er für dein Instrument notiert ist) und halte ihn kurz. Dann schmilzt deine Warmwasser-Spritze den Schneemann. Bist du zu langsam, wirft er einen Schneeball.','Each snowman has a note. Play it as written for your instrument and hold it briefly to melt him. If you are too slow, he throws a snowball.','Cada muñeco tiene una nota. Tócala como está escrita para tu instrumento y mantenla brevemente para derretirlo. Si tardas demasiado, lanza una bola de nieve.','Vsak snežak ima noto. Zaigraj jo, kot je zapisana za tvoje glasbilo, in jo na kratko zadrži, da se stopi. Če si prepočasen, vrže snežno kepo.'],
    ['Nach 5 Treffern ist das Spiel aus.','The game ends after 5 hits.','La partida termina después de 5 impactos.','Po 5 zadetkih je igre konec.'],
    ['Mit der Zeit kommen mehr Schneemänner und sie werfen schneller.','More snowmen arrive and throw faster over time.','Con el tiempo llegan más muñecos y lanzan más rápido.','Sčasoma pride več snežakov, ki mečejo hitreje.'],
    ['Rettung in letzter Sekunde:','Last-second rescue:','Rescate en el último segundo:','Reševanje v zadnji sekundi:'],
    ['Fliegt schon ein Schneeball, spiel schnell noch den Ton dieses Schneemanns. Das warme Wasser lässt den Ball in der Luft verdampfen.','If a snowball is already flying, quickly play its snowman’s note. The warm water evaporates it in mid-air.','Si ya vuela una bola, toca rápidamente la nota de su muñeco. El agua caliente la evapora en el aire.','Če kepa že leti, hitro zaigraj ton njenega snežaka. Topla voda jo izpari v zraku.'],
    ['Tipp: Spiel in einem ruhigen Raum. Mit Kopfhörern stören die Soundeffekte die Tonerkennung nicht.','Play in a quiet room. Headphones keep sound effects from interfering with note detection.','Juega en un lugar tranquilo. Los auriculares evitan que los efectos interfieran con la detección.','Igraj v mirnem prostoru. Slušalke preprečijo motnje pri zaznavanju tonov.'],
    ['Gehört (für dein Instrument)','Heard (for your instrument)','Detectado (para tu instrumento)','Zaznano (za tvoje glasbilo)'],['Highscores','High scores','Récords','Najboljši rezultati'],['Pause','Paused','Pausa','Premor'],['Weiter','Resume','Continuar','Nadaljuj'],['Zum Menü','Menu','Menú','Meni'],['Menü','Menu','Menú','Meni'],['Nochmal','Play again','Otra vez','Znova'],['Eingeschneit!','Snowed in!','¡Bajo la nieve!','Zasnežen!'],['Stark gespielt!','Great playing!','¡Bien jugado!','Odlično igranje!'],['Neuer Highscore!','New high score!','¡Nuevo récord!','Nov rekord!'],['Dein Name','Your name','Tu nombre','Tvoje ime'],['Speichern','Save','Guardar','Shrani'],['Deine Winter-Melodie','Your winter melody','Tu melodía de invierno','Tvoja zimska melodija'],['Das sind die Töne, mit denen du die Schneemänner geschmolzen hast, in genau dieser Reihenfolge.','These are the notes you used to melt the snowmen, in order.','Estas son las notas con las que derretiste a los muñecos, en orden.','To so toni, s katerimi si stopil snežake, v istem vrstnem redu.'],['▶ Anhören','▶ Listen','▶ Escuchar','▶ Poslušaj'],['Ergebnis für den Lehrer kopieren','Copy result for your teacher','Copiar resultado para tu profesor','Kopiraj rezultat za učitelja'],['Ergebnis zum Kopieren','Result to copy','Resultado para copiar','Rezultat za kopiranje'],['Kopiert ✓ Jetzt einfach einfügen','Copied ✓ Ready to paste','Copiado ✓ Listo para pegar','Kopirano ✓ Prilepi'],['Text unten markiert: jetzt kopieren','Text selected below: copy it now','Texto seleccionado abajo: cópialo','Besedilo spodaj je označeno: kopiraj'],
    ['Noch keine Einträge. Sei der Erste!','No scores yet. Be the first!','¡Todavía no hay resultados!','Še ni rezultatov. Bodi prvi!'],['Ich höre dich noch nicht.','I cannot hear you yet.','Todavía no te oigo.','Še te ne slišim.'],['Mikrofon erlaubt? Etwas lauter?','Microphone allowed? A little louder?','¿Micrófono permitido? ¿Un poco más fuerte?','Mikrofon dovoljen? Malo glasneje?'],['Ich warte auf dich.','I am waiting for you.','Te estoy esperando.','Čakam nate.'],['Schön, dass du wieder da bist!','Welcome back!','¡Bienvenido de nuevo!','Dobrodošel nazaj!'],['Gerettet! +','Rescued! +','¡Rescatado! +','Rešeno! +'],['Ohne Namen','Unnamed','Sin nombre','Brez imena'],['Anonym','Anonymous','Anónimo','Anonimno'],['Snowtone – Ergebnis','Snowtone – Result','Snowtone – Resultado','Snowtone – Rezultat'],['Sicher:','Confident:','Seguro:','Zanesljivo:'],['Üben:','Practise:','Practicar:','Vadi:'],['Melodie:','Melody:','Melodía:','Melodija:'],
    ['Zum Weiterspielen ist ein Upgrade erforderlich.','An upgrade is required to keep playing.','Mejora tu plan para seguir jugando.','Za nadaljevanje igre je potrebna nadgradnja.'],
    ["Das Mikrofon ist nicht freigegeben. Erlaube den Zugriff in der Adresszeile des Browsers und tippe dann noch einmal auf „Los geht's!“.",'Microphone unavailable. Allow access in your browser and try again.','Micrófono no disponible. Permite el acceso en el navegador e inténtalo de nuevo.','Mikrofon ni na voljo. Dovoli dostop v brskalniku in poskusi znova.'],
  ];
  const index = {de:0,en:1,es:2,sl:3}[window.snowtoneLanguage];
  const map = new Map(rows.map(row => [row[0],row[index]]));
  window.snowtoneTranslate = text => {
    if (!index) return text;
    const trimmed = text.trim();
    if (map.has(trimmed)) return text.replace(trimmed,map.get(trimmed));
    return text;
  };
  window.snowtoneTranslateDom = () => {
    const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while ((node=walker.nextNode())) {
      if (['SCRIPT','STYLE'].includes(node.parentElement.tagName)) continue;
      node.textContent=window.snowtoneTranslate(node.textContent.replace(/\s+/g,' '));
    }
    for (const el of document.querySelectorAll('[placeholder],[aria-label],optgroup')) {
      for (const attr of ['placeholder','aria-label','label']) if(el.hasAttribute(attr)) el.setAttribute(attr,window.snowtoneTranslate(el.getAttribute(attr)));
    }
  };
})();
