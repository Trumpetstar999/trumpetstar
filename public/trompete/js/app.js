/* app.js — Zusammenbau, Bildschirmwechsel, Geraeteeigenheiten.
 *
 * Zwei Bildschirme fuer das Kind (Auswahl und Uebung), ein versteckter
 * fuer die Eltern. Mehr nicht.
 */
(function (root) {
  'use strict';

  var k = {};                       // gemeinsamer Kontext aller Module
  var aktuellesLevel = null;
  var level1 = null, level2 = null, buch = null;
  var wachSperre = null;
  var letzteBreite = 0, letzteHoehe = 0;

  /* ---------------------------------------------------------------- */
  /* Laden                                                             */
  /* ---------------------------------------------------------------- */

  function jsonHolen(pfad) {
    // Im Pruefstand mit Zeitstempel, damit der Browser nichts Altes liefert.
    if (root.PRUEFSTAND) { pfad += (pfad.indexOf('?') < 0 ? '?' : '&') + 'v=' + Date.now(); }
    return new Promise(function (aufl, ab) {
      var x = new XMLHttpRequest();
      x.open('GET', pfad, true);
      x.onload = function () {
        try { aufl(JSON.parse(x.responseText)); } catch (e) { ab(e); }
      };
      x.onerror = function () { ab(new Error(pfad)); };
      x.send();
    });
  }

  function start() {
    Promise.all([
      jsonHolen('data/toene.json'),
      jsonHolen('data/lieder.json').catch(function () { return { lieder: [] }; }),
      jsonHolen('data/buch.json').catch(function () { return null; })
    ]).then(function (teile) {
      aufbauen(teile[0], teile[1], teile[2]);
    });
  }

  function aufbauen(daten, lieder, buchDaten) {
    /* Welches Blechinstrument spielt das Kind? Trompete in B, Horn in F,
     * Horn in Es oder Tenorhorn. Das muss VOR allem anderen geschehen:
     * daran haengen die klingenden Frequenzen aller Toene und der
     * Hoerbereich der Erkennung. Das Notenbild bleibt unberuehrt. */
    k.instrument = root.Instrument.anwenden(daten);

    /* Zwei Tonvorraete, und sie duerfen nicht durcheinandergeraten:
     *
     *   k.toene      die neun Toene des Lehrgangs. Daran haengen der
     *                Fortschritt, die Trefferquoten, der Generator und
     *                die Erkennung in den Levels 1 bis 3.
     *   k.alleToene  dazu die Toene, die nur im Buch vorkommen (fis1,
     *                b1, e2 und die anderen). Sie werden gezeichnet,
     *                gegriffen und vorgespielt, zaehlen aber nie in
     *                einen Vorrat hinein. */
    k.toene = daten.toene;
    k.buchToene = daten.buchToene || [];
    k.alleToene = k.toene.concat(k.buchToene);
    k.erkennung = daten.erkennung;
    k.lieder = lieder.lieder || [];
    k.buchDaten = buchDaten;
    k.tonKarte = {};
    k.alleToene.forEach(function (t) { k.tonKarte[t.id] = t; });

    k.tonById = function (id) { return k.tonKarte[id] || null; };

    k.fortschritt = new root.Fortschritt({
      toene: k.toene,
      speicher: (function () { try { return root.localStorage; } catch (e) { return null; } })()
    });

    // Der Motor spielt auch die Buch-Toene vor; die Erkennung bekommt
    // ihre Toene je Bereich (Tracker.setzeToene).
    k.motor = new root.Motor({
      toene: k.alleToene, erkennung: k.erkennung,
      klangfilterHz: k.instrument.klangfilterHz || 0,
      eigeneStimmung: k.instrument.id !== 'b-trompete'
    });
    /* Wie streng zugehoert wird. Die Stufen stehen in toene.json, die
     * Wahl im Fortschritt — und der Tracker bekommt sie bei jedem
     * Wechsel neu, weil seine Toleranztabellen daran haengen. */
    k.schwierigkeitStufen = (daten.schwierigkeit && daten.schwierigkeit.stufen) || {};
    k.schwierigkeit = function () {
      return k.schwierigkeitStufen[k.fortschritt.schwierigkeit()] ||
             k.schwierigkeitStufen.mittel || {};
    };

    k.tracker = new root.Tracker({
      toene: k.toene, erkennung: k.erkennung, logSekunden: 34,
      schwierigkeit: k.schwierigkeit()
    });
    k.schwierigkeitAnwenden = function () {
      k.tracker.setzeSchwierigkeit(k.schwierigkeit());
    };

    k.noten = document.getElementById('noten');
    k.satz = document.getElementById('satz');
    k.tierfeld = document.getElementById('tierfeld');
    k.tierbild = document.getElementById('tierbild');
    k.griff = document.getElementById('griff');
    k.grifffeld = document.getElementById('grifffeld');
    k.notenfeld = document.getElementById('notenfeld');
    k.punkte = document.getElementById('punkte');
    k.spielknopf = document.getElementById('spielknopf');
    k.modusMit = document.getElementById('modus-mit');
    k.modusSolo = document.getElementById('modus-solo');
    k.buehne = document.getElementById('buehne');

    k.rueckmeldung = new root.Rueckmeldung({
      buehne: k.buehne, motor: k.motor, grifffeld: k.grifffeld,
      bilder: { froh: 'img/vogel-froh.png', feder: 'img/feder.png', lauscht: 'img/vogel-lauscht.png' },
      /* Die Farben der Toene, ohne Wiederholung — c1 und c2 tragen
       * dieselbe. Daraus werden die Noten, die beim Lob auffliegen. */
      farben: k.toene.map(function (t) { return t.farbe; })
        .filter(function (f, i, alle) { return alle.indexOf(f) === i; })
    });

    k.tempo = new root.Tempo({
      feld: document.getElementById('tempofeld'),
      bahn: document.getElementById('tempobahn'),
      griff: document.getElementById('tempogriff'),
      hase: document.getElementById('hase'),
      motor: k.motor,
      beiAenderung: function (bpm) { k.fortschritt.setzeTempo(bpm); }
    });
    k.tempo.setze(k.fortschritt.tempo(), true);

    k.tippBinden = tippBinden;
    k.knopfBereit = knopfBereit;
    k.zeigeModus = zeigeModus;
    k.zeichneNote = zeichneNote;
    k.zeichneGriff = zeichneGriff;
    k.zeigeTier = zeigeTier;
    k.bildschirm = bildschirm;
    k.levelStarten = levelStarten;
    k.liedFuer = liedFuer;
    k.umblaettern = umblaettern;
    k.nachHause = nachHause;
    k.punkteSetzen = punkteSetzen;
    k.notenMasse = function () { var m = masseNehmen(false); return { b: m.b, h: m.h }; };
    k.uebungsbildSetzen = uebungsbildSetzen;

    level1 = new root.Level1(k);
    level2 = new root.Level2(k);
    k.level1 = level1; k.level2 = level2;
    if (k.buchDaten) { buch = new root.Buch(k); k.buch = buch; }
    k.auswahl = new root.Auswahl(k);
    k.eltern = new root.Eltern(k);

    /* Bunt oder schwarz. Der Schalter sitzt an EINER Stelle: die
     * beiden Zeichner merken sich, wie sie malen sollen, und jeder
     * spaetere Aufruf folgt dem von selbst. Sonst muesste die
     * Einstellung durch jeden einzelnen Zeichenaufruf gereicht
     * werden — und einer wuerde immer vergessen. */
    k.notenfarbeAnwenden = function (bereich) {
      // Das Buch hat seine eigene Wahl, von Haus aus schwarz wie im Druck.
      var schwarz = (bereich === 'buch' ? k.fortschritt.buchNotenfarbe() : k.fortschritt.notenfarbe()) === 'schwarz';
      if (root.Noten.einfarbig) { root.Noten.einfarbig(schwarz); }
      if (root.Griff.einfarbig) { root.Griff.einfarbig(schwarz); }
    };
    k.notenfarbeAnwenden();

    /* Welches Instrument gezeichnet wird — Perinet-Ventile fuer Trompete
     * und Tenorhorn, Drehventil-Hebel fuer das Horn. Das Hintergrundbild
     * der Trompete wird dabei mitgeschaltet. */
    root.Griff.setzeArt(k.instrument.griffbild);

    /* In den beiden Modus-Knoepfen steht dasselbe Instrument wie unten im
     * Griffbild — gezeichnet vom selben Modul, nur mit offenen
     * Ventilen. Es aendert sich nie, deshalb genuegt es, es einmal
     * beim Aufbauen zu zeichnen. */
    [].slice.call(document.querySelectorAll('.modus-trompete')).forEach(function (svg) {
      root.Griff.zeichne(svg, root.Griff.offen);
    });


    /* Die gewaehlte Sprache gleich beim Start setzen, nicht erst beim
     * Oeffnen des Elternbereichs: an der Wurzel haengt das lang-Attribut,
     * und der Vorleser stolpert sonst ueber deutsche Beschriftungen. */
    root.Sprachen.setzen(k.fortschritt.sprache());

    tippBinden(document.getElementById('haus'), hausTaste);
    tippBinden(document.getElementById('umblaettern'), umblaettern);
    tippBinden(document.getElementById('zurueckblaettern'), zurueckblaettern);
    tippBinden(k.spielknopf, spielTaste);
    tippBinden(k.modusMit, function () { modusWaehlen('mit'); });
    tippBinden(k.modusSolo, function () { modusWaehlen('solo'); });

    torVorbereiten();
    fensterEreignisse();
    /* KEIN Service Worker: das Spiel laeuft innerhalb der Trumpetstar-App
     * und wird von ihr ausgeliefert. Ein eigener Zwischenspeicher wuerde
     * alte Dateien festhalten, nachdem die App aktualisiert wurde. */
  }

  /* ---------------------------------------------------------------- */
  /* Startgeste: erst danach darf iOS Ton machen                       */
  /* ---------------------------------------------------------------- */

  function torVorbereiten() {
    var knopf = document.getElementById('torknopf');
    var schonGestartet = false;
    tippBinden(knopf, function () {
      if (schonGestartet) { return; }
      schonGestartet = true;
      k.motor.starten().then(function () {
        // Der Pruefstand haengt sich hier ein und liefert einen
        // Audioknoten statt des Mikrofons.
        if (root.PRUEFSTAND) { return root.PRUEFSTAND.eingang(k, aufFrames); }
        return k.motor.mikrofonStarten(aufFrames);
      }).then(function () {
        wachSperreHolen();
        bildschirm('auswahl');
        k.auswahl.aufbauen();
      }, function () {
        // Mikrofon nicht verfuegbar. Im installierten Modus vor iOS 13.4
        // ist das bauartbedingt so — dann bildlich nach Safari verweisen.
        if (root.navigator.standalone) { bildschirm('safarihinweis'); }
        else { bildschirm('auswahl'); k.auswahl.aufbauen(); }
      });
    });
  }

  function aufFrames(buf) {
    var ereignisse = k.tracker.feedKompakt(buf);
    if (!ereignisse.length && !level1.laeuft) { return; }
    if (aktuellesLevel === '1' && level1.laeuft) {
      var frames = k.tracker.frames();
      var letzter = frames[frames.length - 1];
      level1.ereignisse(ereignisse, (letzter && letzter.above) ? letzter.t : 0);
    } else if (level2.laeuft) {
      level2.ereignisse(ereignisse);
    } else if (buch && buch.ueben.laeuft) {
      buch.ueben.ereignisse(ereignisse);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Bildschirme                                                       */
  /* ---------------------------------------------------------------- */

  /** Ein Knopf fuer beides: los und halt. */
  function spielTaste() {
    if (k.rueckmeldung.laeuft) { return; }
    var laeuft = k.spielknopf.classList.contains('laeuft');
    if (aktuellesLevel === '1') {
      if (laeuft) { level1.stop(); } else { level1.start(); }
    } else if (level2.laeuft) {
      if (laeuft) { level2.stop(); } else { level2.start(); }
    } else if (buch && buch.ueben.laeuft) {
      if (laeuft) { buch.ueben.stop(); } else { buch.ueben.start(); }
    }
  }

  /** Mitspielen oder allein — in den Rhythmus-Leveln wie im Buch. */
  function modusWaehlen(art) {
    if (level2.laeuft) { level2.setzeModus(art); }
    else if (buch && buch.ueben.laeuft) { buch.ueben.setzeModus(art); }
  }

  /* So viele Punkte, wie ein Takt Schlaege hat: vier im 4/4-Takt, drei
   * im 3/4-Takt, zwei im 2/4-Takt. Die gewuerfelten Uebungen der Level
   * 2 und 3 stehen immer im Viervierteltakt; das Buch kennt alle drei. */
  function punkteSetzen(anzahl) {
    anzahl = Math.max(1, Math.min(8, Math.round(anzahl) || 4));
    if (k.punkte.children.length === anzahl) { return; }
    while (k.punkte.firstChild) { k.punkte.removeChild(k.punkte.firstChild); }
    for (var i = 0; i < anzahl; i++) {
      var p = document.createElement('span');
      p.className = 'punkt';
      k.punkte.appendChild(p);
    }
  }

  /** true = laeuft gerade (Stop-Zeichen), false = wartet (Play, atmend). */
  function knopfBereit(laeuft) {
    k.spielknopf.classList.toggle('laeuft', !!laeuft);
    k.spielknopf.classList.toggle('bereit', !laeuft);
  }

  function zeigeModus(art) {
    k.modusMit.classList.toggle('an', art !== 'solo');
    k.modusSolo.classList.toggle('an', art === 'solo');
  }

  function bildschirm(name) {
    ['tor', 'auswahl', 'buch', 'uebung', 'eltern', 'safarihinweis'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.hidden = (id !== name); }
    });
  }

  /* Welches Bild der Uebungsbildschirm tragen soll: Level 1, die
   * Rhythmus-Level oder das Buch. Die Klasse bestimmt das Raster, und
   * sie sagt auch, welches der beiden Notenbilder sichtbar ist. */
  function uebungsbildSetzen(art) {
    var u = document.getElementById('uebung');
    u.classList.toggle('stufe1', art === 'stufe1');
    u.classList.toggle('stufe2', art === 'stufe2');
    u.classList.toggle('buch', art === 'buch');
    /* Ein <svg> ist kein HTMLElement: `hidden` als Eigenschaft zu setzen
     * legt dort nur ein totes Feld an. Das Merkmal muss selbst gesetzt
     * werden, sonst bleibt das Notenbild sichtbar. */
    zeigen(k.noten, art !== 'buch');
    zeigen(k.satz, art === 'buch');
    /* Blaettern: im Buch vorwaerts UND zurueck — dort ist eine Seite eine
     * Seite. In den Leveln regelt umblaetternZeigen den Vorwaertsknopf. */
    var vor = document.getElementById('umblaettern');
    if (vor && art === 'buch') { vor.hidden = false; }
    var zurueck = document.getElementById('zurueckblaettern');
    if (zurueck) { zurueck.hidden = (art !== 'buch'); }
    masseNehmen(true);
  }

  function zeigen(el, an) {
    if (!el) { return; }
    if (an) { el.removeAttribute('hidden'); } else { el.setAttribute('hidden', ''); }
  }

  function levelStarten(level) {
    // Immer erst das laufende Level anhalten. Sonst laeuft dessen Wache
    // weiter und setzt mitten im neuen Level die Erkennung zurueck.
    if (level1.laeuft) { level1.beenden(); }
    if (level2.laeuft) { level2.beenden(); }
    if (buch && buch.ueben.laeuft) { buch.ueben.beenden(); }
    aktuellesLevel = level;

    /* Das Buch geht nicht ins Ueben, sondern ins Blaettern: erst die
     * Seite suchen, die neben dem iPad aufgeschlagen liegt. */
    if (level === 'buch') {
      if (!buch) { nachHause(); return; }
      umblaetternZeigen(false);
      k.fortschritt.setzeLetztesLevel(level);
      buch.oeffnen();
      return;
    }
    umblaetternZeigen(true);
    /* Level 1 und die Rhythmus-Level fuehren getrennte Fortschritte.
     * Das muss VOR dem Starten stehen: level1/level2 fragen gleich
     * darauf ihren Tonvorrat ab. */
    k.fortschritt.setzeBereich(level);
    k.fortschritt.setzeLetztesLevel(level);
    uebungsbildSetzen(level === '1' ? 'stufe1' : 'stufe2');
    punkteSetzen(4);
    bildschirm('uebung');
    knopfBereit(false);
    zeigeModus(k.fortschritt.modus());
    masseNehmen(true);
    k.tracker.reset();
    k.motor.erkennungZuruecksetzen();
    if (level === '1') { level1.starten(); }
    else { k.tempo.setze(k.fortschritt.tempo(), true); level2.starten(level); }
  }

  /* Blaettern — der Knopf rechts unten.
   *
   * Beim freien Ueben legt er die naechste gewuerfelte Uebung bereit,
   * so wie man am Notenstaender umblaettert. Das Kind muss fuer den
   * Wechsel nicht den Umweg ueber das Haus gehen. */
  function umblaettern() {
    if (level2.laeuft) { level2.weiter(); }
    else if (buch && buch.ueben.laeuft) { buch.ueben.blaettern(1); }
  }

  /* Im Buch geht es auch zurueck — eine Seite ist eine Seite, und wer
   * sich verblaettert hat, will dorthin, wo er war. */
  function zurueckblaettern() {
    if (buch && buch.ueben.laeuft) { buch.ueben.blaettern(-1); }
  }

  function umblaetternZeigen(an) {
    var vor = document.getElementById('umblaettern');
    if (vor) { vor.hidden = !an; }
    if (!an) {
      var zurueck = document.getElementById('zurueckblaettern');
      if (zurueck) { zurueck.hidden = true; }
    }
  }

  /* Das Haus fuehrt IMMER zurueck — auch mitten in einer Rueckmeldung.
   * Und mit ihm verstummt alles: Metronom, Vorgespieltes, Lobmotiv.
   * Web Audio plant Klaenge im Voraus, deshalb genuegt es nicht, die
   * Uebung anzuhalten. */
  /* Das Haus fuehrt immer eine Stufe zurueck. Aus einem Lied des Buches
   * also ins Buch — dort steht das naechste Lied gleich daneben, und
   * der Weg ueber die Auswahl waere ein Umweg. */
  function hausTaste() {
    if (buch && buch.ueben.laeuft) {
      buch.ueben.beenden();
      k.rueckmeldung.abbrechen();
      k.motor.allesStoppen();
      k.tracker.reset();
      k.motor.erkennungZuruecksetzen();
      knopfBereit(false);
      umblaetternZeigen(false);
      buch.oeffnen();
      return;
    }
    nachHause();
  }

  function nachHause() {
    if (level1.laeuft) { level1.beenden(); }
    if (level2.laeuft) { level2.beenden(); }
    if (buch && buch.ueben.laeuft) { buch.ueben.beenden(); }
    k.rueckmeldung.abbrechen();
    k.motor.allesStoppen();
    k.tracker.reset();
    k.motor.erkennungZuruecksetzen();
    aktuellesLevel = null;
    knopfBereit(false);
    umblaetternZeigen(false);
    bildschirm('auswahl');
    k.auswahl.aufbauen();
  }

  /* ---------------------------------------------------------------- */
  /* Zeichnen                                                          */
  /* ---------------------------------------------------------------- */

  var letzteMasse = { b: 0, h: 0, g: 0 };

  function masseNehmen(erzwingen) {
    var b = k.notenfeld.clientWidth, h = k.notenfeld.clientHeight;
    var g = k.grifffeld.clientHeight;
    if (erzwingen || b !== letzteMasse.b || h !== letzteMasse.h || g !== letzteMasse.g) {
      letzteMasse = { b: b, h: h, g: g };
    }
    return letzteMasse;
  }

  function zeichneNote(melodie, einzelTon, markerIndex, haken) {
    var m = masseNehmen(false);
    if (!m.b || !m.h) { return null; }
    return root.Noten.zeichne(k.noten, {
      toene: k.tonKarte,
      melodie: melodie || null,
      einzelTon: einzelTon || null,
      breitePx: m.b, hoehePx: m.h,
      markerIndex: markerIndex === undefined ? -1 : markerIndex,
      haken: haken || null,
      violinschluessel: true,
      taktstriche: true
    });
  }

  function zeichneGriff(ton) {
    if (!ton) { return; }
    root.Griff.zeichne(k.griff, ton);
  }

  /** Das Tier zum Ton — nur in Level 1. */
  function zeigeTier(ton) {
    if (!ton || !ton.tier) { k.tierbild.removeAttribute('src'); return; }
    var quelle = 'img/tier-' + ton.tier + '.png';
    if (k.tierbild.getAttribute('src') === quelle) { return; }
    k.tierbild.setAttribute('src', quelle);
    k.tierbild.style.animation = 'none';
    void k.tierbild.offsetWidth;
    k.tierbild.style.animation = '';
  }

  /* ---------------------------------------------------------------- */
  /* Lieder                                                            */
  /* ---------------------------------------------------------------- */

  /* Sobald c2 und d2 dabei sind, werden echte Kinderlieder moeglich.
   * Ab da haben sie Vorrang vor gewuerfelten Uebungen. */
  function liedFuer(stufe, vorrat) {
    var passend = k.lieder.filter(function (l) {
      return l.stufe === stufe && l.braucht.every(function (id) { return vorrat.indexOf(id) >= 0; });
    });
    if (!passend.length) { return null; }
    if (Math.random() > 0.6) { return null; }     // nicht jedes Mal dasselbe
    var l = passend[Math.floor(Math.random() * passend.length)];
    return liedZuMelodie(l);
  }

  function liedZuMelodie(l) {
    var stufe = l.stufe;
    var noten = [], takte = [], schlag = 0, taktNr = 0;
    l.takte.forEach(function (takt, ti) {
      var reihe = [], imTakt = 0;
      takt.forEach(function (eintrag) {
        var pause = eintrag[0] === null;
        var dauer = root.Generator.SCHLAEGE[eintrag[1]];
        var n = {
          tonId: pause ? null : eintrag[0], wert: eintrag[1], pause: pause,
          takt: ti, schlag: schlag, schlagImTakt: imTakt, dauer: dauer
        };
        reihe.push(n); noten.push(n);
        schlag += dauer; imTakt += dauer;
      });
      takte.push(reihe);
      taktNr++;
    });
    return {
      seed: l.id, stufe: stufe, istLied: true, takte: takte, noten: noten,
      schlaegeGesamt: takte.length * 4, vorrat: l.braucht.slice()
    };
  }

  /* ---------------------------------------------------------------- */
  /* Geraeteeigenheiten                                                */
  /* ---------------------------------------------------------------- */

  /* Handballen auf dem Display: nur der erste Kontaktpunkt zaehlt
   * (Auftrag 17). Deshalb wird nicht auf 'click' gehoert, sondern der
   * erste Finger von touchstart bis touchend verfolgt; alles, was
   * daneben aufliegt, wird stillschweigend verworfen.
   *
   * Liegt der erste Kontaktpunkt laenger als 1,2 Sekunden auf, ist das
   * kein Tippen, sondern ein aufliegender Handballen — dann wird die
   * Sperre wieder freigegeben, damit der eigentliche Tipp durchkommt. */
  function tippBinden(element, aktion) {
    var id = null, x0 = 0, y0 = 0, seit = 0, ausTouch = 0;

    element.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      if (id !== null && Date.now() - seit < 1200) { return; }
      id = t.identifier; x0 = t.clientX; y0 = t.clientY; seit = Date.now();
    }, { passive: true });

    element.addEventListener('touchend', function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier !== id) { continue; }
        id = null;
        if (Math.abs(t.clientX - x0) < 44 && Math.abs(t.clientY - y0) < 44) {
          ausTouch = Date.now();
          aktion(t);                  // mit clientX/clientY: wo getippt wurde
        }
        return;
      }
    });
    element.addEventListener('touchcancel', function () { id = null; });

    // Am Rechner (und fuer Hilfstechnik) weiterhin ueber click, aber
    // nicht doppelt, wenn der Browser nach touchend noch einen schickt.
    element.addEventListener('click', function (e) {
      if (Date.now() - ausTouch < 700) { return; }
      aktion(e);
    });
  }

  /* Notbremse. Geht irgendwo etwas schief, darf das Kind nicht vor
   * einem eingefrorenen Bildschirm sitzen bleiben. Dann geht es
   * wortlos zurueck zur Auswahl — dem einzigen Ort, an dem sie sich
   * immer zurechtfindet. Keine Meldung, kein Ton, kein rotes Etwas. */
  var letzteNotbremse = 0;
  function notbremse() {
    var jetzt = Date.now();
    if (jetzt - letzteNotbremse < 6000) { return; }
    letzteNotbremse = jetzt;
    if (document.getElementById('uebung').hidden &&
        document.getElementById('buch').hidden) { return; }
    setTimeout(function () {
      if (k.rueckmeldung) { k.rueckmeldung.laeuft = false; k.buehne.classList.remove('sperrt'); }
      nachHause();
    }, 400);
  }

  function fensterEreignisse() {
    root.addEventListener('error', notbremse);
    root.addEventListener('unhandledrejection', notbremse);

    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
    // Kein Wischen, kein Ueberdehnen der Seite
    document.addEventListener('touchmove', function (e) {
      if (document.getElementById('eltern').hidden) { e.preventDefault(); }
    }, { passive: false });

    root.addEventListener('resize', function () {
      if (root.innerWidth === letzteBreite && root.innerHeight === letzteHoehe) { return; }
      letzteBreite = root.innerWidth; letzteHoehe = root.innerHeight;
      masseNehmen(true);
      if (!document.getElementById('auswahl').hidden) { k.auswahl.aufbauen(); }
      if (!document.getElementById('uebung').hidden && aktuellesLevel) {
        if (aktuellesLevel === '1' && level1.zielTon) {
          zeichneNote(null, level1.zielTon, -1);
          zeichneGriff(k.tonById(level1.zielTon));
        } else if (level2.melodie) {
          zeichneNote(level2.melodie, null, -1, level2.haken);
        } else if (buch && buch.ueben.laeuft) {
          buch.ueben.neuZeichnen();
        }
      }
    });

    /* Weggelegt und zehn Minuten spaeter wieder da: die App friert ein,
     * statt weiterzulaufen. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (level1.laeuft) { level1.beenden(); }
        if (level2.laeuft) { level2.beenden(); }
        if (buch && buch.ueben.laeuft) { buch.ueben.beenden(); }
        k.motor.pausieren();
        wachSperreLoslassen();
      } else {
        k.motor.aufwecken().then(function () {
          k.tracker.reset();
          k.motor.erkennungZuruecksetzen();
          wachSperreHolen();
          // Nach der Rueckkehr immer bei der Auswahl anfangen: das ist
          // der Ort, an dem sich ein fuenfjaehriges Kind zurechtfindet.
          if (!document.getElementById('uebung').hidden) { nachHause(); }
        });
      }
    });
  }

  /* Bildschirm wach halten. Die Wake-Lock-API gibt es auf iOS erst ab
   * 16.4 — darunter hilft nur der altbekannte Umweg: ein winziges,
   * stummes Video in Dauerschleife. Es ist 64x64 Pixel gross, liegt
   * hinter allem und ist unsichtbar. */
  var wachVideo = null;

  function wachSperreHolen() {
    if (root.navigator.wakeLock && !wachSperre) {
      root.navigator.wakeLock.request('screen').then(function (s) {
        wachSperre = s;
        s.addEventListener('release', function () { wachSperre = null; });
      }, function () { wachVideoStarten(); });
      return;
    }
    if (!root.navigator.wakeLock) { wachVideoStarten(); }
  }

  function wachVideoStarten() {
    if (!wachVideo) {
      wachVideo = document.createElement('video');
      wachVideo.src = 'img/wach.mp4';
      wachVideo.loop = true;
      wachVideo.muted = true;
      wachVideo.defaultMuted = true;
      wachVideo.setAttribute('playsinline', '');
      wachVideo.setAttribute('webkit-playsinline', '');
      wachVideo.setAttribute('aria-hidden', 'true');
      wachVideo.style.cssText =
        'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1';
      document.body.appendChild(wachVideo);
    }
    var p = wachVideo.play();
    if (p && p.catch) { p.catch(function () { /* dann bleibt der Bildschirm eben normal */ }); }
  }

  function wachSperreLoslassen() {
    if (wachSperre) { try { wachSperre.release(); } catch (e) { /* egal */ } wachSperre = null; }
    if (wachVideo) { try { wachVideo.pause(); } catch (e) { /* egal */ } }
  }

  /* Ein zuvor angemeldeter Service Worker wird abgemeldet — sonst haelt
   * er auf Geraeten, die die aeltere Fassung schon geoeffnet hatten, alte
   * Dateien fest. */
  if (root.navigator && root.navigator.serviceWorker &&
      root.navigator.serviceWorker.getRegistrations) {
    root.navigator.serviceWorker.getRegistrations().then(function (liste) {
      liste.forEach(function (r) { try { r.unregister(); } catch (e) { /* egal */ } });
    }, function () { /* egal */ });
  }


  root.KONTEXT = k;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})(typeof globalThis !== 'undefined' ? globalThis : this);
