/* tracker.js — fuehrt die beiden DSP-Stroeme zu musikalischen Ereignissen
 * zusammen. Kennt keine Grafik und kein Web Audio; laeuft in Node.
 *
 * Wichtig zur Toleranz:
 * e1 und f1 liegen nur einen Halbton (100 Cent) auseinander, h1 und c2
 * ebenso. Eine starre Toleranz von +/-80 Cent in beide Richtungen wuerde
 * beide Toene ueberlappen lassen — dann waere ein sauber gespieltes f1
 * gleichzeitig ein gueltiges e1. Deshalb gilt die Toleranz
 * RICHTUNGSABHAENGIG: +/-80 Cent, aber nie ueber die Mitte zum
 * Nachbarton hinaus.
 *
 *   d1  runter 80 / hoch 80     (Nachbar e1 ist 200 Cent entfernt)
 *   e1  runter 80 / hoch 50     (f1 ist nur 100 Cent hoeher)
 *   f1  runter 50 / hoch 80
 *   h1  runter 80 / hoch 50     (c2 ist nur 100 Cent hoeher)
 *   c2  runter 50 / hoch 80
 *
 * Ein um 80 Cent zu tief geblasener Ton bleibt damit ein Treffer — und
 * genau das ist die Richtung, in die eine kalte Trompete und ein noch
 * unsicherer Ansatz abweichen.
 *
 * Wichtig zum falschen Naturton:
 * Bei der Blockfloete war der typische Fehlgriff das Ueberblasen in die
 * Oktave — ein fester Faktor 2. Auf der Trompete gehoert zu jedem Griff
 * eine ganze Naturtonreihe: mit demselben Griff und etwas mehr
 * Lippenspannung kommt der naechste Teilton. Wie weit der entfernt ist,
 * haengt davon ab, auf welchem Teilton der Ton liegt — vom 2. zum 3. ist
 * es eine Quinte, vom 3. zum 4. eine Quarte, vom 4. zum 5. eine grosse
 * Terz. Deshalb steht in toene.json bei jedem Ton seine Teiltonnummer,
 * und der Abstand wird daraus gerechnet statt fest verdrahtet.
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
    this.teiltonTabelle = this._teiltoeneBerechnen();

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
    if (config.schwierigkeit) { this.setzeSchwierigkeit(config.schwierigkeit); }
  }

  /** Stellt ein, wie streng zugehoert wird.
   *
   *  `werte` ist eine der Stufen aus toene.json — die Felder, die dort
   *  fehlen, bleiben unveraendert. Danach werden BEIDE Toleranztabellen
   *  neu gerechnet: sie haengen an toleranzCent und stehen sonst noch
   *  auf der alten Strenge, waehrend alles andere schon umgestellt ist.
   *  Genau das ist der Fehler, den man hier einmal macht. */
  Tracker.prototype.setzeSchwierigkeit = function (werte) {
    if (!werte) { return; }
    if (werte.toleranzCent != null) { this.opt.toleranzCent = werte.toleranzCent; }
    if (werte.clarityMin != null) { this.opt.clarityMin = werte.clarityMin; }
    if (werte.stabilMs != null) { this.opt.stabilMs = werte.stabilMs; }
    if (werte.kurzMs != null) { this.kurzMs = werte.kurzMs; }
    this.toleranzTabelle = this._toleranzenBerechnen();
    this.teiltonTabelle = this._teiltoeneBerechnen();
  };

  /** Welche Toene erkannt werden.
   *
   *  Level 1 bis 3 kennen die neun Toene von c1 bis d2. Ein Stueck aus
   *  dem Buch bringt dazu seine eigenen mit: fis1, b1, e2. Beide
   *  Toleranztabellen haengen an den Nachbartoenen und werden deshalb
   *  neu gerechnet — mit fis1 im Vorrat darf f1 nicht mehr bis zur Mitte
   *  nach g1 reichen, sonst ginge ein vergessenes Kreuz als Treffer
   *  durch. */
  Tracker.prototype.setzeToene = function (toene) {
    this.toene = toene;
    this.toleranzTabelle = this._toleranzenBerechnen();
    this.teiltonTabelle = this._teiltoeneBerechnen();
  };

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

  /** Nachbarteilton je Ton: Frequenz und die Toleranz, die dort gilt.
   *
   *  Die Toleranz muss geklammert werden, und zwar aus demselben Grund
   *  wie bei den Toenen selbst: der Nachbarteilton liegt auf der
   *  Trompete nicht mehr eine ganze Oktave von allem entfernt. Der
   *  Nachbarteilton von a1 (490 Hz) liegt nur 86 Cent neben c2
   *  (466 Hz). Mit den vollen 90 Cent Toleranz waere ein sauber
   *  gespieltes c2 gleichzeitig ein verungluecktes a1 — und bekaeme in
   *  Level 2 nie sein Haekchen.
   *
   *  Nicht mitgezaehlt werden dabei Toene, die MIT dem Nachbarteilton
   *  zusammenfallen: der Nachbarteilton von c1 IST g1, weil beide
   *  offen gegriffen werden. Genau dieser Fall soll ja als falscher
   *  Teilton gelten, er darf sich die Toleranz nicht selbst wegnehmen. */
  var GLEICH_CENT = 20;

  Tracker.prototype._teiltoeneBerechnen = function () {
    var max = this.opt.ueberblasenToleranzCent;
    var tab = {};
    for (var i = 0; i < this.toene.length; i++) {
      var ton = this.toene[i];
      var fp = this.teiltonHoeher(ton);
      var grenze = max;
      for (var j = 0; j < this.toene.length; j++) {
        var d = Math.abs(cents(this.toene[j].frequenzHz, fp));
        if (d <= GLEICH_CENT) { continue; }      // das IST der Nachbarteilton
        if (d / 2 < grenze) { grenze = d / 2; }
      }
      tab[ton.id] = { freq: fp, toleranz: grenze };
    }
    return tab;
  };

  /** Passt `freq` zum Nachbarteilton von `tonId`? */
  Tracker.prototype.imTeiltonFenster = function (tonId, freq) {
    var e = this.teiltonTabelle[tonId];
    if (!e) { return false; }
    return Math.abs(cents(freq, e.freq)) <= e.toleranz + EPS;
  };

  /** Die Frequenz, die DERSELBE Griff einen Teilton hoeher ergibt.
   *
   *  Das ist auf der Trompete das Gegenstueck zum Ueberblasen der
   *  Blockfloete: richtig gegriffen, zu viel Lippenspannung. Ohne
   *  Teiltonangabe faellt die Rechnung auf die Oktave zurueck — dann
   *  verhaelt sich der Tracker genau wie die Blockfloetenfassung.
   *
   *  Nach UNTEN wird bewusst nicht geprueft. Der zu tiefe Teilton fuehrt
   *  zur selben Rueckmeldung wie ein falscher Ton — der richtige Ton
   *  leuchtet auf und erklingt — und das ist dort auch die richtige
   *  Hilfe. Die Feder, die "sanfter blasen" heisst, waere fuer einen zu
   *  tiefen Ton schlicht der falsche Rat. */
  Tracker.prototype.teiltonHoeher = function (ton) {
    var n = ton.teilton;
    if (!n || n < 1) { return ton.frequenzHz * 2; }
    return ton.frequenzHz * (n + 1) / n;
  };

  /** Naechstliegender Ton zu einer Frequenz — fuer die Mikrofon-
   *  Testansicht im Eltern-Bereich und fuer "welcher Ton war es denn?".
   *
   *  Der gegriffene Ton hat immer Vorrang vor dem falschen Teilton. Das
   *  ist auf der Trompete zwingend: g1 klingt exakt wie ein c1, bei dem
   *  der naechste Teilton angesprochen hat, c2 wie ein solches g1. Ohne
   *  diesen Vorrang wuerde ein sauber gespieltes g1 als verfehltes c1
   *  gelesen — und bekaeme in Level 2 nie sein Haekchen.
   *
   *  Der Nachbarteilton wird also nur dann in Betracht gezogen, wenn
   *  ueberhaupt kein Ton des Vorrats passt. */
  Tracker.prototype.klassifiziere = function (freq) {
    if (!freq) { return null; }
    var best = null, i, c;

    for (i = 0; i < this.toene.length; i++) {
      c = cents(freq, this.toene[i].frequenzHz);
      if (this.imFenster(this.toene[i].id, c) &&
          (!best || Math.abs(c) < Math.abs(best.cents))) {
        best = { tonId: this.toene[i].id, oktave: 0, cents: c, ton: this.toene[i] };
      }
    }
    if (best) { return best; }

    for (i = 0; i < this.toene.length; i++) {
      c = cents(freq, this.teiltonTabelle[this.toene[i].id].freq);
      if (this.imTeiltonFenster(this.toene[i].id, freq) &&
          (!best || Math.abs(c) < Math.abs(best.cents))) {
        best = { tonId: this.toene[i].id, oktave: 1, cents: c, ton: this.toene[i] };
      }
    }
    return best;
  };

  /** Zielbezogene Pruefung. Liefert 'treffer' | 'ueberblasen' | 'anderer' | 'nichts'.
   *
   *  Hier gilt die umgekehrte Reihenfolge wie in klassifiziere(): passt
   *  die Frequenz zum Nachbarteilton des ZIELTONS, wird das als
   *  'ueberblasen' gewertet, auch wenn es zugleich ein anderer Ton des
   *  Vorrats waere. Wer nach c1 gefragt wird und 349 Hz produziert, hat
   *  mit grosser Wahrscheinlichkeit richtig gegriffen und zu fest
   *  geblasen — und nicht spontan beschlossen, g1 zu spielen. Der
   *  Griff ist ja derselbe. Das darf nie als Fehler zaehlen. */
  Tracker.prototype.pruefeZiel = function (freq, zielId) {
    if (!freq) { return { art: 'nichts' }; }
    var ziel = this.tonById(zielId);
    if (!ziel) { return { art: 'nichts' }; }

    var c = cents(freq, ziel.frequenzHz);
    if (this.imFenster(zielId, c)) { return { art: 'treffer', cents: c }; }

    // Der falsche Teilton wird nie als falscher Ton gewertet — weder der
    // des Zieltons noch der irgendeines anderen Tons.
    if (this.imTeiltonFenster(zielId, freq)) {
      return { art: 'ueberblasen', cents: cents(freq, this.teiltonTabelle[zielId].freq), tonId: zielId };
    }

    var k = this.klassifiziere(freq) || this.naechsterTon(freq);
    if (k && k.oktave === 1) {
      return { art: 'ueberblasen', cents: k.cents, tonId: k.tonId, fremderTon: k.tonId !== zielId };
    }
    if (k) { return { art: 'anderer', tonId: k.tonId, oktave: k.oktave, cents: k.cents }; }
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
