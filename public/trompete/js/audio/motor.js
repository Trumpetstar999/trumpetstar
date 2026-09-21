/* motor.js — alles, was mit Web Audio zu tun hat.
 *
 * Die Toene kommen aus EINER Datei: audio/trumpet-sprite.m4a, 49 kB, die
 * echten Aufnahmen von Mario Schulter. Der eigentliche Sampler steht in
 * sampler.js; hier haengt er nur am Summenweg und wird ueber Ton-IDs
 * bedient.
 *
 * iOS-Eigenheiten, die hier abgefangen werden:
 *   - AudioContext startet nur aus einer echten Nutzergeste heraus
 *   - decodeAudioData kennt auf aelteren Versionen nur die Callback-Form
 *   - AudioWorklet gibt es erst ab iOS 14.5 → ScriptProcessor als Rueckfall
 *   - getUserMedia scheitert im installierten PWA-Modus vor iOS 13.4
 *   - Automatische Aussteuerung (AGC) wuerde die Pegelmessung ruinieren
 */
(function (root) {
  'use strict';

  function Motor(opt) {
    this.basis = opt.basis || '';
    this.toene = opt.toene;
    this.erkennung = opt.erkennung;
    this.ctx = null;
    this.sampler = null;
    this.stromQuelle = null;
    this.knoten = null;
    this.aufFrames = null;
    this.bereit = false;
    this.mikrofonLaeuft = false;
    this.spieltBis = 0;         // solange laeuft eigene Wiedergabe
    this.fehler = null;
    this.meister = null;        // Summenlautstaerke
    /* Horn und Tenorhorn klingen weicher als eine Trompete: weniger
     * Obertoene. Ein Tiefpass ueber den vorgespielten Toenen kommt dem
     * nahe genug, dass ein Kind sein eigenes Instrument wiedererkennt.
     * 0 heisst: unveraendert, so wie eingespielt (Trompete). */
    this.klangfilterHz = opt.klangfilterHz || 0;
    this.klangZiel = null;      // hier haengen die vorgespielten Toene
    this.eigeneStimmung = !!opt.eigeneStimmung;
  }

  /* ---------------------------------------------------------------- */
  /* Start                                                             */
  /* ---------------------------------------------------------------- */

  Motor.prototype.starten = function () {
    var selbst = this;
    if (this.ctx) { return this._aufwecken(); }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) { this.fehler = 'kein-webaudio'; return Promise.reject(new Error('kein-webaudio')); }
    this.ctx = new AC();
    /* Zwei Stufen: 'ausgang' bleibt fuer immer bestehen und fuehrt zum
     * Lautsprecher. 'meister' haengt darunter und wird beim Not-Aus
     * weggeworfen und neu gebaut — damit verstummt auch alles, was
     * bereits fuer die Zukunft eingeplant war. */
    this.ausgang = this.ctx.createGain();
    this.ausgang.gain.value = 1;
    this.ausgang.connect(this.ctx.destination);
    this.meister = this.ctx.createGain();
    this.meister.gain.value = 1;
    this.meister.connect(this.ausgang);
    this.laufende = [];

    // Auf iOS muss der Kontext aus der Geste heraus laufen; ein kurzer
    // stummer Ton bringt ihn zuverlaessig in Gang.
    var q = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    g.gain.value = 0;
    q.connect(g); g.connect(this.ctx.destination);
    q.start(0); q.stop(this.ctx.currentTime + 0.02);

    return this._aufwecken().then(function () {
      return selbst._klaengeLaden();
    }).then(function () {
      selbst.bereit = true;
      return selbst;
    });
  };

  Motor.prototype._aufwecken = function () {
    var c = this.ctx;
    if (!c) { return Promise.resolve(); }
    if (c.state === 'running') { return Promise.resolve(); }
    var p = c.resume();
    return (p && p.then) ? p : Promise.resolve();
  };

  Motor.prototype.pausieren = function () {
    if (this.ctx && this.ctx.state === 'running' && this.ctx.suspend) { this.ctx.suspend(); }
  };
  Motor.prototype.aufwecken = function () { return this._aufwecken(); };
  Motor.prototype.jetzt = function () { return this.ctx ? this.ctx.currentTime : 0; };

  /** Welcher Moment des Audiotakts ist JETZT zu hoeren?
   *
   *  currentTime ist die Zeit, die der Browser gerade ausrechnet. Aus
   *  dem Lautsprecher kommt sie erst nach dem Ausgabeweg — ueber den
   *  eingebauten Lautsprecher einige Dutzend Millisekunden, ueber
   *  Bluetooth leicht eine Viertelsekunde. Alles, was das Kind SIEHT und
   *  was zur Musik passen soll (Marker, Zaehlpunkte, Zeilenwechsel), geht
   *  nach dieser Uhr. Geplant wird weiter nach currentTime.
   *
   *  Der Rechenweg bleibt je Browser immer derselbe. Gemessen: Chrome
   *  meldet den Verzug des Ausgabewegs in outputLatency, rechnet ihn in
   *  getOutputTimestamp aber nicht ein. Wechselte die Uhr zwischen beiden,
   *  sprangen die Zaehlpunkte um genau diesen Verzug hin und her. Wo es
   *  outputLatency gibt, gilt deshalb nur das; Safari kennt es nicht, dort
   *  sagt getOutputTimestamp, was gerade am Ausgang ist. */
  Motor.prototype.hoerbarJetzt = function () {
    if (!this.ctx) { return 0; }
    var c = this.ctx;
    if (typeof c.outputLatency === 'number' && c.outputLatency > 0) {
      return c.currentTime - this.ausgabeVerzug();
    }
    if (c.getOutputTimestamp && root.performance) {
      var ts = c.getOutputTimestamp();
      if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
        return Math.min(c.currentTime,
                        ts.contextTime + (root.performance.now() - ts.performanceTime) / 1000);
      }
    }
    return c.currentTime - this.ausgabeVerzug();
  };

  /* ---------------------------------------------------------------- */
  /* Klaenge laden                                                     */
  /* ---------------------------------------------------------------- */

  Motor.prototype._klaengeLaden = function () {
    var selbst = this;
    if (!root.Sampler) { this.fehler = 'kein-sampler'; return Promise.resolve(null); }
    this.sampler = new root.Sampler({
      ctx: this.ctx, url: this.basis + 'audio/trumpet-sprite.m4a'
    });
    return this.sampler.laden().catch(function () {
      selbst.fehler = 'klang-fehlt';
      return null;
    });
  };

  /* ---------------------------------------------------------------- */
  /* Wiedergabe                                                        */
  /* ---------------------------------------------------------------- */

  /** Spielt einen Ton.
   *
   * Immer dieselbe Aufnahme. Frueher lagen drei Varianten je Ton
   * bereit und hier wurde gewuerfelt — das sollte lebendig wirken,
   * klang aber, als wechsle jemand mitten im Ueben das Instrument.
   * Ein Vorbildton, den das Kind nachspielen soll, muss jedes Mal
   * gleich klingen. */
  Motor.prototype.spieleTon = function (tonId, o) {
    o = o || {};
    var ton = this._ton(tonId);
    if (!ton || !this.ctx || !this.sampler || !this.sampler.bereit()) { return 0; }

    var wann = o.wann != null ? o.wann : this.ctx.currentTime + 0.03;
    var dauer = o.dauer != null ? o.dauer : 1.25;

    /* frequenzHz ist die KLINGENDE Hoehe: notiert c1 klingt B. So hoert
     * das Kind genau den Ton, den seine eigene Trompete macht, und kann
     * mitspielen. */
    var q = this.sampler.spiele(ton.audio, {
      frequenzHz: ton.frequenzHz,
      wann: wann,
      dauer: dauer,
      lautstaerke: o.lautstaerke,
      ziel: this.meister
    });
    if (!q) { return 0; }
    this._merken(q);

    this.spieltBis = Math.max(this.spieltBis, wann + dauer + this.sampler.ausklang());
    return wann;
  };

  /** Spielt eine ganze Uebung im gewuenschten Tempo.
   *
   *  Noten aus dem Buch koennen gebunden sein: die Fortsetzung eines
   *  Haltebogens erklingt nicht neu, der Kopf klingt dafuer so lange wie
   *  beide zusammen (`klangDauer`). */
  Motor.prototype.spieleMelodie = function (melodie, bpm, o) {
    o = o || {};
    var schlag = 60 / bpm;
    var start = o.wann != null ? o.wann : this.ctx.currentTime + 0.12;
    var selbst = this;
    melodie.noten.forEach(function (n) {
      if (n.pause || n.fortsetzung) { return; }
      selbst.spieleTon(n.tonId, {
        wann: start + n.schlag * schlag,
        dauer: (n.klangDauer || n.dauer) * schlag * 0.92,
        lautstaerke: o.lautstaerke
      });
    });
    return { start: start, ende: start + melodie.schlaegeGesamt * schlag };
  };

  /** Das Lobmotiv — ein kleines Signal, gespielt aus denselben
   *  Aufnahmen wie alles andere. Sonst klaenge ausgerechnet das Lob
   *  nach Maschine.
   *
   *  Bei der Blockfloete lag das Motiv als fertige Datei bereit. Der
   *  Sampler kann es aus den vorhandenen Toenen selbst spielen — eine
   *  Datei weniger, die geladen, zwischengespeichert und offline
   *  vorgehalten werden muss. */
  Motor.prototype.spieleLob = function () {
    if (!this.ctx || !this.sampler || !this.sampler.bereit()) { return 0; }
    var achtel = 0.16;
    var motiv = [
      { id: 'g1', t: 0,          d: achtel * 1.1 },
      { id: 'h1', t: achtel,     d: achtel * 1.1 },
      { id: 'd2', t: achtel * 2, d: achtel * 1.1 },
      { id: 'c2', t: achtel * 3, d: achtel * 1.1 },
      { id: 'd2', t: achtel * 4, d: achtel * 5.0 }
    ];
    var start = this.ctx.currentTime + 0.05;
    for (var i = 0; i < motiv.length; i++) {
      this.spieleTon(motiv[i].id, {
        wann: start + motiv[i].t, dauer: motiv[i].d, lautstaerke: 0.95
      });
    }
    var dauer = achtel * 9 + this.sampler.ausklang();
    this.spieltBis = Math.max(this.spieltBis, start + dauer);
    return dauer;
  };

  /** Metronomklick.
   *
   * Bewusst ein kurzer, gefilterter Rauschstoss und KEIN Sinuston: das
   * Mikrofon hoert den Klick mit, und ein Sinus zwischen 780 und 2400 Hz
   * — oder einer, dessen Vielfache dort landen — wuerde von der
   * Tonhoehenerkennung als gespielter Ton oder als ueberblasener Ton
   * gelesen. Rauschen hat keine Periode, faellt also durch die
   * Klarheitsschwelle und kann gar nicht erst verwechselt werden.
   */
  Motor.prototype.klick = function (wann, betont, laut) {
    if (!this.ctx) { return; }
    if (!this._rauschen) { this._rauschen = this._rauschPuffer(); }
    var q = this.ctx.createBufferSource();
    q.buffer = this._rauschen;
    var bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = betont ? 4200 : 3400;
    bp.Q.value = 1.4;
    var g = this.ctx.createGain();
    // Deutlich hoerbar: der Puls ist das Geruest, an dem sich das Kind
    // festhaelt. Zu leise nuetzt er nichts.
    var spitze = (laut != null ? laut : 1) * (betont ? 0.55 : 0.32);
    g.gain.setValueAtTime(spitze, wann);
    g.gain.exponentialRampToValueAtTime(0.0001, wann + (betont ? 0.070 : 0.048));
    q.connect(bp); bp.connect(g); g.connect(this.meister);
    q.start(wann);
    q.stop(wann + 0.09);
    this._merken(q);
  };

  Motor.prototype._rauschPuffer = function () {
    var n = Math.round(this.ctx.sampleRate * 0.09);
    var b = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) { d[i] = Math.random() * 2 - 1; }
    return b;
  };

  /** Merkt sich eine klingende Quelle, damit sie beim Not-Aus wirklich
   *  angehalten werden kann. */
  Motor.prototype._merken = function (quelle) {
    var selbst = this;
    this.laufende.push(quelle);
    quelle.onended = function () {
      var i = selbst.laufende.indexOf(quelle);
      if (i >= 0) { selbst.laufende.splice(i, 1); }
    };
  };

  /** Not-Aus: alles verstummt sofort.
   *
   * Web Audio plant Klaenge im Voraus — ein Metronom laeuft nach dem
   * Anhalten der Logik munter weiter, weil seine Klicks laengst
   * eingeplant sind. Deshalb reicht es nicht, die Uebung zu beenden:
   * jede Quelle wird angehalten UND der ganze Summenweg wird
   * ausgetauscht. Was am alten Weg hing, ist damit stumm, auch wenn es
   * erst in fuenf Sekunden haette klingen sollen.
   *
   * Das Mikrofon bleibt unberuehrt — es haengt nicht am Summenweg.
   */
  Motor.prototype.allesStoppen = function () {
    if (!this.ctx) { return; }
    var jetzt = this.ctx.currentTime;
    var alt = this.meister;

    // Kurz ausblenden statt hart abschneiden — sonst knackst es.
    try {
      alt.gain.cancelScheduledValues(jetzt);
      alt.gain.setValueAtTime(alt.gain.value, jetzt);
      alt.gain.linearRampToValueAtTime(0.0001, jetzt + 0.02);
    } catch (e) { /* aeltere Umsetzungen sind hier eigen */ }

    for (var i = 0; i < this.laufende.length; i++) {
      var q = this.laufende[i];
      q.onended = null;
      try { q.stop(jetzt + 0.03); } catch (e) { /* schon vorbei */ }
    }
    this.laufende.length = 0;

    var selbst = this;
    setTimeout(function () {
      try { alt.disconnect(); } catch (e) { /* egal */ }
    }, 80);

    this.meister = this.ctx.createGain();
    this.meister.gain.value = 1;
    this.meister.connect(this.ausgang);
    this.spieltBis = 0;
    void selbst;
  };

  /** Wie lange braucht der eigene Klang vom Rechnen bis ans Ohr —
   *  und damit bis ans Mikrofon?
   *
   *  Ueber den eingebauten Lautsprecher sind das wenige Millisekunden,
   *  ueber eine Bluetooth-Box gerne 200 bis 400. Web Audio weiss das
   *  und sagt es; wo es die Angabe nicht gibt, bleibt es bei null. */
  Motor.prototype.ausgabeVerzug = function () {
    if (!this.ctx) { return 0; }
    var b = this.ctx.baseLatency || 0;
    var a = this.ctx.outputLatency || 0;
    return b + a;
  };

  /** Wann ist ein Ton, der bei `wann` beginnt und `dauer` lang klingt,
   *  beim MIKROFON verklungen?
   *
   *  Dazu gehoert das Absetzen (das rechnet der Sampler dazu) und die
   *  Laufzeit des Ausgabewegs. Wer erst danach zuhoert, hoert nicht
   *  sich selbst.
   *
   *  Genau daran hing ein Fehler: Level 1 wartete stattdessen feste
   *  1,7 Sekunden. Der eigene Ton endet aber erst nach 1,73 s, und ueber
   *  eine Bluetooth-Box kommt er noch einmal Hunderte Millisekunden
   *  spaeter an. Ab etwa einer halben Sekunde Laufzeit hoerte die App
   *  ihren eigenen Vorspielton und lobte das Kind dafuer, dass sie
   *  selbst gespielt hatte.
   *
   *  Gerechnet wird bewusst mit DIESEM Ton und nicht mit spieltBis.
   *  spieltBis ist eine Hoechstmarke ueber alles bisher Eingeplante —
   *  auch ueber das Lobmotiv — und laege damit weit in der Zukunft. */
  Motor.prototype.klangEndeAmMikrofon = function (wann, dauer) {
    if (!this.ctx) { return 0; }
    var ausklang = this.sampler ? this.sampler.ausklang() : 0.35;
    return wann + dauer + ausklang + this.ausgabeVerzug();
  };

  Motor.prototype.hoertSichSelbst = function () {
    return this.ctx ? this.ctx.currentTime < this.spieltBis : false;
  };

  Motor.prototype._ton = function (id) {
    for (var i = 0; i < this.toene.length; i++) { if (this.toene[i].id === id) { return this.toene[i]; } }
    return null;
  };

  /* ---------------------------------------------------------------- */
  /* Mikrofon                                                          */
  /* ---------------------------------------------------------------- */

  Motor.prototype.mikrofonStarten = function (aufFrames) {
    var selbst = this;
    this.aufFrames = aufFrames;
    if (this.mikrofonLaeuft) { return Promise.resolve(true); }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.fehler = 'kein-mikrofon';
      return Promise.reject(new Error('kein-mikrofon'));
    }
    return navigator.mediaDevices.getUserMedia({
      audio: {
        // Diese drei muessen aus bleiben: eine automatische Aussteuerung
        // wuerde die Pegelmessung und damit die Einsatzerkennung zerstoeren.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }, video: false
    }).then(function (strom) {
      selbst.strom = strom;
      selbst.stromQuelle = selbst.ctx.createMediaStreamSource(strom);
      return selbst._analyseAufbauen();
    }).then(function () {
      selbst.mikrofonLaeuft = true;
      return true;
    }, function (e) {
      selbst.fehler = 'mikrofon-abgelehnt';
      throw e;
    });
  };

  Motor.prototype._analyseAufbauen = function () {
    var selbst = this;
    /* Die Umrechnung steht in dsp.js, damit Mikrofon und Pruefstand
     * garantiert dieselbe Analyse fahren. */
    var optionen = root.DSP.optionenAus(this.erkennung);

    if (this.ctx.audioWorklet && root.AudioWorkletNode) {
      return this._worklet(optionen).then(null, function () {
        return selbst._skriptProzessor(optionen);
      });
    }
    return this._skriptProzessor(optionen);
  };

  Motor.prototype._worklet = function (optionen) {
    var selbst = this;
    return Promise.all([
      hole(this.basis + 'js/audio/dsp.js'),
      hole(this.basis + 'js/audio/erkenner-worklet.js')
    ]).then(function (teile) {
      var quelltext = teile[0] + '\n;\n' + teile[1];
      var url = URL.createObjectURL(new Blob([quelltext], { type: 'application/javascript' }));
      return selbst.ctx.audioWorklet.addModule(url).then(function () {
        URL.revokeObjectURL(url);
        /* Der Knoten bekommt bewusst einen (stummen) Ausgang und wird
         * ueber eine Null-Verstaerkung ans Ziel gehaengt. Ein Zweig, der
         * das Ziel nicht erreicht, wird sonst je nach Browser gar nicht
         * gerechnet — dann kommt kein einziger Frame an. */
        var k = new root.AudioWorkletNode(selbst.ctx, 'erkenner', {
          numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1],
          processorOptions: optionen
        });
        k.port.onmessage = function (e) {
          if (selbst.aufFrames) { selbst.aufFrames(e.data); }
        };
        var stumm = selbst.ctx.createGain();
        stumm.gain.value = 0;
        selbst.stromQuelle.connect(k);
        k.connect(stumm);
        stumm.connect(selbst.ctx.destination);
        selbst.knoten = k;
        selbst.weg = 'audioworklet';
      });
    });
  };

  /* Rueckfall fuer iOS 13.4 bis 14.4: dort gibt es AudioWorklet noch
   * nicht. Der ScriptProcessor laeuft im Main Thread — deshalb ist die
   * Analyse dort bewusst genuegsam ausgelegt. */
  Motor.prototype._skriptProzessor = function (optionen) {
    var selbst = this;
    var DSPk = root.DSP;
    if (!DSPk) { return Promise.reject(new Error('dsp-fehlt')); }
    var groesse = 2048;
    var k = (this.ctx.createScriptProcessor || this.ctx.createJavaScriptNode)
      .call(this.ctx, groesse, 1, 1);
    var analyzer = new DSPk.Analyzer(this.ctx.sampleRate, optionen);
    k.onaudioprocess = function (e) {
      if (analyzer.samplesSeen === 0) {
        analyzer.zeitVersatz = (e.playbackTime != null ? e.playbackTime : selbst.ctx.currentTime);
      }
      analyzer.push(e.inputBuffer.getChannelData(0));
      var buf = analyzer.drainKompakt();
      if (buf && selbst.aufFrames) { selbst.aufFrames(buf); }
    };
    // Ohne Verbindung zum Ziel laeuft der ScriptProcessor in manchen
    // Browsern gar nicht — deshalb stumm angehaengt.
    var stumm = this.ctx.createGain();
    stumm.gain.value = 0;
    this.stromQuelle.connect(k);
    k.connect(stumm);
    stumm.connect(this.ctx.destination);
    this.knoten = k;
    this.weg = 'scriptprocessor';
    return Promise.resolve();
  };

  /** Ersetzt das Mikrofon durch einen beliebigen Audioknoten.
   *  Wird vom Pruefstand (test/pruefstand.html) benutzt, um die ganze
   *  Kette ohne echtes Mikrofon durchzuspielen. Im normalen Betrieb
   *  ruft das niemand auf. */
  Motor.prototype.mikrofonErsetzen = function (knoten, aufFrames) {
    var selbst = this;
    this.aufFrames = aufFrames;
    this.stromQuelle = knoten;
    return this._analyseAufbauen().then(function () {
      selbst.mikrofonLaeuft = true;
      return true;
    });
  };

  Motor.prototype.erkennungZuruecksetzen = function () {
    if (this.knoten && this.knoten.port) { this.knoten.port.postMessage('reset'); }
  };

  function hole(url) {
    return new Promise(function (aufl, ab) {
      var x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.onload = function () { aufl(x.responseText); };
      x.onerror = function () { ab(new Error(url)); };
      x.send();
    });
  }

  root.Motor = Motor;
})(typeof globalThis !== 'undefined' ? globalThis : this);
