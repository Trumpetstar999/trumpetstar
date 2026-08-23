/* app.js — Zusammenbau, Bildschirmwechsel, Geraeteeigenheiten.
 *
 * Zwei Bildschirme fuer das Kind (Auswahl und Uebung), ein versteckter
 * fuer die Eltern. Mehr nicht.
 */
(function (root) {
  'use strict';

  var BASIS = '/trompete/';
  var k = {};                       // gemeinsamer Kontext aller Module
  var aktuellesLevel = null;
  var level1 = null, level2 = null;
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
    Promise.all([jsonHolen(BASIS + 'data/toene.json'), jsonHolen(BASIS + 'data/lieder.json').catch(function () {
      return { lieder: [] };
    })]).then(function (teile) {
      aufbauen(teile[0], teile[1]);
    });
  }

  function aufbauen(daten, lieder) {
    k.toene = daten.toene;
    k.erkennung = daten.erkennung;
    k.lieder = lieder.lieder || [];
    k.tonKarte = {};
    k.toene.forEach(function (t) { k.tonKarte[t.id] = t; });

    k.tonById = function (id) { return k.tonKarte[id] || null; };
    k.einfachsteToene = function (n) {
      var folge = k.fortschritt ? k.fortschritt.reihenfolge() : k.toene.slice();
      return folge.slice(0, n).map(function (t) { return t.id; });
    };


    k.fortschritt = new root.Fortschritt({
      toene: k.toene,
      speicher: (function () { try { return root.localStorage; } catch (e) { return null; } })()
    });

    /* Die Frequenzen haengen an der Stimmung des Instruments: die
     * B-Trompete klingt zwei Halbtoene tiefer als notiert, die
     * C-Trompete wie notiert. Notenbild und Griffe bleiben gleich. */
    k.stimmungAnwenden = function () {
      var halbtoene = (k.fortschritt.stimmung() === 'C') ? 0 : -2;
      k.toene.forEach(function (t) {
        t.klingendMidi = t.notiertMidi + halbtoene;
        t.frequenzHz = Math.round(440 * Math.pow(2, (t.klingendMidi - 69) / 12) * 100) / 100;
      });
      if (k.tracker) { k.tracker.toleranzTabelle = k.tracker._toleranzenBerechnen(); }
    };

    k.motor = new root.Motor({ basis: BASIS, toene: k.toene, erkennung: k.erkennung });
    k.tracker = new root.Tracker({ toene: k.toene, erkennung: k.erkennung, logSekunden: 34 });
    k.stimmungAnwenden();

    k.noten = document.getElementById('noten');
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
      bilder: { froh: BASIS + 'img/vogel-froh.png', feder: BASIS + 'img/feder.png', lauscht: BASIS + 'img/vogel-lauscht.png' }
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

    level1 = new root.Level1(k);
    level2 = new root.Level2(k);
    k.level1 = level1; k.level2 = level2;
    k.auswahl = new root.Auswahl(k);
    k.eltern = new root.Eltern(k);

    tippBinden(document.getElementById('haus'), nachHause);
    tippBinden(k.spielknopf, spielTaste);
    tippBinden(k.modusMit, function () { if (level2.laeuft) { level2.setzeModus('mit'); } });
    tippBinden(k.modusSolo, function () { if (level2.laeuft) { level2.setzeModus('solo'); } });

    torVorbereiten();
    fensterEreignisse();
    dienstAnmelden();
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
    ['tor', 'auswahl', 'uebung', 'eltern', 'safarihinweis'].forEach(function (id) {
      document.getElementById(id).hidden = (id !== name);
    });
  }

  function levelStarten(level) {
    // Immer erst das laufende Level anhalten. Sonst laeuft dessen Wache
    // weiter und setzt mitten im neuen Level die Erkennung zurueck.
    if (level1.laeuft) { level1.beenden(); }
    if (level2.laeuft) { level2.beenden(); }
    aktuellesLevel = level;
    k.fortschritt.setzeLetztesLevel(level);
    var u = document.getElementById('uebung');
    u.classList.toggle('stufe1', level === '1');
    u.classList.toggle('stufe2', level !== '1');
    bildschirm('uebung');
    knopfBereit(false);
    zeigeModus(k.fortschritt.modus());
    masseNehmen(true);
    k.tracker.reset();
    k.motor.erkennungZuruecksetzen();
    if (level === '1') { level1.starten(); }
    else { k.tempo.setze(k.fortschritt.tempo(), true); level2.starten(level); }
  }

  /* Das Haus fuehrt IMMER zurueck — auch mitten in einer Rueckmeldung.
   * Und mit ihm verstummt alles: Metronom, Vorgespieltes, Lobmotiv.
   * Web Audio plant Klaenge im Voraus, deshalb genuegt es nicht, die
   * Uebung anzuhalten. */
  function nachHause() {
    if (level1.laeuft) { level1.beenden(); }
    if (level2.laeuft) { level2.beenden(); }
    k.rueckmeldung.abbrechen();
    k.motor.allesStoppen();
    k.tracker.reset();
    k.motor.erkennungZuruecksetzen();
    aktuellesLevel = null;
    knopfBereit(false);
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
    var quelle = BASIS + 'img/tier-' + ton.tier + '.png';
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
          aktion();
        }
        return;
      }
    });
    element.addEventListener('touchcancel', function () { id = null; });

    // Am Rechner (und fuer Hilfstechnik) weiterhin ueber click, aber
    // nicht doppelt, wenn der Browser nach touchend noch einen schickt.
    element.addEventListener('click', function () {
      if (Date.now() - ausTouch < 700) { return; }
      aktion();
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
    if (document.getElementById('uebung').hidden) { return; }
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
        }
      }
    });

    /* Weggelegt und zehn Minuten spaeter wieder da: die App friert ein,
     * statt weiterzulaufen. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (level1.laeuft) { level1.beenden(); }
        if (level2.laeuft) { level2.beenden(); }
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
      wachVideo.src = BASIS + 'img/wach.mp4';
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

  function dienstAnmelden() { /* in der React-Fassung uebernimmt Vite das Ausliefern */ }

  root.KONTEXT = k;
  root.TrompeteStart = start;
})(typeof globalThis !== 'undefined' ? globalThis : this);
