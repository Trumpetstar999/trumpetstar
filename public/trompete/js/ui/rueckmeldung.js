/* rueckmeldung.js — die Tabelle aus Auftrag 12, in Bild und Klang.
 *
 * In diesem Modul gibt es keinen einzigen negativen Fall. Kein Summer,
 * kein rotes X, kein trauriger Klang. "Falsch" heisst hier immer nur:
 * der richtige Ton wird noch einmal vorgespielt.
 *
 * Waehrend eine Rueckmeldung laeuft, werden alle Eingaben verschluckt
 * (Auftrag 17) — nicht in eine Warteschlange gelegt.
 */
(function (root) {
  'use strict';

  function Rueckmeldung(o) {
    this.buehne = o.buehne;
    this.motor = o.motor;
    this.grifffeld = o.grifffeld;
    this.laeuft = false;
    this.bilder = o.bilder || {};
    /* Die Farben des Tonvorrats — daraus werden die Noten, die beim
     * Lob auffliegen. Sie aus den Toenen zu nehmen statt eine eigene
     * Palette zu erfinden ist wichtig: das Kind kennt diese Farben
     * schon von den Notenkoepfen und den Ventilen. */
    this.farben = o.farben && o.farben.length ? o.farben : ['#FFC94D'];
  }

  /* Wie viele Noten auffliegen und wie weit sie auseinandergehen.
   * Ungerade Zahl, damit eine Note in der Mitte gerade nach oben
   * steigt und der Faecher symmetrisch ist. */
  var JUBEL_NOTEN = 7;
  var JUBEL_FAECHER = 17;      // vh nach aussen, ganz aussen

  /** Ein kleiner Notenkopf, der auffliegt. Reines Bild, kein Zeichen —
   *  es steht nichts geschrieben, es fliegt nur etwas Buntes. */
  Rueckmeldung.prototype._jubelnoten = function () {
    var mitte = (JUBEL_NOTEN - 1) / 2;
    for (var i = 0; i < JUBEL_NOTEN; i++) {
      var aus = (i - mitte) / mitte;               // -1 .. +1
      var n = document.createElement('i');
      n.className = 'jubelnote';
      n.style.backgroundColor = this.farben[i % this.farben.length];
      n.style.setProperty('--weit', (aus * JUBEL_FAECHER).toFixed(1) + 'vh');
      n.style.setProperty('--dreh', (-20 + aus * 26).toFixed(0) + 'deg');
      /* Gestaffelt, damit es sprudelt statt zu springen. Die aeusseren
       * gehen zuerst los, die mittlere zuletzt — dann oeffnet sich der
       * Faecher von aussen nach innen. */
      n.style.animationDelay = (0.30 - Math.abs(aus) * 0.22).toFixed(2) + 's';
      this.buehne.appendChild(n);
    }
  };

  Rueckmeldung.prototype._buehneFrei = function () {
    while (this.buehne.firstChild) { this.buehne.removeChild(this.buehne.firstChild); }
  };

  Rueckmeldung.prototype._sperren = function (ms) {
    var selbst = this;
    this.laeuft = true;
    this.buehne.classList.add('sperrt');
    return new Promise(function (aufl) {
      setTimeout(function () {
        selbst.laeuft = false;
        selbst.buehne.classList.remove('sperrt');
        selbst._buehneFrei();
        aufl();
      }, ms);
    });
  };

  /** Bricht eine laufende Rueckmeldung sofort ab. Wird gebraucht, wenn
   *  das Kind aufs Haus tippt: dann darf nichts mehr nachklingen und
   *  nichts mehr die Bedienung sperren. */
  Rueckmeldung.prototype.abbrechen = function () {
    this.laeuft = false;
    this.buehne.classList.remove('sperrt');
    this.grifffeld.classList.remove('pulsiert');
    this._buehneFrei();
  };

  /** Ganz sauber: immer dasselbe kurze Motiv, damit es wiedererkennbar
   *  wird — und dieselben Noten, die dazu auffliegen. */
  Rueckmeldung.prototype.jubel = function () {
    this._buehneFrei();
    this._jubelnoten();
    var img = document.createElement('img');
    img.src = this.bilder.froh || 'img/vogel-froh.png';
    img.className = 'jubel';
    img.alt = '';
    this.buehne.appendChild(img);
    var dauer = this.motor.spieleLob() || 1.4;
    return this._sperren(Math.max(1800, dauer * 1000 + 250));
  };

  /** Ueberblasen: die Luft wird sanfter. Eine Feder sinkt langsam,
   *  der Zielton kommt leise noch einmal. Nichts blinkt, nichts piept. */
  Rueckmeldung.prototype.feder = function (zielTonId) {
    this._buehneFrei();
    var img = document.createElement('img');
    img.src = this.bilder.feder || 'img/feder.png';
    img.className = 'feder';
    img.alt = '';
    this.buehne.appendChild(img);
    if (zielTonId) {
      this.motor.spieleTon(zielTonId, { dauer: 1.5, lautstaerke: 0.42, wann: this.motor.jetzt() + 0.9 });
    }
    return this._sperren(3200);
  };

  /** Nichts gehoert: Zielton noch einmal, Griffbild pulsiert.
   *  Kein Zeitlimit, kein Abbruch. */
  Rueckmeldung.prototype.nochmalHoeren = function (zielTonId, lauter) {
    var selbst = this;
    this._buehneFrei();
    this.grifffeld.classList.add('pulsiert');
    this.motor.spieleTon(zielTonId, { dauer: 1.35, lautstaerke: lauter ? 1 : 0.8 });
    return this._sperren(1700).then(function () {
      selbst.grifffeld.classList.remove('pulsiert');
    });
  };

  /** Ein einzelner falscher Ton: nur diese Note leuchtet in ihrer Farbe
   *  auf und erklingt allein. Der Hof liegt hinter dem Notenkopf und
   *  traegt dessen Farbe — das ist das Leuchten, nicht bloss ein
   *  Groesserwerden. */
  Rueckmeldung.prototype.einzelneNote = function (svgKnoten, tonId, farbe) {
    this._buehneFrei();
    var hof = null;
    if (svgKnoten) {
      svgKnoten.classList.add('leuchtet');
      if (farbe && svgKnoten.parentNode) {
        hof = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        hof.setAttribute('cx', svgKnoten.getAttribute('cx'));
        hof.setAttribute('cy', svgKnoten.getAttribute('cy'));
        hof.setAttribute('rx', svgKnoten.getAttribute('rx'));
        hof.setAttribute('ry', svgKnoten.getAttribute('ry'));
        hof.setAttribute('fill', farbe);
        hof.setAttribute('class', 'hof');
        svgKnoten.parentNode.insertBefore(hof, svgKnoten);
      }
    }
    this.motor.spieleTon(tonId, { dauer: 1.2 });
    return this._sperren(2100).then(function () {
      if (svgKnoten) { svgKnoten.classList.remove('leuchtet'); }
      if (hof && hof.parentNode) { hof.parentNode.removeChild(hof); }
    });
  };

  /** Toene richtig, Rhythmus wacklig: die Uebung wird einmal im
   *  richtigen Tempo vorgespielt, der Marker laeuft mit. Kein Kommentar. */
  Rueckmeldung.prototype.vorspielen = function (melodie, bpm, markerLauf) {
    var selbst = this;
    this._buehneFrei();
    var lauf = this.motor.spieleMelodie(melodie, bpm, { lautstaerke: 0.85 });
    var dauer = (lauf.ende - lauf.start) * 1000;
    if (markerLauf) { markerLauf(lauf.start, bpm); }
    return this._sperren(dauer + 600);
  };

  root.Rueckmeldung = Rueckmeldung;
})(typeof globalThis !== 'undefined' ? globalThis : this);
