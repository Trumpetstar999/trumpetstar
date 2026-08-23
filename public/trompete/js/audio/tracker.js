/* tracker.js — fuehrt die beiden DSP-Stroeme zu musikalischen Ereignissen
 * zusammen. Kennt keine Grafik und kein Web Audio; laeuft in Node.
 *
 * TROMPETE statt Blockfloete. Zwei Dinge sind hier anders:
 *
 * 1. Es gibt keine Oktave zum "Ueberblasen". An ihre Stelle tritt der
 *    NATURTON: mehrere Toene teilen sich denselben Griff und werden nur
 *    durch die Lippenspannung getrennt (offen = c1, g1, c2; Ventil 1 =
 *    f1, d2; Ventil 1+2 = e1, a1). Wer den richtigen Griff hat, aber den
 *    falschen Naturton trifft, hat NICHT den falschen Ton gegriffen —
 *    das ist ein Ansatzfehler und wird sanft zurueckgemeldet, nie als
 *    Fehler gezaehlt. Das ist der haeufigste Anfaengerfehler ueberhaupt.
 *
 * 2. Der Klangbereich liegt eine Oktave tiefer (233 bis 523 Hz).
 *
 * Wichtig zur Toleranz:
 * h1 und c2 liegen nur einen Halbton (100 Cent) auseinander. Eine starre
 * Toleranz von +/-80 Cent in beide Richtungen wuerde beide Toene
 * ueberlappen lassen — dann waere ein sauber gespieltes c2 gleichzeitig
 * ein gueltiges h1. Deshalb gilt die Toleranz RICHTUNGSABHAENGIG:
 * +/-80 Cent, aber nie ueber die Mitte zum Nachbarton hinaus.
 *
 *   g1  runter 80 / hoch 80     (Nachbar a1 ist 200 Cent entfernt)
 *   a1  runter 80 / hoch 80
 *   h1  runter 80 / hoch 50     (c2 ist nur 100 Cent hoeher)
 *   c2  runter 50 / hoch 80
 *   d2  runter 80 / hoch 80
 *
 * Das um 80 Cent zu tief geblasene h1 aus Auftrag 19 bleibt damit exakt
 * ein Treffer — und genau das ist auch die Richtung, in die eine kalte
 * Floete und ein zu schwacher Atem abweichen.
 */
(function (root, factory) {
  var T = factory(root.DSP || (typeof require === 'function' ? require('./dsp.js') : null));
  if (typeof module === 'object' && module.exports) { module.exports = T; }
  root.Tracker = T;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DSP) {
  'use strict';

  var cents = DSP.centsBetween;
  // Randfaelle wie "genau 80 Cent zu tief" muessen sicher als Treffer gelten.
  var EPS = 1e-6;

  function Tracker(config) {
    this.toene = config.toene;                 // Array aus toene.json
    this.opt = config.erkennung;
    this.hopDauer = config.hopDauer || (128 / 48000);
    this.toleranzTabelle = this._toleranzenBerechnen();

    /* Ringpuffer klassifizierter Frames. Er muss eine ganze Uebung
     * fassen: vier Takte bei 60 BPM sind 16 Sekunden, dazu Vorzaehler
     * und Rand. Die Objekte werden EINMAL angelegt und danach nur noch
     * ueberschrieben — auf einem alten iPad ist die vermiedene
     * Speicherbereinigung mehr wert als der gesparte Speicher. */
    this.logSekunden = config.logSekunden || 30;
    this.maxLog = Math.ceil(this.logSekunden / this.hopDauer);
    this.logRing = new Array(this.maxLog);
    this.logPos = 0;
    this.lauf = null;           // aktueller stabiler Tonlauf
    this.laufGemeldet = false;
    this.laufKurzGemeldet = false;
    /* Zwei Schwellen: 'stabil' nach stabilMs (Level 1 bewertet damit
     * einen einzelnen gehaltenen Ton), 'kurz' schon nach kurzMs — das
     * braucht Level 2, wo eine Viertelnote bei 100 BPM nur 600 ms
     * dauert und die Rueckmeldung trotzdem sofort kommen soll. */
    this.kurzMs = this.opt.kurzMs != null ? this.opt.kurzMs : 150;
    this.letzterPegelT = -1;
    this.events = [];
  }

  /* --------------------------------------------------------------- */
  /* Tonzuordnung                                                     */
  /* --------------------------------------------------------------- */

  /** Richtungsabhaengige Toleranz je Ton: nie ueber die Mitte zum
   *  Nachbarton hinaus, hoechstens aber die konfigurierte Toleranz. */
  Tracker.prototype._toleranzenBerechnen = function () {
    var max = this.opt.toleranzCent;
    var sortiert = this.toene.slice().sort(function (a, b) {
      return a.frequenzHz - b.frequenzHz;
    });
    var tab = {};
    for (var i = 0; i < sortiert.length; i++) {
      var runter = max, hoch = max;
      if (i > 0) {
        runter = Math.min(max, Math.abs(cents(sortiert[i - 1].frequenzHz, sortiert[i].frequenzHz)) / 2);
      }
      if (i < sortiert.length - 1) {
        hoch = Math.min(max, Math.abs(cents(sortiert[i + 1].frequenzHz, sortiert[i].frequenzHz)) / 2);
      }
      tab[sortiert[i].id] = { runter: runter, hoch: hoch };
    }
    return tab;
  };

  /** Passt `abweichungCent` noch in die Toleranz von `tonId`? */
  Tracker.prototype.imFenster = function (tonId, abweichungCent, faktor) {
    var t = this.toleranzTabelle[tonId];
    if (!t) { return false; }
    var grenze = abweichungCent < 0 ? t.runter : t.hoch;
    return Math.abs(abweichungCent) <= grenze * (faktor || 1) + EPS;
  };

  /** Naechstliegender bekannter Ton zu einer Frequenz.
   *
   *  Anders als bei der Blockfloete gibt es hier keine Oktavvariante:
   *  jeder Naturton ist ein eigener notierter Ton mit eigener Lage im
   *  System. Das Feld oktave bleibt aus Kompatibilitaet erhalten und ist
   *  immer 0. */
  Tracker.prototype.klassifiziere = function (freq) {
    if (!freq) { return null; }
    var best = null;
    for (var i = 0; i < this.toene.length; i++) {
      var c = cents(freq, this.toene[i].frequenzHz);
      if (this.imFenster(this.toene[i].id, c) &&
          (!best || Math.abs(c) < Math.abs(best.cents))) {
        best = { tonId: this.toene[i].id, oktave: 0, cents: c, ton: this.toene[i] };
      }
    }
    return best;
  };

  /** Haben zwei Toene denselben Griff? */
  Tracker.prototype.gleicherGriff = function (a, b) {
    if (!a || !b || !a.griff || !b.griff) { return false; }
    return a.griff.ventile.join('') === b.griff.ventile.join('');
  };

  /** Liegt die Frequenz auf einem Naturton derselben Rohrlaenge wie der
   *  Zielton — also bei richtigem Griff, aber falscher Lippenspannung?
   *  Auch dann, wenn dieser Naturton gar nicht im Tonvorrat steht. */
  Tracker.prototype.istNaturtonVon = function (freq, ziel) {
    if (!ziel || !ziel.naturton) { return 0; }
    var grundton = ziel.frequenzHz / ziel.naturton;      // Rohrlaenge
    for (var n = 2; n <= 6; n++) {
      if (n === ziel.naturton) { continue; }
      if (Math.abs(cents(freq, grundton * n)) <= this.opt.toleranzCent + EPS) { return n; }
    }
    return 0;
  };

  /** Zielbezogene Pruefung.
   *  Liefert 'treffer' | 'naturton' | 'anderer' | 'nichts'.
   *
   *  Reihenfolge mit Bedacht:
   *    1. Sitzt der Zielton?
   *    2. Ist es ein anderer bekannter Ton MIT ANDEREM GRIFF? Dann wurde
   *       wirklich falsch gegriffen.
   *    3. Sonst: liegt es auf einem Naturton derselben Rohrlaenge? Dann
   *       stimmt der Griff und nur die Lippen sind daneben. Das ist kein
   *       Fehler, sondern ein Hinweis.
   */
  Tracker.prototype.pruefeZiel = function (freq, zielId) {
    if (!freq) { return { art: 'nichts' }; }
    var ziel = this.tonById(zielId);
    if (!ziel) { return { art: 'nichts' }; }

    var c = cents(freq, ziel.frequenzHz);
    if (this.imFenster(zielId, c)) { return { art: 'treffer', cents: c }; }

    var k = this.klassifiziere(freq);
    if (k && k.tonId !== zielId) {
      var anderer = this.tonById(k.tonId);
      if (this.gleicherGriff(ziel, anderer)) {
        return { art: 'naturton', tonId: k.tonId, cents: k.cents, imVorrat: true };
      }
      return { art: 'anderer', tonId: k.tonId, oktave: 0, cents: k.cents };
    }

    var n = this.istNaturtonVon(freq, ziel);
    if (n) { return { art: 'naturton', naturton: n, imVorrat: false }; }

    var nah = this.naechsterTon(freq);
    if (nah) { return { art: 'anderer', tonId: nah.tonId, oktave: 0, cents: nah.cents }; }
    return { art: 'nichts' };
  };

  /** Naechster Ton ohne jede Toleranzgrenze — damit ein deutlich
   *  danebenliegender Ton trotzdem als "falscher Ton" (und nicht als
   *  "nichts gehoert") zurueckgemeldet werden kann. */
  Tracker.prototype.naechsterTon = function (freq) {
    if (!freq) { return null; }
    var best = null;
    for (var i = 0; i < this.toene.length; i++) {
      var c = cents(freq, this.toene[i].frequenzHz);
      if (!best || Math.abs(c) < Math.abs(best.cents)) {
        best = { tonId: this.toene[i].id, oktave: 0, cents: c, ton: this.toene[i] };
      }
    }
    return best;
  };

  Tracker.prototype.tonById = function (id) {
    for (var i = 0; i < this.toene.length; i++) {
      if (this.toene[i].id === id) { return this.toene[i]; }
    }
    return null;
  };

  /* --------------------------------------------------------------- */
  /* Frame-Verarbeitung                                                */
  /* --------------------------------------------------------------- */

  Tracker.prototype.feed = function (frames) {
    for (var i = 0; i < frames.length; i++) {
      this._frame(frames[i]);
    }
    var ev = this.events;
    this.events = [];
    return ev;
  };

  /** Kompakter Weg: liest direkt aus dem Float32Array des Analyzers,
   *  ohne fuer jeden Frame ein Objekt anzulegen. */
  Tracker.prototype.feedKompakt = function (buf) {
    if (!buf) { var leer = this.events; this.events = []; return leer; }
    var FELDER = DSP.Analyzer.FELDER;
    var n = buf.length / FELDER;
    var s = this._scratch || (this._scratch = {});
    for (var i = 0; i < n; i++) {
      var o = i * FELDER;
      s.t = buf[o + DSP.Analyzer.F_T];
      s.db = buf[o + DSP.Analyzer.F_DB];
      s.freq = buf[o + DSP.Analyzer.F_FREQ];
      s.clarity = buf[o + DSP.Analyzer.F_CLARITY];
      s.above = buf[o + DSP.Analyzer.F_ABOVE] > 0.5;
      s.gateDb = buf[o + DSP.Analyzer.F_GATE];
      s.noiseFloorDb = buf[o + DSP.Analyzer.F_NOISE];
      s.onsetT = buf[o + DSP.Analyzer.F_ONSET_T];
      this._frameKompakt(s);
    }
    var ev = this.events;
    this.events = [];
    return ev;
  };

  Tracker.prototype._frame = function (f) {
    this._scratch2 = this._scratch2 || {};
    var s = this._scratch2;
    s.t = f.t; s.db = f.db; s.freq = f.freq; s.clarity = f.clarity;
    s.above = f.above; s.gateDb = f.gateDb; s.noiseFloorDb = f.noiseFloorDb;
    s.onsetT = f.onset ? f.onset.t : -1e9;
    this._frameKompakt(s);
  };

  Tracker.prototype._frameKompakt = function (f) {
    var gueltig = f.above && f.clarity >= this.opt.clarityMin && f.freq > 0;
    var k = gueltig ? this.klassifiziere(f.freq) : null;
    var platz = this.logPos % this.maxLog;
    var eintrag = this.logRing[platz] || (this.logRing[platz] = {});
    eintrag.t = f.t; eintrag.db = f.db; eintrag.freq = f.freq;
    eintrag.clarity = f.clarity; eintrag.above = f.above;
    eintrag.klasse = k ? (k.tonId + (k.oktave ? '+8' : '')) : null;
    eintrag.tonId = k ? k.tonId : null;
    eintrag.oktave = k ? k.oktave : 0;
    eintrag.onsetT = f.onsetT;
    eintrag.gateDb = f.gateDb;
    eintrag.noiseFloorDb = f.noiseFloorDb;
    this.logPos++;

    if (f.onsetT > -1e8) { this.events.push({ typ: 'einsatz', t: f.onsetT }); }
    if (f.above) { this.letzterPegelT = f.t; }

    /* stabiler Tonlauf --------------------------------------------- */
    if (eintrag.klasse) {
      if (this.lauf && this.lauf.klasse === eintrag.klasse) {
        this.lauf.tEnde = f.t;
        this.lauf.frames++;
        this.lauf.freqSumme += f.freq;
        if (!this.laufKurzGemeldet &&
            (this.lauf.tEnde - this.lauf.tStart) * 1000 >= this.kurzMs) {
          this.laufKurzGemeldet = true;
          this.events.push({
            typ: 'kurz',
            tonId: this.lauf.tonId,
            oktave: this.lauf.oktave,
            t: this.lauf.tStart,
            laufNr: this.lauf.nr,
            freq: this.lauf.freqSumme / this.lauf.frames
          });
        }
        if (!this.laufGemeldet &&
            (this.lauf.tEnde - this.lauf.tStart) * 1000 >= this.opt.stabilMs) {
          this.laufGemeldet = true;
          this.events.push({
            typ: 'stabil',
            tonId: this.lauf.tonId,
            oktave: this.lauf.oktave,
            t: this.lauf.tStart,
            freq: this.lauf.freqSumme / this.lauf.frames
          });
        }
      } else {
        this._laufSchliessen();
        this.laufZaehler = (this.laufZaehler || 0) + 1;
        this.lauf = {
          klasse: eintrag.klasse, tonId: eintrag.tonId, oktave: eintrag.oktave,
          tStart: f.t, tEnde: f.t, frames: 1, freqSumme: f.freq,
          nr: this.laufZaehler
        };
        this.laufGemeldet = false;
        this.laufKurzGemeldet = false;
      }
    } else if (this.lauf) {
      // Kurze Aussetzer (ein bis zwei Frames) nicht als Tonwechsel werten
      this.lauf.luecke = (this.lauf.luecke || 0) + 1;
      if (this.lauf.luecke > 3) { this._laufSchliessen(); }
    }
  };

  Tracker.prototype._laufSchliessen = function () {
    if (this.lauf && this.laufGemeldet) {
      this.events.push({
        typ: 'ende', tonId: this.lauf.tonId, oktave: this.lauf.oktave,
        tStart: this.lauf.tStart, tEnde: this.lauf.tEnde
      });
    }
    this.lauf = null;
    this.laufGemeldet = false;
  };

  /** Alle gespeicherten Frames in zeitlicher Reihenfolge. */
  Tracker.prototype.frames = function () {
    var n = Math.min(this.logPos, this.maxLog);
    var start = this.logPos - n;
    var out = new Array(n);
    for (var i = 0; i < n; i++) { out[i] = this.logRing[(start + i) % this.maxLog]; }
    return out;
  };

  /** Frames in einem Zeitfenster, ohne die ganze Liste zu kopieren. */
  Tracker.prototype._imFenster = function (tVon, tBis) {
    var n = Math.min(this.logPos, this.maxLog);
    var start = this.logPos - n;
    var out = [];
    for (var i = 0; i < n; i++) {
      var f = this.logRing[(start + i) % this.maxLog];
      if (f.t >= tVon && f.t <= tBis) { out.push(f); }
    }
    return out;
  };

  /** Was gerade klingt — oder null. Wird gebraucht, um einen Einsatz
   *  zu deuten, der mitten in einem laufenden Ton kommt: ein
   *  Zungenstoss auf derselben Tonhoehe reisst den Tonlauf nicht ab,
   *  ist aber trotzdem eine neue Note. */
  Tracker.prototype.aktuelleKlasse = function () {
    if (!this.lauf) { return null; }
    return { tonId: this.lauf.tonId, oktave: this.lauf.oktave, nr: this.lauf.nr };
  };

  Tracker.prototype.reset = function () {
    this.logPos = 0;
    this.lauf = null;
    this.laufGemeldet = false;
    this.laufKurzGemeldet = false;
    this.events.length = 0;
  };

  /* --------------------------------------------------------------- */
  /* Notenextraktion fuer Level 2                                      */
  /* --------------------------------------------------------------- */
  /* Grenzen entstehen aus zwei Quellen: Einsaetzen (Energieanstieg)
   * und Tonhoehenwechseln. Zwei gleiche Toene hintereinander werden nur
   * getrennt, wenn dazwischen ein Amplitudeneinbruch von mindestens
   * `wiederholungEinbruchDb` messbar ist (Auftrag 8.4).               */

  Tracker.prototype.extrahiereNoten = function (t0, t1, opts) {
    opts = opts || {};
    var minDauer = (opts.minDauerMs || 90) / 1000;
    var verschmelzen = (opts.verschmelzenMs || 80) / 1000;
    var i, f;
    var von = this._imFenster(t0 - 0.30, t1 + 0.60);
    var grenzen = [];
    if (!von.length) { return []; }

    // 1) Einsaetze
    for (i = 0; i < von.length; i++) {
      if (von[i].onsetT > -1e8) { grenzen.push({ t: von[i].onsetT, quelle: 'einsatz' }); }
    }
    // 2) Tonhoehenwechsel (mit Hysterese: 2 Frames derselben neuen Klasse)
    var aktuell = null, kandidat = null, kandidatZahl = 0, kandidatT = 0;
    for (i = 0; i < von.length; i++) {
      f = von[i];
      if (!f.klasse) { continue; }
      if (f.klasse === aktuell) { kandidat = null; kandidatZahl = 0; continue; }
      if (f.klasse === kandidat) {
        kandidatZahl++;
        if (kandidatZahl >= 2) {
          if (aktuell !== null) { grenzen.push({ t: kandidatT, quelle: 'wechsel' }); }
          aktuell = kandidat; kandidat = null; kandidatZahl = 0;
        }
      } else { kandidat = f.klasse; kandidatZahl = 1; kandidatT = f.t; }
    }
    // 3) erster Klang ueberhaupt ist immer eine Grenze
    for (i = 0; i < von.length; i++) {
      if (von[i].klasse) { grenzen.push({ t: von[i].t, quelle: 'start' }); break; }
    }

    grenzen.sort(function (a, b) { return a.t - b.t; });
    var sauber = [];
    for (i = 0; i < grenzen.length; i++) {
      if (!sauber.length || grenzen[i].t - sauber[sauber.length - 1].t > verschmelzen) {
        sauber.push(grenzen[i]);
      } else if (grenzen[i].quelle === 'einsatz') {
        sauber[sauber.length - 1] = grenzen[i];   // Einsatz schlaegt Wechsel
      }
    }

    // Segmente bilden
    var noten = [];
    for (i = 0; i < sauber.length; i++) {
      var a = sauber[i].t;
      var b = (i + 1 < sauber.length) ? sauber[i + 1].t : (t1 + 0.60);
      var zaehler = {}, n = 0, dbMax = -999, freqS = 0, tLetzt = a;
      for (var j = 0; j < von.length; j++) {
        f = von[j];
        if (f.t < a || f.t >= b) { continue; }
        if (f.db > dbMax) { dbMax = f.db; }
        if (f.klasse) {
          zaehler[f.klasse] = (zaehler[f.klasse] || 0) + 1;
          n++; freqS += f.freq; tLetzt = f.t;
        }
      }
      if (!n) { continue; }
      var besteKlasse = null, besteZahl = 0;
      for (var kl in zaehler) {
        if (zaehler[kl] > besteZahl) { besteZahl = zaehler[kl]; besteKlasse = kl; }
      }
      if (tLetzt - a < minDauer) { continue; }
      var teile = besteKlasse.split('+');
      noten.push({
        tonId: teile[0], oktave: teile.length > 1 ? 1 : 0,
        tStart: a, tEnde: tLetzt, dbMax: dbMax,
        freq: freqS / n, quelle: sauber[i].quelle
      });
    }

    // Gleiche Toene ohne ausreichenden Einbruch wieder verschmelzen
    var einbruchNoetig = this.opt.wiederholungEinbruchDb;
    var zusammen = [];
    for (i = 0; i < noten.length; i++) {
      var vorher = zusammen[zusammen.length - 1];
      if (vorher && vorher.tonId === noten[i].tonId && vorher.oktave === noten[i].oktave) {
        var tief = this._minDbZwischen(vorher.tEnde, noten[i].tStart, vorher.tEnde);
        var einbruch = Math.min(vorher.dbMax, noten[i].dbMax) - tief;
        if (einbruch < einbruchNoetig) {
          vorher.tEnde = noten[i].tEnde;
          vorher.dbMax = Math.max(vorher.dbMax, noten[i].dbMax);
          continue;
        }
      }
      zusammen.push(noten[i]);
    }
    return zusammen;
  };

  Tracker.prototype._minDbZwischen = function (ta, tb) {
    var im = this._imFenster(ta - 0.02, tb + 0.02);
    var min = Infinity;
    for (var i = 0; i < im.length; i++) { if (im[i].db < min) { min = im[i].db; } }
    return isFinite(min) ? min : -999;
  };

  return Tracker;
});
