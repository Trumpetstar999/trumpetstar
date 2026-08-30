/* level1.js — Einzeltoene.
 *
 * Kein Rhythmus, kein Takt, kein Tempo, kein Vorzaehler.
 *
 * Note, Griffbild und Tier stehen von Anfang an da. Der Play-Knopf
 * startet: der Ton erklingt, danach hoert die App zu. Der Stop-Knopf
 * haelt jederzeit an — auch mitten im Zuhoeren.
 *
 * Sitzt ein Ton, kommt der naechste von selbst, ohne dass wieder
 * getippt werden muss. Nur wer anhaelt, muss neu starten.
 */
(function (root) {
  'use strict';

  var MAX_VERSUCHE_JE_TON = 3;   // danach kommt still ein anderer Ton dran
  var STILLE_BIS_HILFE = 4.5;    // Sekunden ohne jeden Pegel

  function Level1(k) {
    this.k = k;
    this.laeuft = false;         // Level ist offen
    this.spielt = false;         // Play gedrueckt, App hoert zu
    this.zielTon = null;
    this.letzterTon = null;
    this.versuche = 0;
    this.stilleInFolge = 0;
    this.hoert = false;
    this.hoerenAb = 0;
    this.letzterPegel = 0;
    this.uhr = null;
    this.marke = 0;
  }

  Level1.prototype._nochAktuell = function (marke) {
    return this.marke === marke && this.laeuft && this.spielt;
  };

  /* ---------------------------------------------------------------- */

  Level1.prototype.starten = function () {
    this.marke++;
    this.laeuft = true;
    this.spielt = false;
    this.k.punkte.classList.add('aus');
    this.k.tempo.zeigen(false);
    var selbst = this;
    if (this.uhr) { clearInterval(this.uhr); }
    this.uhr = setInterval(function () { selbst._wache(); }, 400);
    this._naechsterTon(true);
  };

  Level1.prototype.beenden = function () {
    this.marke++;
    this.laeuft = false;
    this.spielt = false;
    this.hoert = false;
    if (this.uhr) { clearInterval(this.uhr); this.uhr = null; }
    if (this.nachspielUhr) { clearTimeout(this.nachspielUhr); this.nachspielUhr = null; }
    this.k.motor.allesStoppen();
    this.k.knopfBereit(false);
  };

  /** Play gedrueckt. */
  Level1.prototype.start = function () {
    if (!this.laeuft || this.spielt || this.k.rueckmeldung.laeuft) { return; }
    this.spielt = true;
    this.k.knopfBereit(true);
    this._vorspielenUndHoeren();
  };

  /** Stop gedrueckt. */
  Level1.prototype.stop = function () {
    if (!this.laeuft) { return; }
    this.marke++;
    this.spielt = false;
    this.hoert = false;
    if (this.nachspielUhr) { clearTimeout(this.nachspielUhr); this.nachspielUhr = null; }
    this.k.motor.allesStoppen();
    this.k.motor.erkennungZuruecksetzen();
    this.k.grifffeld.classList.remove('pulsiert');
    this.k.knopfBereit(false);
  };

  /* ---------------------------------------------------------------- */

  Level1.prototype._naechsterTon = function (nurZeigen) {
    if (!this.laeuft) { return; }
    this.zielTon = this.k.fortschritt.naechsterTon(this.letzterTon);
    this.letzterTon = this.zielTon;
    this.versuche = 0;
    this._zeigen();
    if (!nurZeigen && this.spielt) { this._vorspielenUndHoeren(); }
  };

  /** Note, Griffbild und Tier stehen da — auch bevor etwas erklingt. */
  Level1.prototype._zeigen = function () {
    var ton = this.k.tonById(this.zielTon);
    this.k.zeichneNote(null, this.zielTon);
    this.k.zeichneGriff(ton);
    this.k.zeigeTier(ton);
    this.k.grifffeld.style.visibility = 'visible';
    this.k.tierfeld.style.visibility = 'visible';
  };

  Level1.prototype._vorspielenUndHoeren = function () {
    this.k.motor.spieleTon(this.zielTon, { dauer: 1.35 });
    this.hoerenAb = this.k.motor.jetzt() + 1.7;
    this.hoert = true;
    this.letzterPegel = this.k.motor.jetzt();
    this.k.tracker.reset();

    /* Blaest das Kind sofort in den vorgespielten Ton hinein, waere das
     * fuer die Erkennung EIN durchgehender Ton, der schon vor dem
     * Zuhoeren begonnen hat — und wuerde deshalb nie gemeldet. Deshalb
     * wird die Erkennung genau dann noch einmal auf null gesetzt, wenn
     * das Vorspielen zu Ende ist. */
    var selbst = this, marke = this.marke;
    if (this.nachspielUhr) { clearTimeout(this.nachspielUhr); }
    this.nachspielUhr = setTimeout(function () {
      if (selbst._nochAktuell(marke) && selbst.hoert) { selbst.k.tracker.reset(); }
    }, 1750);
  };

  /* ---------------------------------------------------------------- */

  Level1.prototype.ereignisse = function (liste, pegelZeit) {
    if (!this.laeuft || !this.spielt || !this.hoert) { return; }
    if (this.k.rueckmeldung.laeuft) { return; }
    if (pegelZeit) { this.letzterPegel = pegelZeit; }
    for (var i = 0; i < liste.length; i++) {
      var e = liste[i];
      if (e.typ !== 'stabil') { continue; }
      if (e.t < this.hoerenAb) { continue; }           // das war die App selbst
      this._bewerten(e);
      return;
    }
  };

  Level1.prototype._bewerten = function (e) {
    var selbst = this, marke = this.marke;
    this.hoert = false;
    this.stilleInFolge = 0;
    var urteil = this.k.tracker.pruefeZiel(e.freq, this.zielTon);
    this.letztesUrteil = urteil;

    if (urteil.art === 'treffer') {
      this.k.fortschritt.notiere(this.zielTon, true);
      this.k.rueckmeldung.jubel().then(function () {
        if (selbst._nochAktuell(marke)) { selbst._naechsterTon(false); }
      });
      return;
    }

    if (urteil.art === 'naturton') {
      /* Richtiger Griff, falscher Naturton — die Lippen waren zu fest
       * oder zu locker. Das ist kein Fehlgriff und wird deshalb nicht
       * als Fehlversuch gezaehlt. Die sinkende Feder sagt: weicher
       * werden lassen. */
      this.k.rueckmeldung.feder(this.zielTon).then(function () {
        if (selbst._nochAktuell(marke)) { selbst._weiterHoeren(); }
      });
      return;
    }

    // Anderer Ton: der richtige Ton leuchtet auf und erklingt allein.
    this.k.fortschritt.notiere(this.zielTon, false);
    this.versuche++;
    var kopf = this.k.noten.querySelector('ellipse');
    var farbe = this.k.tonById(this.zielTon).farbe;
    this.k.rueckmeldung.einzelneNote(kopf, this.zielTon, farbe).then(function () {
      if (!selbst._nochAktuell(marke)) { return; }
      if (selbst.versuche >= MAX_VERSUCHE_JE_TON) { selbst._naechsterTon(false); }
      else { selbst._weiterHoeren(); }
    });
  };

  Level1.prototype._weiterHoeren = function () {
    if (!this.laeuft || !this.spielt) { return; }
    this.hoert = true;
    this.hoerenAb = this.k.motor.jetzt() + 0.25;
    this.letzterPegel = this.k.motor.jetzt();
    this.k.tracker.reset();
  };

  /* Nichts gehoert: kein Zeitlimit, kein Abbruch — nur der Zielton
   * noch einmal und ein pulsierendes Griffbild. Beim dritten Mal
   * lauter, weil die Floete dann vermutlich zu weit weg ist. */
  Level1.prototype._wache = function () {
    if (!this.laeuft || !this.spielt || !this.hoert) { return; }
    if (this.k.rueckmeldung.laeuft) { return; }
    var jetzt = this.k.motor.jetzt();
    if (jetzt - this.letzterPegel < STILLE_BIS_HILFE) { return; }
    var selbst = this, marke = this.marke;
    this.stilleInFolge++;
    this.hoert = false;
    this.k.rueckmeldung.nochmalHoeren(this.zielTon, this.stilleInFolge >= 3).then(function () {
      if (selbst._nochAktuell(marke)) { selbst._weiterHoeren(); }
    });
  };

  root.Level1 = Level1;
})(typeof globalThis !== 'undefined' ? globalThis : this);
