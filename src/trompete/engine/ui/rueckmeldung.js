/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/ui/rueckmeldung.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* rueckmeldung.js — was nach einem gehoerten Ton klingt und sich bewegt.
 *
 * WAS die App gehoert hat, sagt sie in der Statuszeile in Worten — das
 * setzen level1.js und level2.js. Hier steht nur, was dazu klingt (der
 * richtige Ton noch einmal) und was sich dazu bewegt (die Note
 * leuchtet auf, die Ventile pulsieren).
 *
 * Es gibt weder einen Summer noch eine Fanfare. "Falsch" heisst immer:
 * der gesuchte Ton erklingt noch einmal, und dazu steht da, was
 * stattdessen zu hoeren war.
 *
 * Solange eine Rueckmeldung laeuft, wird nicht zugehoert und nicht
 * neu gestartet — sonst bewertete die App ihren eigenen Vorspielton.
 */
(function (root) {
  'use strict';

  function Rueckmeldung(o) {
    this.buehne = o.buehne;
    this.motor = o.motor;
    this.grifffeld = o.grifffeld;
    this.laeuft = false;
    this.nr = 0;
  }

  Rueckmeldung.prototype._sperren = function (ms) {
    var selbst = this;
    var nr = ++this.nr;
    this.laeuft = true;
    this.buehne.classList.add('sperrt');
    return new Promise(function (aufl) {
      setTimeout(function () {
        /* Die Sperre loest nur, wer sie gesetzt hat. Wurde inzwischen
         * abgebrochen und laeuft schon die naechste Rueckmeldung, darf
         * diese Uhr sie nicht vorzeitig freigeben. Aufgeraeumt wird
         * trotzdem — deshalb loest die Zusage in jedem Fall ein. */
        if (selbst.nr === nr) {
          selbst.laeuft = false;
          selbst.buehne.classList.remove('sperrt');
        }
        aufl();
      }, ms);
    });
  };

  /** Bricht eine laufende Rueckmeldung sofort ab — bei Stopp und beim
   *  Wechsel zur Uebersicht darf nichts mehr sperren. */
  Rueckmeldung.prototype.abbrechen = function () {
    this.nr++;
    this.laeuft = false;
    this.buehne.classList.remove('sperrt');
    this.grifffeld.classList.remove('pulsiert');
  };

  /** Getroffen: eine kurze Atempause, in der das Ergebnis zu lesen ist. */
  Rueckmeldung.prototype.treffer = function (ms) {
    return this._sperren(ms || 1300);
  };

  /** Ueberblasen oder ungenau: der Zielton kommt leise noch einmal —
   *  als Erinnerung, wo er eigentlich liegt. */
  Rueckmeldung.prototype.ueberblasen = function (zielTonId) {
    if (zielTonId) {
      this.motor.spieleTon(zielTonId, { dauer: 1.4, lautstaerke: 0.5, wann: this.motor.jetzt() + 0.7 });
    }
    return this._sperren(2700);
  };

  /** Nichts gehoert: Zielton noch einmal, das Griffbild meldet sich.
   *  Kein Zeitlimit, kein Abbruch. */
  Rueckmeldung.prototype.nochmalHoeren = function (zielTonId, lauter) {
    var selbst = this;
    this.grifffeld.classList.add('pulsiert');
    this.motor.spieleTon(zielTonId, { dauer: 1.35, lautstaerke: lauter ? 1 : 0.8 });
    return this._sperren(1700).then(function () {
      selbst.grifffeld.classList.remove('pulsiert');
    });
  };

  /** Ein anderer Ton als der gesuchte: die Note leuchtet auf und
   *  erklingt allein. Der Hof liegt hinter dem Notenkopf. */
  Rueckmeldung.prototype.einzelneNote = function (svgKnoten, tonId, farbe) {
    var hof = null;
    if (svgKnoten) {
      svgKnoten.classList.add('leuchtet');
      if (svgKnoten.parentNode) {
        hof = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        hof.setAttribute('cx', svgKnoten.getAttribute('cx'));
        hof.setAttribute('cy', svgKnoten.getAttribute('cy'));
        hof.setAttribute('rx', svgKnoten.getAttribute('rx'));
        hof.setAttribute('ry', svgKnoten.getAttribute('ry'));
        hof.setAttribute('fill', farbe || 'var(--marker)');
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

  root.Rueckmeldung = Rueckmeldung;
})(typeof globalThis !== 'undefined' ? globalThis : this);
