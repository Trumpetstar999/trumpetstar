/* dsp.js — reine Signalverarbeitung, ohne DOM, ohne Web-Audio-Objekte.
 *
 * Laeuft unveraendert in drei Umgebungen:
 *   1. Node  (Tests, siehe test/)
 *   2. AudioWorkletGlobalScope  (iOS >= 14.5)
 *   3. Main Thread / ScriptProcessor-Fallback  (iOS 13.4 .. 14.4)
 *
 * Zwei getrennte Stroeme (Auftrag 8.1):
 *   - Tonhoehe  : YIN
 *   - Einsatz   : Energieanstiegs-Detektor auf der dB-Huellkurve
 * Sie werden hier NICHT verheiratet; jeder Frame traegt beide Ergebnisse,
 * die Zusammenfuehrung passiert eine Ebene hoeher (tracker.js).
 */
(function (root, factory) {
  var DSP = factory();
  if (typeof module === 'object' && module.exports) { module.exports = DSP; }
  root.DSP = DSP;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Biquad-Hochpass (Butterworth, Q = 0.7071) gegen Raumbrummen         */
  /* ------------------------------------------------------------------ */

  function Highpass(sampleRate, fc) {
    var w0 = 2 * Math.PI * fc / sampleRate;
    var cos = Math.cos(w0), sin = Math.sin(w0);
    var alpha = sin / (2 * Math.SQRT1_2);
    var a0 = 1 + alpha;
    this.b0 = ((1 + cos) / 2) / a0;
    this.b1 = (-(1 + cos)) / a0;
    this.b2 = this.b0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }

  Highpass.prototype.process = function (input, output, n) {
    var b0 = this.b0, b1 = this.b1, b2 = this.b2, a1 = this.a1, a2 = this.a2;
    var x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2;
    for (var i = 0; i < n; i++) {
      var x = input[i];
      var y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      output[i] = y;
    }
    // Denormale abfangen (alte CPUs werden davon sehr langsam)
    if (!isFinite(y1) || Math.abs(y1) < 1e-20) { y1 = 0; }
    if (!isFinite(y2) || Math.abs(y2) < 1e-20) { y2 = 0; }
    this.x1 = x1; this.x2 = x2; this.y1 = y1; this.y2 = y2;
  };

  /* ------------------------------------------------------------------ */
  /* YIN                                                                 */
  /* ------------------------------------------------------------------ */
  /* TROMPETE: der Suchbereich liegt eine ganze Oktave tiefer als bei der
   * Blockfloete. Notiertes c1 klingt auf der B-Trompete b0 = 233 Hz; 80
   * Cent zu tief sind 222 Hz. tauMax entspricht deshalb 190 Hz.
   *
   * Damit YIN bei so tiefen Toenen noch genug Perioden sieht, muss das
   * Fenster groesser sein als bei der Blockfloete: 1536 statt 1024
   * Samples. Mit den alten Werten (1024 / 420 Hz) versagt die Erkennung
   * bei sechs von neun Toenen — nachgemessen, nicht geschaetzt. */

  function Yin(sampleRate, opts) {
    opts = opts || {};
    this.sampleRate = sampleRate;
    this.windowSize = opts.windowSize || 1536;
    this.fMin = opts.fMin || 190;
    this.fMax = opts.fMax || 2600;
    this.threshold = opts.threshold || 0.15;

    this.tauMin = Math.max(2, Math.floor(sampleRate / this.fMax));
    this.tauMax = Math.min(this.windowSize >> 1, Math.ceil(sampleRate / this.fMin));
    this.diff = new Float32Array(this.tauMax + 1);
    this.cmnd = new Float32Array(this.tauMax + 1);
  }

  /** buf: Float32Array der Laenge >= windowSize, Ende = juengstes Sample.
   *  Liefert { freq, clarity } — freq = 0 wenn nichts Periodisches da ist. */
  Yin.prototype.detect = function (buf, offset) {
    offset = offset || 0;
    var W = this.windowSize - this.tauMax;
    var tauMax = this.tauMax, tauMin = this.tauMin;
    var diff = this.diff, cmnd = this.cmnd;
    var tau, i, delta, sum;

    diff[0] = 0;
    for (tau = 1; tau <= tauMax; tau++) {
      sum = 0;
      for (i = 0; i < W; i++) {
        delta = buf[offset + i] - buf[offset + i + tau];
        sum += delta * delta;
      }
      diff[tau] = sum;
    }

    cmnd[0] = 1;
    var running = 0;
    for (tau = 1; tau <= tauMax; tau++) {
      running += diff[tau];
      cmnd[tau] = running === 0 ? 1 : diff[tau] * tau / running;
    }

    // Absolute-Threshold-Schritt: erstes lokales Minimum unter der Schwelle
    var best = -1;
    for (tau = tauMin; tau <= tauMax; tau++) {
      if (cmnd[tau] < this.threshold) {
        while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) { tau++; }
        best = tau;
        break;
      }
    }
    if (best < 0) {
      // Nichts unter der Schwelle — globales Minimum als Notloesung,
      // aber mit der zugehoerigen (schlechten) clarity gemeldet.
      var minVal = Infinity;
      for (tau = tauMin; tau <= tauMax; tau++) {
        if (cmnd[tau] < minVal) { minVal = cmnd[tau]; best = tau; }
      }
      if (best < 0 || minVal > 0.6) { return { freq: 0, clarity: 0 }; }
    }

    // Parabolische Interpolation fuer Sub-Sample-Genauigkeit
    var t = best, betterTau = best;
    if (t > tauMin && t < tauMax) {
      var s0 = cmnd[t - 1], s1 = cmnd[t], s2 = cmnd[t + 1];
      var denom = 2 * (2 * s1 - s2 - s0);
      if (denom !== 0) { betterTau = t + (s2 - s0) / denom; }
    }
    if (betterTau <= 0) { return { freq: 0, clarity: 0 }; }

    return {
      freq: this.sampleRate / betterTau,
      clarity: Math.max(0, Math.min(1, 1 - cmnd[best]))
    };
  };

  /* ------------------------------------------------------------------ */
  /* Einsatz-Erkennung (Energieanstieg auf der dB-Huellkurve)            */
  /* ------------------------------------------------------------------ */
  /* Ein fester Millisekunden-Blick zurueck reicht nicht: eine
   * Blockfloete ohne Zungenstoss steigt langsam an. Wir suchen deshalb
   * im Rueckblickfenster das Minimum und datieren den Einsatz dorthin
   * zurueck, wo der Anstieg begonnen hat.                               */

  function OnsetDetector(opts) {
    opts = opts || {};
    this.riseDb = opts.riseDb != null ? opts.riseDb : 6;
    this.lookback = opts.lookback || 24;        // in Hops
    this.minIOIHops = opts.minIOIHops || 56;    // minimaler Abstand zweier Einsaetze
    this.history = new Float32Array(this.lookback + 1);
    this.filled = 0;
    this.hopIndex = 0;
    this.lastOnsetHop = -1e9;
    this.armed = true;
    this.peakSeitEinsatz = -999;
  }

  /** db: aktueller Pegel, gateDb: Rauschschwelle.
   *  Liefert null oder { hop, riseDb, floorDb } — hop ist der
   *  zurueckdatierte Einsatzpunkt.
   *
   *  Zwei Sperren verhindern, dass eine einzelne Anblasflanke mehrfach
   *  feuert: eine feste Refraktaerzeit UND die Bedingung, dass der Pegel
   *  seit dem letzten Einsatz erst wieder deutlich abgefallen sein muss.
   *  Ein langsamer Anblasvorgang loest damit genau einen Einsatz aus,
   *  ein echter zweiter Ton (mit Einbruch) aber weiterhin einen neuen. */
  OnsetDetector.prototype.push = function (db, gateDb) {
    var lb = this.lookback;
    var h = this.history;
    var pos = this.hopIndex % (lb + 1);
    h[pos] = db;
    this.hopIndex++;
    if (this.filled < lb + 1) { this.filled++; }

    if (db > this.peakSeitEinsatz) { this.peakSeitEinsatz = db; }
    if (!this.armed && db <= this.peakSeitEinsatz - this.riseDb * 0.5) {
      this.armed = true;
    }

    var sinceLast = (this.hopIndex - 1) - this.lastOnsetHop;
    if (!this.armed || this.filled <= lb || db <= gateDb || sinceLast < this.minIOIHops) {
      return null;
    }

    var minDb = Infinity, minAge = 0;
    for (var age = 1; age <= lb; age++) {
      var p = (this.hopIndex - 1 - age) % (lb + 1);
      if (p < 0) { p += lb + 1; }
      if (h[p] < minDb) { minDb = h[p]; minAge = age; }
    }
    var rise = db - minDb;
    if (rise < this.riseDb) { return null; }

    /* Zurueckdatieren: nicht auf das Minimum selbst — das liegt noch im
     * Atemgeraeusch vor dem Ton und ergaebe einen systematisch zu fruehen
     * Einsatz. Stattdessen auf den Punkt, an dem der Pegel die halbe
     * Anstiegshoehe erreicht hat. Das liegt dicht am gehoerten Einsatz. */
    var schwelle = minDb + rise * 0.5;
    var onsetHop = (this.hopIndex - 1) - minAge;
    for (var zurueck = minAge; zurueck >= 1; zurueck--) {
      var q = (this.hopIndex - 1 - zurueck) % (lb + 1);
      if (q < 0) { q += lb + 1; }
      if (h[q] >= schwelle) { onsetHop = (this.hopIndex - 1) - zurueck; break; }
    }
    this.lastOnsetHop = this.hopIndex - 1;
    this.armed = false;
    this.peakSeitEinsatz = db;
    return { hop: onsetHop, riseDb: rise, floorDb: minDb };
  };

  /* ------------------------------------------------------------------ */
  /* Analyzer — bindet beide Stroeme an einen gemeinsamen Ringpuffer     */
  /* ------------------------------------------------------------------ */

  function Analyzer(sampleRate, opts) {
    opts = opts || {};
    this.sampleRate = sampleRate;
    this.hopSize = opts.hopSize || 128;
    this.windowSize = opts.windowSize || 1536;
    this.pitchEvery = opts.pitchEvery || 6;          // Hops zwischen YIN-Laeufen
    this.ringSize = 8192;
    this.ring = new Float32Array(this.ringSize);
    this.ringWrite = 0;
    this.pending = 0;                                 // Samples seit letztem Hop
    this.hopCount = 0;
    this.samplesSeen = 0;

    this.highpass = new Highpass(sampleRate, opts.highpassHz || 130);
    this.yin = new Yin(sampleRate, {
      windowSize: this.windowSize,
      fMin: opts.fMin || 190,
      fMax: opts.fMax || 2600,
      threshold: opts.yinThreshold || 0.15
    });
    var proHop = 1000 * this.hopSize / sampleRate;
    this.onsetOpt = {
      riseDb: opts.riseDb != null ? opts.riseDb : 6,
      lookback: Math.max(6, Math.round((opts.onsetLookbackMs || 70) / proHop)),
      /* Sperrzeit zwischen zwei Einsaetzen. Die kuerzeste Note im Spiel
       * ist eine Viertel bei 100 BPM = 600 ms; 300 ms Sperre koennen
       * also nie eine echte Note verschlucken, halten aber jedes
       * Nachfeuern im gehaltenen Ton sicher zurueck. */
      minIOIHops: Math.max(4, Math.round((opts.minIOIMs || 300) / proHop))
    };
    this.onset = new OnsetDetector(this.onsetOpt);

    /* Geglaettete Huellkurve fuer die Einsatzerkennung.
     *
     * Blechklang schwebt in der Lautstaerke deutlich staerker als
     * Floetenklang: zehn kraeftige Teiltoene mit leicht
     * unterschiedlicher Tonhoehe erzeugen Schwebungen von mehreren
     * Dezibel. Ungeglaettet feuert der Einsatzdetektor dann mitten im
     * gehaltenen Ton immer wieder nach — gemessen 15 bis 21 Einsaetze
     * statt der fuenf gespielten Noten. */
    this.dbGlatt = -90;
    this.glaettung = opts.glaettung != null ? opts.glaettung : 0.28;

    this.absoluteFloorDb = opts.absoluteFloorDb != null ? opts.absoluteFloorDb : -62;
    this.gateMarginDb = opts.gateMarginDb != null ? opts.gateMarginDb : 12;
    this.noiseFloorDb = -70;

    this.scratch = new Float32Array(this.windowSize);
    this.filtered = new Float32Array(2048);
    this.lastPitch = { freq: 0, clarity: 0 };

    /* Ergebnis-Frames liegen kompakt in einem Float32Array statt in
     * Objekten: der Weg vom AudioWorklet in den Main Thread erzeugt so
     * keinen einzigen neuen Speicherblock pro Hop. */
    /* Alle Frame-Zeiten werden um diesen Wert verschoben, damit sie
     * auf derselben Uhr liegen wie AudioContext.currentTime. Nur so
     * lassen sich gehoerte Einsaetze mit geplanten Klicks vergleichen. */
    this.zeitVersatz = 0;
    this.kapazitaet = opts.frameKapazitaet || 512;
    this.ausgabe = new Float32Array(this.kapazitaet * Analyzer.FELDER);
    this.anzahl = 0;
    this.verloren = 0;
  }

  /* Feldbelegung eines Frames im kompakten Puffer */
  Analyzer.FELDER = 8;
  Analyzer.F_T = 0;
  Analyzer.F_DB = 1;
  Analyzer.F_FREQ = 2;
  Analyzer.F_CLARITY = 3;
  Analyzer.F_ABOVE = 4;
  Analyzer.F_ONSET_T = 5;      // -1 = kein Einsatz in diesem Frame
  Analyzer.F_GATE = 6;
  Analyzer.F_NOISE = 7;

  Analyzer.prototype._writeRing = function (buf, n) {
    var ring = this.ring, size = this.ringSize, w = this.ringWrite;
    for (var i = 0; i < n; i++) {
      ring[w] = buf[i];
      w = (w + 1) % size;
    }
    this.ringWrite = w;
  };

  /** Kopiert die letzten `len` Samples in `out` (aeltestes zuerst). */
  Analyzer.prototype._readLast = function (out, len) {
    var ring = this.ring, size = this.ringSize;
    var start = this.ringWrite - len;
    while (start < 0) { start += size; }
    for (var i = 0; i < len; i++) {
      out[i] = ring[(start + i) % size];
    }
  };

  /** input: Float32Array beliebiger Laenge. */
  Analyzer.prototype.push = function (input) {
    var n = input.length;
    if (this.filtered.length < n) { this.filtered = new Float32Array(n); }
    this.highpass.process(input, this.filtered, n);
    this._writeRing(this.filtered, n);
    this.samplesSeen += n;
    this.pending += n;

    while (this.pending >= this.hopSize) {
      this.pending -= this.hopSize;
      this._processHop();
    }
  };

  Analyzer.prototype._processHop = function () {
    var hop = this.hopSize;
    // Energie des juengsten Hops
    var ring = this.ring, size = this.ringSize;
    // Achtung: this.pending Samples liegen bereits "hinter" diesem Hop.
    var end = this.ringWrite - this.pending;
    var start = end - hop;
    while (start < 0) { start += size; end += size; }
    var sum = 0;
    for (var i = 0; i < hop; i++) {
      var v = ring[(start + i) % size];
      sum += v * v;
    }
    var rms = Math.sqrt(sum / hop);
    var db = 20 * Math.log10(rms + 1e-9);

    // Rauschboden nachfuehren: faellt schnell, steigt sehr langsam
    if (db < this.noiseFloorDb) {
      this.noiseFloorDb += (db - this.noiseFloorDb) * 0.25;
    } else {
      this.noiseFloorDb += 0.004;
    }
    if (this.noiseFloorDb < -90) { this.noiseFloorDb = -90; }
    var gateDb = Math.max(this.absoluteFloorDb, this.noiseFloorDb + this.gateMarginDb);

    if (this.dbGlatt < -89) { this.dbGlatt = db; }
    this.dbGlatt += (db - this.dbGlatt) * this.glaettung;
    var onsetHit = this.onset.push(this.dbGlatt, gateDb);

    // Tonhoehe nur jeden n-ten Hop — spart auf altem Geraet spuerbar CPU
    if (this.hopCount % this.pitchEvery === 0) {
      if (db > gateDb - 6) {
        this._readLast(this.scratch, this.windowSize);
        this.lastPitch = this.yin.detect(this.scratch, 0);
      } else {
        this.lastPitch = { freq: 0, clarity: 0 };
      }
    }

    var tNow = this.zeitVersatz + (this.samplesSeen - this.pending) / this.sampleRate;
    if (this.anzahl < this.kapazitaet) {
      var o = this.anzahl * Analyzer.FELDER;
      var a = this.ausgabe;
      a[o + Analyzer.F_T] = tNow;
      a[o + Analyzer.F_DB] = db;
      a[o + Analyzer.F_FREQ] = this.lastPitch.freq;
      a[o + Analyzer.F_CLARITY] = this.lastPitch.clarity;
      a[o + Analyzer.F_ABOVE] = db > gateDb ? 1 : 0;
      a[o + Analyzer.F_ONSET_T] = onsetHit
        ? (tNow - (this.hopCount - onsetHit.hop) * hop / this.sampleRate)
        : -1e9;
      a[o + Analyzer.F_GATE] = gateDb;
      a[o + Analyzer.F_NOISE] = this.noiseFloorDb;
      this.anzahl++;
    } else {
      this.verloren++;
    }
    this.hopCount++;
  };

  /** Kompakter Puffer fuer den Weg ueber die Thread-Grenze.
   *  Gibt eine Sicht auf den internen Speicher zurueck — der Aufrufer
   *  muss sie vor dem naechsten push() ausgewertet oder kopiert haben. */
  Analyzer.prototype.drainKompakt = function () {
    var n = this.anzahl;
    this.anzahl = 0;
    return n ? this.ausgabe.subarray(0, n * Analyzer.FELDER) : null;
  };

  /** Bequeme Objektform — nur fuer Tests und die Eltern-Testansicht. */
  Analyzer.prototype.drain = function () {
    var n = this.anzahl;
    this.anzahl = 0;
    var out = new Array(n);
    for (var i = 0; i < n; i++) {
      var o = i * Analyzer.FELDER, a = this.ausgabe;
      var onsetT = a[o + Analyzer.F_ONSET_T];
      var hatOnset = onsetT > -1e8;
      out[i] = {
        t: a[o + Analyzer.F_T], db: a[o + Analyzer.F_DB],
        freq: a[o + Analyzer.F_FREQ], clarity: a[o + Analyzer.F_CLARITY],
        above: a[o + Analyzer.F_ABOVE] > 0.5,
        gateDb: a[o + Analyzer.F_GATE], noiseFloorDb: a[o + Analyzer.F_NOISE],
        onset: hatOnset ? { t: onsetT } : null
      };
    }
    return out;
  };

  Analyzer.prototype.reset = function () {
    this.ring.fill(0);
    this.ringWrite = 0; this.pending = 0; this.hopCount = 0; this.samplesSeen = 0;
    this.anzahl = 0; this.verloren = 0;
    this.noiseFloorDb = -70;
    this.dbGlatt = -90;
    this.onset = new OnsetDetector(this.onsetOpt);
    this.lastPitch = { freq: 0, clarity: 0 };
  };

  /* ------------------------------------------------------------------ */
  /* Hilfsfunktionen                                                     */
  /* ------------------------------------------------------------------ */

  function centsBetween(f1, f2) {
    if (f1 <= 0 || f2 <= 0) { return NaN; }
    return 1200 * Math.log2(f1 / f2);
  }

  return {
    Highpass: Highpass,
    Yin: Yin,
    OnsetDetector: OnsetDetector,
    Analyzer: Analyzer,
    centsBetween: centsBetween
  };
});
