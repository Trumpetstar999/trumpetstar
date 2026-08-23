/* tempo.js — der Tempo-Regler.
 *
 * Keine Zahl, keine Beschriftung. Links eine Schildkroete, rechts ein
 * Hase. 60 bis 100 BPM, rastet in Vierer-Schritten. Beim Ziehen tickt
 * der Puls sofort im neuen Tempo mit, damit sie hoert, was sie einstellt.
 *
 * Die App verstellt den Regler nie von selbst nach oben. Nach drei
 * sauberen Durchlaeufen wandert nur der Hase einmal auffordernd hin und
 * her — die Entscheidung bleibt beim Kind.
 */
(function (root) {
  'use strict';

  /* Am Anfang muss es sehr langsam gehen duerfen: 45 ist das
   * langsamste Tempo, in Fuenfer-Schritten bis 100. */
  var MIN = 45, MAX = 100, SCHRITT = 5;

  function Tempo(o) {
    this.feld = o.feld;
    this.bahn = o.bahn;
    this.griff = o.griff;
    this.hase = o.hase;
    this.motor = o.motor;
    this.beiAenderung = o.beiAenderung || function () {};
    this.bpm = MIN;
    this.gesperrt = false;
    this.zeiger = null;         // nur der erste Finger zaehlt
    this.tickBis = 0;
    this.tickZeit = 0;
    this.tickUhr = null;
    this._binden();
  }

  Tempo.prototype.rasten = function () {
    var n = [];
    for (var b = MIN; b <= MAX; b += SCHRITT) { n.push(b); }
    return n;
  };

  Tempo.prototype.setze = function (bpm, still) {
    bpm = Math.max(MIN, Math.min(MAX, Math.round(bpm / SCHRITT) * SCHRITT));
    var geaendert = bpm !== this.bpm;
    this.bpm = bpm;
    var anteil = (bpm - MIN) / (MAX - MIN);
    this.griff.style.left = (anteil * 100) + '%';
    if (geaendert && !still) { this.beiAenderung(bpm); }
    return bpm;
  };

  Tempo.prototype.langsamer = function () {
    return this.setze(this.bpm - SCHRITT);
  };

  Tempo.prototype.sperren = function (ja) {
    this.gesperrt = ja;
    this.feld.classList.toggle('gesperrt', !!ja);
    if (ja) { this._tickenAus(); }
  };

  Tempo.prototype.zeigen = function (ja) {
    this.feld.classList.toggle('aus', !ja);
  };

  /** Der Hase winkt einmal — mehr nicht. */
  Tempo.prototype.hasenWink = function () {
    if (this.bpm >= MAX) { return; }
    var h = this.hase;
    h.classList.remove('winkt');
    void h.offsetWidth;
    h.classList.add('winkt');
    setTimeout(function () { h.classList.remove('winkt'); }, 3600);
  };

  /* ---------------------------------------------------------------- */

  Tempo.prototype._binden = function () {
    var selbst = this;
    var b = this.bahn;

    function ausEreignis(e) {
      var p = e.touches ? e.touches[0] : e;
      var r = b.getBoundingClientRect();
      var anteil = (p.clientX - r.left) / r.width;
      return MIN + Math.max(0, Math.min(1, anteil)) * (MAX - MIN);
    }

    function beginn(e) {
      if (selbst.gesperrt) { return; }
      // Handballen auf dem Display: nur der erste Kontaktpunkt zaehlt
      if (selbst.zeiger !== null) { return; }
      selbst.zeiger = e.touches ? e.touches[0].identifier : 'maus';
      selbst.setze(ausEreignis(e));
      selbst._tickenAn();
      e.preventDefault();
    }
    function zug(e) {
      if (selbst.zeiger === null || selbst.gesperrt) { return; }
      if (e.touches) {
        var gefunden = false;
        for (var i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === selbst.zeiger) { gefunden = true; break; }
        }
        if (!gefunden) { return; }
      }
      selbst.setze(ausEreignis(e));
      e.preventDefault();
    }
    function ende() {
      if (selbst.zeiger === null) { return; }
      selbst.zeiger = null;
      selbst._tickenAusBald();
    }

    b.addEventListener('touchstart', beginn, { passive: false });
    b.addEventListener('touchmove', zug, { passive: false });
    b.addEventListener('touchend', ende);
    b.addEventListener('touchcancel', ende);
    b.addEventListener('mousedown', beginn);
    root.addEventListener('mousemove', zug);
    root.addEventListener('mouseup', ende);
  };

  /* Waehrend des Ziehens laeuft der Puls mit ---------------------- */

  Tempo.prototype._tickenAn = function () {
    var selbst = this;
    if (this.tickUhr) { return; }
    this.tickZeit = this.motor.jetzt() + 0.06;
    this.tickUhr = setInterval(function () { selbst._tickenPlanen(); }, 60);
    this._tickenPlanen();
  };

  Tempo.prototype._tickenPlanen = function () {
    var jetzt = this.motor.jetzt();
    var schlag = 60 / this.bpm;
    if (this.tickZeit < jetzt) { this.tickZeit = jetzt + 0.03; }
    while (this.tickZeit < jetzt + 0.25) {
      this.motor.klick(this.tickZeit, false, 0.6);
      this.tickZeit += schlag;
    }
  };

  Tempo.prototype._tickenAusBald = function () {
    var selbst = this;
    setTimeout(function () { if (selbst.zeiger === null) { selbst._tickenAus(); } }, 700);
  };

  Tempo.prototype._tickenAus = function () {
    if (this.tickUhr) { clearInterval(this.tickUhr); this.tickUhr = null; }
  };

  Tempo.MIN = MIN; Tempo.MAX = MAX; Tempo.SCHRITT = SCHRITT;
  root.Tempo = Tempo;
})(typeof globalThis !== 'undefined' ? globalThis : this);
