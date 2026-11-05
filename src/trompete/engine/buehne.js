/* buehne.js — haengt die Uebungen "Toene" und "Melodie" an ein Stueck
 * Seite, das React gezeichnet hat.
 *
 * In der Trompeten-App macht das app.js fuer den ganzen Bildschirm.
 * Hier ist es eine Komponente unter vielen, auf einer Seite, die einer
 * anderen App gehoert. Daraus folgen drei Regeln:
 *
 *   1. Alles wird INNERHALB der eigenen Wurzel gesucht, ueber
 *      data-tp="name" — nie ueber IDs. Die Seite drumherum darf
 *      Elemente haben, die "status" oder "noten" heissen.
 *   2. Klang und Mikrofon gibt es einmal fuer die ganze Seite. Wird die
 *      Uebung abgebaut, verstummt alles, und das Mikrofon geht aus —
 *      auch das rote Punkt-Symbol des Browsers verschwindet.
 *   3. Der Browser darf erst nach einem Tipp Ton machen und ins Mikrofon
 *      hoeren. Deshalb startet die Maschine beim ersten Druck auf Start.
 *
 * Die Uebungen selbst (level1.js, level2.js), die Tonerkennung, der Klang
 * und der Notensatz sind dieselben Dateien wie in der App.
 */
(function (root) {
  'use strict';

  var T = function (s, u, w) { return root.Sprachen.t(s, u, w); };

  /* ---------------------------------------------------------------- */
  /* Was es auf der Seite nur einmal gibt                              */
  /* ---------------------------------------------------------------- */

  var gemeinsam = null;

  function gemeinsamHolen(o) {
    if (gemeinsam) { return gemeinsam; }
    var daten = o.toene;
    var g = {
      toene: daten.toene,
      erkennung: daten.erkennung,
      stufen: (daten.schwierigkeit && daten.schwierigkeit.stufen) || {},
      lieder: (o.lieder && o.lieder.lieder) || [],
      tonKarte: {}
    };
    g.toene.forEach(function (t) { g.tonKarte[t.id] = t; });
    g.fortschritt = new root.Fortschritt({
      toene: g.toene,
      speicher: (function () { try { return root.localStorage; } catch (e) { return null; } })()
    });
    g.motor = new root.Motor({ toene: g.toene, erkennung: g.erkennung, basis: o.basis || '/trompete/' });
    g.tracker = new root.Tracker({
      toene: g.toene, hintergrund: g.toene, erkennung: g.erkennung, logSekunden: 40,
      schwierigkeit: g.stufen[g.fortschritt.schwierigkeit()] || g.stufen.mittel || {}
    });
    gemeinsam = g;
    return g;
  }

  /* Mikrofon an und aus. Die Analyse (der Worklet-Knoten) bleibt
   * bestehen: ein zweites Mal liesse sich der Prozessor gar nicht
   * anmelden. Ausgetauscht wird nur der Strom vom Mikrofon. */
  function mikrofonAn(motor, aufFrames) {
    motor.aufFrames = aufFrames;
    if (motor.mikrofonLaeuft) { return Promise.resolve(true); }
    if (!motor.knoten) { return motor.mikrofonStarten(aufFrames); }
    return root.navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false
    }).then(function (strom) {
      motor.strom = strom;
      motor.stromQuelle = motor.ctx.createMediaStreamSource(strom);
      motor.stromQuelle.connect(motor.knoten);
      motor.mikrofonLaeuft = true;
      return true;
    });
  }

  function mikrofonAus(motor) {
    if (motor.strom) {
      motor.strom.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* egal */ } });
    }
    if (motor.stromQuelle && motor.strom) {
      try { motor.stromQuelle.disconnect(); } catch (e) { /* egal */ }
      motor.stromQuelle = null;
    }
    motor.strom = null;
    motor.mikrofonLaeuft = false;
  }

  /* ---------------------------------------------------------------- */
  /* Eine Uebung an eine Wurzel haengen                                */
  /* ---------------------------------------------------------------- */

  /**
   * wurzel : das Element, das die Komponente gezeichnet hat
   * o      : { toene, lieder, basis, art: 'toene'|'melodie', takte: 2|4, sprache }
   * Liefert eine Steuerung: { starte(art, takte), einstellungenGeaendert(), loesen(), k }
   */
  function anbinden(wurzel, o) {
    var g = gemeinsamHolen(o);
    var k = {};
    var level1 = null, level2 = null;
    var aktuell = null;                  // '1' | '2a' | '2b'
    var gebunden = true;
    var wachSperre = null;

    function el(name) { return wurzel.querySelector('[data-tp="' + name + '"]'); }
    k.el = el;

    k.toene = g.toene;
    k.erkennung = g.erkennung;
    k.lieder = g.lieder;
    k.tonKarte = g.tonKarte;
    k.fortschritt = g.fortschritt;
    k.motor = g.motor;
    k.tracker = g.tracker;

    k.tonById = function (id) { return g.tonKarte[id] || null; };
    k.hoehe = function (id) { var t = g.tonKarte[id]; return t ? (t.wie || t.id) : id; };
    k.nachHoehe = function (ids) {
      return ids.slice().sort(function (a, b) {
        var x = g.tonKarte[a], y = g.tonKarte[b];
        return (x.notiertMidi - y.notiertMidi) || (x.stufe - y.stufe);
      });
    };
    k.schwierigkeit = function () {
      return g.stufen[g.fortschritt.schwierigkeit()] || g.stufen.mittel || {};
    };
    k.schwierigkeitAnwenden = function () { g.tracker.setzeSchwierigkeit(k.schwierigkeit()); };
    k.hoerenAuf = function (ids) {
      var liste = ids.map(k.tonById).filter(Boolean);
      if (liste.length) { g.tracker.setzeToene(liste); }
    };

    k.noten = el('noten');
    k.griff = el('griff');
    k.grifffeld = el('grifffeld');
    k.notenfeld = el('notenfeld');
    k.punkte = el('punkte');
    k.spielknopf = el('spielknopf');
    k.modusMit = el('modus-mit');
    k.modusSolo = el('modus-solo');
    k.buehne = el('buehne');
    k.statusFeld = el('status');

    k.rueckmeldung = new root.Rueckmeldung({ buehne: k.buehne, motor: g.motor, grifffeld: k.grifffeld });
    k.tempo = new root.Tempo({
      feld: el('tempofeld'), bahn: el('tempobahn'), griff: el('tempogriff'), zahl: el('tempozahl'),
      minus: el('tempo-minus'), plus: el('tempo-plus'), motor: g.motor,
      beiAenderung: function (bpm) { g.fortschritt.setzeTempo(bpm); }
    });
    k.tempo.setze(g.fortschritt.tempo(), true);

    k.status = function (text, art) {
      k.statusFeld.textContent = text || '';
      k.statusFeld.className = 'tp-status' + (art ? ' ' + art : '');
    };
    k.titel = function (text) { var t = el('titel'); if (t) { t.textContent = text || ''; } };
    k.knopfBereit = function (laeuft) {
      k.spielknopf.classList.toggle('laeuft', !!laeuft);
      k.spielknopf.classList.toggle('bereit', !laeuft);
      var text = laeuft ? T('leiste.stopp', 'Stopp') : T('leiste.start', 'Start');
      el('spieltext').textContent = text;
      k.spielknopf.setAttribute('aria-label', text);
    };
    k.zeigeModus = function (art) {
      if (!k.modusMit) { return; }
      k.modusMit.classList.toggle('an', art !== 'solo');
      k.modusSolo.classList.toggle('an', art === 'solo');
      k.modusMit.setAttribute('aria-pressed', art !== 'solo' ? 'true' : 'false');
      k.modusSolo.setAttribute('aria-pressed', art === 'solo' ? 'true' : 'false');
    };
    k.griffInWorten = function (ton) {
      var w = root.Griff.inWorten(ton);
      return w === '0' ? T('griff.offen', '0 (offen)') : w;
    };
    k.zeigeTon = function (ton) {
      if (!ton) { return; }
      el('tonname').textContent = root.Sprachen.ton(ton.id);
      el('ton-griff').textContent = T('griff.wort', 'Griff {g}', { g: k.griffInWorten(ton) });
      el('ton-klingt').textContent = T('klingt.wort', 'klingt {ton}', { ton: root.Sprachen.hoehe(ton.klingendMidi) });
      root.Griff.zeichne(k.griff, ton);
    };
    k.zeichneNote = function (melodie, einzelTon, markerIndex, haken, abweichung) {
      var b = k.notenfeld.clientWidth, h = k.notenfeld.clientHeight;
      if (!b || !h) { return null; }
      return root.Noten.zeichne(k.noten, {
        toene: g.tonKarte, melodie: melodie || null, einzelTon: einzelTon || null,
        breitePx: b, hoehePx: h,
        markerIndex: markerIndex === undefined ? -1 : markerIndex,
        haken: haken || null, abweichung: abweichung || null,
        violinschluessel: true, taktstriche: true, taktart: !!melodie,
        zaehlen: !!melodie && g.fortschritt.hilfe('zaehlen'),
        namen: (melodie && g.fortschritt.hilfe('namen')) ? root.Sprachen.ton : null
      });
    };
    k.notenfarbeAnwenden = function () {
      var schwarz = true;
      root.Noten.einfarbig(schwarz);
      root.Griff.einfarbig(schwarz);
      wurzel.classList.toggle('farbnoten', !schwarz);
    };

    /* Bekannte Stuecke zwischen den gewuerfelten Melodien — wie in der App. */
    k.liedZuMelodie = function (l) {
      var zaehler = l.zaehler || 4;
      var noten = [], takte = [], schlag = 0;
      l.takte.forEach(function (takt, ti) {
        var reihe = [], imTakt = 0;
        takt.forEach(function (eintrag) {
          var pause = eintrag[0] === null;
          var w = root.Generator.wertInfo(eintrag[1]);
          var n = { tonId: pause ? null : eintrag[0], wert: w.wert, punkt: w.punkt, pause: pause,
                    takt: ti, schlag: schlag, schlagImTakt: imTakt, dauer: w.dauer };
          reihe.push(n); noten.push(n);
          schlag += w.dauer; imTakt += w.dauer;
        });
        takte.push(reihe);
      });
      return { seed: l.id, stufe: l.stufe, istLied: true, name: l.name, takte: takte, noten: noten,
               zaehler: zaehler, schlaegeGesamt: takte.length * zaehler, vorrat: l.braucht.slice() };
    };
    k.liedFuer = function (stufe, vorrat) {
      var hoehen = vorrat.map(k.hoehe);
      var passend = g.lieder.filter(function (l) {
        return l.stufe === stufe && l.braucht.every(function (id) { return hoehen.indexOf(k.hoehe(id)) >= 0; });
      });
      if (!passend.length || Math.random() > 0.4) { return null; }
      return k.liedZuMelodie(passend[Math.floor(Math.random() * passend.length)]);
    };

    level1 = new root.Level1(k);
    level2 = new root.Level2(k);
    k.level1 = level1; k.level2 = level2;
    k.notenfarbeAnwenden();
    k.schwierigkeitAnwenden();

    /* ---- Mikrofon → Uebung ---- */
    function aufFrames(buf) {
      if (!gebunden) { return; }
      var ereignisse = g.tracker.feedKompakt(buf);
      if (aktuell === '1' && level1.laeuft) { level1.ereignisse(ereignisse, g.tracker.letzterFrame()); }
      else if (level2.laeuft && ereignisse.length) { level2.ereignisse(ereignisse); }
    }

    /* ---- Start und Stopp ---- */
    var startet = false;
    function spielTaste() {
      if (startet) { return; }
      /* Beim ersten Mal: Klang und Mikrofon einschalten. Das MUSS aus
       * dem Tipp heraus geschehen, sonst bleibt der Browser stumm. */
      if (!g.motor.bereit || !g.motor.mikrofonLaeuft) {
        startet = true;
        k.status(T('lov.startet', 'Einen Moment – Klang und Mikrofon werden eingeschaltet …'), 'aktiv');
        g.motor.starten().then(function () {
          if (!gebunden) { return false; }
          return mikrofonAn(g.motor, aufFrames).then(null, function () {
            /* Ohne Mikrofon geht es trotzdem weiter: vorspielen und
             * mitlesen kann die Uebung auch so. */
            k.status(T('lov.ohneMikro', 'Kein Zugriff auf das Mikrofon. Die Übung spielt vor, kann dich aber nicht hören – bitte das Mikrofon im Browser erlauben.'), 'achtung');
            return false;
          });
        }).then(function (mitMikro) {
          startet = false;
          if (!gebunden) { mikrofonAus(g.motor); g.motor.pausieren(); return; }
          wachHalten(true);
          g.tracker.reset();
          g.motor.erkennungZuruecksetzen();
          if (mitMikro !== false) { k.status(''); }
          drueckeStart();
        }, function () {
          startet = false;
          if (!gebunden) { return; }
          k.status(T('lov.ohneTon', 'Dieser Browser kann keinen Ton erzeugen.'), 'achtung');
        });
        return;
      }
      startet = true;
      g.motor.aufwecken().then(function () {
        startet = false;
        if (!gebunden) { return; }
        g.motor.aufFrames = aufFrames;
        drueckeStart();
      }, function () {
        startet = false;
        if (gebunden) { k.status(T('lov.ohneTon', 'Dieser Browser kann keinen Ton erzeugen.'), 'achtung'); }
      });
    }
    function drueckeStart() {
      var laeuft = k.spielknopf.classList.contains('laeuft');
      if (laeuft) { k.rueckmeldung.abbrechen(); }
      else if (k.rueckmeldung.laeuft) { return; }
      if (aktuell === '1') { if (laeuft) { level1.stop(); } else { level1.start(); } }
      else if (level2.laeuft) { if (laeuft) { level2.stop(); } else { level2.start(); } }
    }

    /* Nur der erste Finger zaehlt, ein aufliegender Handballen nicht —
     * wie in der App (siehe dort tippBinden). */
    var weg = [];
    function tipp(element, aktion) {
      if (!element) { return; }
      var id = null, x0 = 0, y0 = 0, seit = 0, ausTouch = 0;
      function an(typ, f, opt) { element.addEventListener(typ, f, opt); weg.push(function () { element.removeEventListener(typ, f, opt); }); }
      an('touchstart', function (e) {
        var t = e.changedTouches[0];
        if (id !== null && Date.now() - seit < 1200) { return; }
        id = t.identifier; x0 = t.clientX; y0 = t.clientY; seit = Date.now();
      }, { passive: true });
      an('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier !== id) { continue; }
          id = null;
          if (Math.abs(t.clientX - x0) < 44 && Math.abs(t.clientY - y0) < 44) {
            ausTouch = Date.now();
            e.preventDefault();
            aktion();
          }
          return;
        }
      });
      an('touchcancel', function () { id = null; });
      an('click', function () { if (Date.now() - ausTouch < 700) { return; } aktion(); });
    }

    tipp(k.spielknopf, spielTaste);
    tipp(k.modusMit, function () { if (level2.laeuft) { level2.setzeModus('mit', true); } });
    tipp(k.modusSolo, function () { if (level2.laeuft) { level2.setzeModus('solo', true); } });
    tipp(el('umblaettern'), function () { if (level2.laeuft) { level2.weiter(); } });
    ['namen', 'zaehlen'].forEach(function (name) {
      tipp(el('hilfe-' + name), function () {
        g.fortschritt.setzeHilfe(name, !g.fortschritt.hilfe(name));
        hilfenZeigen();
        if (level2.laeuft) { level2.neuZeichnen(); }
      });
    });

    function hilfenZeigen() {
      ['namen', 'zaehlen'].forEach(function (name) {
        var b = el('hilfe-' + name);
        if (!b) { return; }
        var an = g.fortschritt.hilfe(name);
        b.classList.toggle('an', an);
        b.setAttribute('aria-pressed', an ? 'true' : 'false');
      });
    }

    /* ---- Groesse: das Notenblatt richtet sich nach seinem Feld ---- */
    var masse = { b: 0, h: 0 };
    function neuZeichnen() {
      if (!gebunden) { return; }
      var b = k.notenfeld.clientWidth, h = k.notenfeld.clientHeight;
      if (b === masse.b && h === masse.h) { return; }
      masse = { b: b, h: h };
      if (aktuell === '1' && level1.zielTon) { k.zeichneNote(null, level1.zielTon, -1); }
      else if (level2.melodie) { level2.neuZeichnen(); }
    }
    var beobachter = root.ResizeObserver ? new root.ResizeObserver(function () { neuZeichnen(); }) : null;
    if (beobachter) { beobachter.observe(k.notenfeld); }

    /* ---- Weggelegt: anhalten ---- */
    function sichtbarkeit() {
      if (document.hidden) { anhalten(); g.motor.pausieren(); wachHalten(false); }
    }
    document.addEventListener('visibilitychange', sichtbarkeit);

    /* Beim Ueben liegen die Haende am Instrument, nicht am Geraet. */
    function wachHalten(an) {
      if (an && root.navigator.wakeLock && !wachSperre) {
        root.navigator.wakeLock.request('screen').then(function (s) { if (!gebunden) { s.release(); return; } wachSperre = s; }, function () { /* egal */ });
      } else if (!an && wachSperre) {
        try { wachSperre.release(); } catch (e) { /* egal */ }
        wachSperre = null;
      }
    }

    function anhalten() {
      if (level1.laeuft && level1.spielt) { level1.stop(); }
      if (level2.laeuft && k.spielknopf.classList.contains('laeuft')) { level2.stop(); }
      k.rueckmeldung.abbrechen();
      g.motor.allesStoppen();
    }

    /** Eine Uebung aufschlagen: 'toene', oder 'melodie' mit 2 oder 4 Takten. */
    function starte(art, takte) {
      if (level1.laeuft) { level1.beenden(); }
      if (level2.laeuft) { level2.beenden(); }
      k.rueckmeldung.abbrechen();
      g.motor.allesStoppen();
      aktuell = art === 'toene' ? '1' : (takte === 4 ? '2b' : '2a');
      g.fortschritt.setzeBereich(aktuell);
      g.fortschritt.setzeLetztesLevel(aktuell);
      wurzel.setAttribute('data-art', art === 'toene' ? 'toene' : 'melodie');
      hilfenZeigen();
      k.knopfBereit(false);
      k.status('');
      k.zeigeModus(g.fortschritt.modus());
      g.tracker.reset();
      g.motor.erkennungZuruecksetzen();
      masse = { b: k.notenfeld.clientWidth, h: k.notenfeld.clientHeight };
      if (aktuell === '1') { level1.starten(); }
      else {
        k.tempo.setze(g.fortschritt.tempo(), true);
        level2.starten(aktuell);
      }
    }

    /** Nach einer Aenderung im Einstellungsmenue: alles neu anwenden und
     *  die Uebung mit dem neuen Material neu aufschlagen. */
    function einstellungenGeaendert() {
      k.schwierigkeitAnwenden();
      k.notenfarbeAnwenden();
      hilfenZeigen();
      if (aktuell === '1') { starte('toene'); }
      else if (aktuell) { starte('melodie', aktuell === '2b' ? 4 : 2); }
    }

    /** Abbauen: alles verstummt, das Mikrofon geht aus. */
    function loesen() {
      gebunden = false;
      if (level1.laeuft) { level1.beenden(); }
      if (level2.laeuft) { level2.beenden(); }
      k.rueckmeldung.abbrechen();
      g.motor.allesStoppen();
      if (g.motor.aufFrames === aufFrames) { g.motor.aufFrames = null; }
      mikrofonAus(g.motor);
      g.motor.pausieren();
      wachHalten(false);
      if (beobachter) { beobachter.disconnect(); }
      document.removeEventListener('visibilitychange', sichtbarkeit);
      if (k.tempo._loesen) { k.tempo._loesen(); }
      weg.forEach(function (f) { f(); });
      weg = [];
    }

    var steuerung = { starte: starte, anhalten: anhalten, einstellungenGeaendert: einstellungenGeaendert,
                      loesen: loesen, k: k };
    anbinden.zuletzt = steuerung;      // fuer die Fehlersuche in der Konsole
    return steuerung;
  }

  /** Die Toene einer Tonart zwischen zwei Tonhoehen (notiert, MIDI) — fuer
   *  das Einstellungsmenue. Dieselbe Rechnung wie in den Einstellungen
   *  der App. */
  function tonartToene(toene, tonartId, vonMidi, bisMidi) {
    return root.Einstellungen.prototype.tonartToene.call({ k: { toene: toene } }, tonartId, vonMidi, bisMidi);
  }

  root.TrompeteBuehne = {
    anbinden: anbinden,
    gemeinsam: function (o) { return gemeinsamHolen(o); },
    tonartToene: tonartToene
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
