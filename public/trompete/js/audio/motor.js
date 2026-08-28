/* motor.js — alles, was mit Web Audio zu tun hat.
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
    this.puffer = {};           // 'ton_h1_1' -> AudioBuffer
    this.stromQuelle = null;
    this.knoten = null;
    this.aufFrames = null;
    this.bereit = false;
    this.mikrofonLaeuft = false;
    this.spieltBis = 0;         // solange laeuft eigene Wiedergabe
    this.variante = {};         // letzte gespielte Variante je Ton
    this.fehler = null;
    this.meister = null;        // Summenlautstaerke
    this.klang = '';            // gewaehlte Klangfarbe (Unterordner in audio/)
    try {
      var gespeichert = localStorage.getItem('hb-klangfarbe');
      if (gespeichert) { this.klang = gespeichert; }
    } catch (e) { /* Privatmodus */ }

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

  /* ---------------------------------------------------------------- */
  /* Klaenge laden                                                     */
  /* ---------------------------------------------------------------- */

  /* Klangfarben: Unterordner in audio/. Leerer Name = Grundklang. */
  Motor.KLANGFARBEN = [
    { id: '', name: 'Warm (Standard)' },
    { id: 'brillant', name: 'Brillant' },
    { id: 'gedaempft', name: 'Gedämpft' }
  ];

  Motor.prototype.klangOrdner = function () {
    return this.klang ? this.klang + '/' : '';
  };

  /** Waehlt die Klangfarbe und laedt die passenden Klaenge nach. */
  Motor.prototype.klangWaehlen = function (id) {
    var gueltig = Motor.KLANGFARBEN.some(function (k) { return k.id === id; });
    if (!gueltig) { id = ''; }
    this.klang = id;
    try { localStorage.setItem('hb-klangfarbe', id); } catch (e) { /* Privatmodus */ }
    if (!this.ctx) { return Promise.resolve(); }
    return this._klaengeLaden();
  };

  Motor.prototype._klaengeLaden = function () {
    var selbst = this;
    var namen = ['lob'];
    this.toene.forEach(function (t) {
      for (var v = 1; v <= 3; v++) { namen.push(t.audio + '_' + v); }
    });
    return Promise.all(namen.map(function (n) {
      if (selbst.puffer[selbst.klangOrdner() + n]) { return null; }
      return selbst._laden(n).catch(function () { return null; });
    }));
  };

  Motor.prototype._laden = function (name) {
    var selbst = this;
    var schluessel = this.klangOrdner() + name;
    var url = this.basis + 'audio/' + schluessel + '.m4a';
    return new Promise(function (aufl, ab) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (xhr.status !== 200 && xhr.status !== 0) { ab(new Error(url + ' ' + xhr.status)); return; }
        // Alte Safari-Versionen kennen nur die Callback-Form
        var ergebnis = selbst.ctx.decodeAudioData(xhr.response, function (b) {
          selbst.puffer[schluessel] = b; aufl(b);
        }, function (e) { ab(e || new Error('decode ' + name)); });
        if (ergebnis && ergebnis.then) {
          ergebnis.then(function (b) { selbst.puffer[schluessel] = b; aufl(b); }, ab);
        }
      };
      xhr.onerror = function () { ab(new Error('netz ' + url)); };
      xhr.send();
    });
  };


  /* ---------------------------------------------------------------- */
  /* Wiedergabe                                                        */
  /* ---------------------------------------------------------------- */

  /** Spielt einen Ton. Waehlt zufaellig eine andere Variante als zuletzt. */
  Motor.prototype.spieleTon = function (tonId, o) {
    o = o || {};
    var ton = this._ton(tonId);
    if (!ton || !this.ctx) { return 0; }
    var v = 1 + Math.floor(Math.random() * 3);
    if (v === this.variante[tonId]) { v = (v % 3) + 1; }
    this.variante[tonId] = v;

    var o1 = this.klangOrdner();
    var buf = this.puffer[o1 + ton.audio + '_' + v] || this.puffer[o1 + ton.audio + '_1']
      || this.puffer[ton.audio + '_' + v] || this.puffer[ton.audio + '_1'];

    if (!buf) { return 0; }

    var wann = o.wann != null ? o.wann : this.ctx.currentTime + 0.03;
    var dauer = o.dauer != null ? o.dauer : 1.25;
    var ausklang = 0.14;

    var q = this.ctx.createBufferSource();
    q.buffer = buf;
    var g = this.ctx.createGain();
    var laut = o.lautstaerke != null ? o.lautstaerke : 1;
    g.gain.setValueAtTime(laut, wann);
    g.gain.setValueAtTime(laut, wann + Math.max(0.05, dauer - ausklang));
    g.gain.linearRampToValueAtTime(0.0001, wann + dauer);
    q.connect(g); g.connect(this.meister);
    q.start(wann);
    q.stop(wann + dauer + 0.02);
    this._merken(q);

    this.spieltBis = Math.max(this.spieltBis, wann + dauer + 0.25);
    return wann;
  };

  /** Spielt eine ganze Uebung im gewuenschten Tempo. */
  Motor.prototype.spieleMelodie = function (melodie, bpm, o) {
    o = o || {};
    var schlag = 60 / bpm;
    var start = o.wann != null ? o.wann : this.ctx.currentTime + 0.12;
    var selbst = this;
    melodie.noten.forEach(function (n) {
      if (n.pause) { return; }
      selbst.spieleTon(n.tonId, {
        wann: start + n.schlag * schlag,
        dauer: n.dauer * schlag * 0.92,
        lautstaerke: o.lautstaerke
      });
    });
    return { start: start, ende: start + melodie.schlaegeGesamt * schlag };
  };

  Motor.prototype.spieleLob = function () {
    var buf = this.puffer[this.klangOrdner() + 'lob'] || this.puffer.lob;
    if (!buf || !this.ctx) { return 0; }
    var wann = this.ctx.currentTime + 0.03;
    var q = this.ctx.createBufferSource();
    q.buffer = buf;
    q.connect(this.meister);
    q.start(wann);
    this._merken(q);
    this.spieltBis = Math.max(this.spieltBis, wann + buf.duration + 0.2);
    return buf.duration;
  };

  /** Metronomklick.
   *
   * Bewusst ein kurzer, gefilterter Rauschstoss und KEIN Sinuston: das
   * Mikrofon hoert den Klick mit, und ein Sinus zwischen 780 und 2400 Hz
   * — oder einer, dessen Vielfache dort landen — wuerde von der
   * Tonhoehenerkennung als gespielter Ton oder als Naturton daneben
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
    var optionen = {
      hopSize: 128,
      windowSize: this.erkennung.fensterGroesse || 1536,
      pitchEvery: this.erkennung.tonhoeheJedenNtenHop || 6,
      fMin: this.erkennung.fMinHz || 420,
      fMax: this.erkennung.fMaxHz || 2600,
      highpassHz: this.erkennung.hochpassHz || 300,
      riseDb: this.erkennung.wiederholungEinbruchDb || 6
    };

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
