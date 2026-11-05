/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/ui/tempo.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* tempo.js — der Tempo-Regler.
 *
 * Eine Zahl, zwei Knoepfe fuer einen Schritt langsamer und schneller,
 * und ein Schieber fuer die grossen Wege. Er hat zwei Gestalten:
 *
 *   Uebungen  Schlaege pro Minute, 40 bis 120 in Fuenfer-Schritten. Beim
 *             Verstellen tickt der Puls im neuen Tempo mit — man hoert,
 *             was man einstellt.
 *   Lieder    Prozent des Originaltempos, 40 bis 120 in Einer-Schritten.
 *             Hier tickt nichts: die Aufnahme laeuft ja, und sie wird
 *             sofort schneller oder langsamer.
 *
 * Welche Gestalt gilt, sagt einstellen(). Wer einen der beiden Knoepfe
 * gedrueckt haelt, laeuft weiter — achtzig Einer-Schritte will niemand
 * einzeln tippen.
 *
 * Die App verstellt das Tempo nie von selbst. Nach mehreren sauberen
 * Durchlaeufen schlaegt sie in der Statuszeile ein hoeheres vor; die
 * Entscheidung bleibt beim Menschen.
 */
(function (root) {
  'use strict';

  /* Am Anfang muss es sehr langsam gehen duerfen. 120 ist die Grenze
   * nach oben, weil Achtel dann nur noch 250 ms dauern — darunter
   * trennt die Erkennung zwei Anstoesse nicht mehr sicher. */
  var MIN = 40, MAX = 120, SCHRITT = 5;

  function Tempo(o) {
    this.feld = o.feld;
    this.bahn = o.bahn;
    this.griff = o.griff;
    this.zahl = o.zahl || null;
    this.minus = o.minus || null;
    this.plus = o.plus || null;
    this.motor = o.motor;
    this.beiAenderung = o.beiAenderung || function () {};
    this.min = MIN; this.max = MAX; this.schritt = SCHRITT;
    this.ticken = true;         // Puls beim Verstellen
    this.einheit = '';          // steht hinter der Zahl, z. B. ' %'
    this.bpm = MIN;             // der Wert — bei Liedern sind es Prozent
    this.gesperrt = false;
    this.zeiger = null;         // nur der erste Finger zaehlt
    this.tickZeit = 0;
    this.tickUhr = null;
    this._binden();
  }

  /** Stellt den Regler auf eine seiner Gestalten ein.
   *  o: { min, max, schritt, ticken, einheit, wert, beiAenderung } */
  Tempo.prototype.einstellen = function (o) {
    this._tickenAus();
    this.min = o.min != null ? o.min : MIN;
    this.max = o.max != null ? o.max : MAX;
    this.schritt = o.schritt || SCHRITT;
    this.ticken = o.ticken !== false;
    this.einheit = o.einheit || '';
    if (o.beiAenderung) { this.beiAenderung = o.beiAenderung; }
    this.bpm = NaN;                     // damit setze() die Anzeige sicher neu schreibt
    this.setze(o.wert != null ? o.wert : this.min, true);
  };

  Tempo.prototype.rasten = function () {
    var n = [];
    for (var b = this.min; b <= this.max; b += this.schritt) { n.push(b); }
    return n;
  };

  Tempo.prototype.setze = function (bpm, still) {
    var MIN = this.min, MAX = this.max, SCHRITT = this.schritt;
    bpm = Math.max(MIN, Math.min(MAX, Math.round(bpm / SCHRITT) * SCHRITT));
    var geaendert = bpm !== this.bpm;
    this.bpm = bpm;
    var anteil = (bpm - MIN) / (MAX - MIN);
    this.griff.style.left = (anteil * 100) + '%';
    // Fuer die gefuellte Spur links vom Griff (siehe #tempospur in stil.css).
    this.bahn.style.setProperty('--anteil', anteil.toFixed(4));
    if (this.zahl) { this.zahl.textContent = String(bpm) + this.einheit; }
    if (this.minus) { this.minus.disabled = this.gesperrt || bpm <= MIN; }
    if (this.plus) { this.plus.disabled = this.gesperrt || bpm >= MAX; }
    if (geaendert && !still) { this.beiAenderung(bpm); }
    return bpm;
  };

  Tempo.prototype.langsamer = function () { return this.setze(this.bpm - this.schritt); };
  Tempo.prototype.schneller = function () { return this.setze(this.bpm + this.schritt); };

  Tempo.prototype.sperren = function (ja) {
    this.gesperrt = !!ja;
    this.feld.classList.toggle('gesperrt', !!ja);
    if (ja) { this._tickenAus(); }
    this.setze(this.bpm, true);         // Knoepfe nachziehen
  };

  Tempo.prototype.zeigen = function (ja) {
    this.feld.classList.toggle('aus', !ja);
  };

  /* ---------------------------------------------------------------- */

  Tempo.prototype._binden = function () {
    var selbst = this;
    var b = this.bahn;

    function ausEreignis(e) {
      var p = e.touches ? e.touches[0] : e;
      var r = b.getBoundingClientRect();
      var anteil = (p.clientX - r.left) / r.width;
      return selbst.min + Math.max(0, Math.min(1, anteil)) * (selbst.max - selbst.min);
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
    this._loesen = function () {
      root.removeEventListener('mousemove', zug);
      root.removeEventListener('mouseup', ende);
    };

    /* Die beiden Schrittknoepfe: ein Tipp, ein Schritt — und bei den
     * Uebungen ist zwei Schlaege lang das neue Tempo zu hoeren. Wer den
     * Knopf haelt, laeuft nach einer knappen halben Sekunde weiter. */
    function einSchritt(richtung) {
      if (selbst.gesperrt) { return; }
      if (richtung < 0) { selbst.langsamer(); } else { selbst.schneller(); }
      if (selbst.ticken) {
        selbst._tickenAn();
        selbst._tickenAusBald(2 * 60000 / selbst.bpm + 150);
      }
    }
    function knopf(elem, richtung) {
      if (!elem) { return; }
      var warten = null, laufen = null, ausDruck = 0;
      function los(e) {
        if (e.type === 'mousedown' && Date.now() - ausDruck < 700) { return; }   // kam schon als Beruehrung
        ausDruck = Date.now();
        einSchritt(richtung);
        halt();
        warten = setTimeout(function () {
          laufen = setInterval(function () { einSchritt(richtung); }, 70);
        }, 420);
      }
      function halt() {
        if (warten) { clearTimeout(warten); warten = null; }
        if (laufen) { clearInterval(laufen); laufen = null; }
      }
      elem.addEventListener('touchstart', los, { passive: true });
      elem.addEventListener('mousedown', los);
      ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(function (name) {
        elem.addEventListener(name, halt);
      });
      /* Mit der Tastatur (und fuer Hilfstechnik) kommt nur ein click. */
      elem.addEventListener('click', function () {
        if (Date.now() - ausDruck < 700) { return; }
        einSchritt(richtung);
      });
    }
    knopf(this.minus, -1);
    knopf(this.plus, 1);
  };

  /* Waehrend des Verstellens laeuft der Puls mit -------------------- */

  Tempo.prototype._tickenAn = function () {
    var selbst = this;
    if (this.tickUhr || !this.ticken) { return; }
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

  Tempo.prototype._tickenAusBald = function (ms) {
    var selbst = this;
    if (this.ausUhr) { clearTimeout(this.ausUhr); }
    this.ausUhr = setTimeout(function () {
      selbst.ausUhr = null;
      if (selbst.zeiger === null) { selbst._tickenAus(); }
    }, ms || 700);
  };

  Tempo.prototype._tickenAus = function () {
    if (this.tickUhr) { clearInterval(this.tickUhr); this.tickUhr = null; }
  };

  Tempo.MIN = MIN; Tempo.MAX = MAX; Tempo.SCHRITT = SCHRITT;
  root.Tempo = Tempo;
})(typeof globalThis !== 'undefined' ? globalThis : this);
