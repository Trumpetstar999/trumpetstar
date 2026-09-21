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

  /* Wie lange nach dem eigenen Klang noch nicht zugehoert wird. Deckt
   * den Nachhall des Zimmers ab; die Laufzeit des Lautsprechers steckt
   * schon in motor.eigenerKlangBis(). */
  var NACHHALL_RAND = 0.30;

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
    this.k.grifffeld.classList.remove('pulsiert');
    /* Auch hier: geplante Toene verstummen nicht von selbst. */
    this.k.motor.allesStoppen();
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
    var wann = this.k.motor.spieleTon(this.zielTon, { dauer: 1.35 });
    this.hoerenAb = this._abWannZuhoeren(1.7, wann, 1.35);
    this.hoert = true;
    this.letzterPegel = this.k.motor.jetzt();
    this.k.tracker.reset();

    /* Blaest das Kind sofort in den vorgespielten Ton hinein, waere das
     * fuer die Erkennung EIN durchgehender Ton, der schon vor dem
     * Zuhoeren begonnen hat — und wuerde deshalb nie gemeldet. Deshalb
     * wird die Erkennung genau dann noch einmal auf null gesetzt, wenn
     * das Vorspielen zu Ende ist. Der Zeitpunkt ist derselbe, ab dem
     * ueberhaupt zugehoert wird. */
    var selbst = this, marke = this.marke;
    if (this.nachspielUhr) { clearTimeout(this.nachspielUhr); }
    this.nachspielUhr = setTimeout(function () {
      if (selbst._nochAktuell(marke) && selbst.hoert) { selbst.k.tracker.reset(); }
    }, Math.max(0, (this.hoerenAb - this.k.motor.jetzt()) * 1000) + 50);
  };

  /* Ab wann darf gezaehlt werden, was das Mikrofon hoert?
   *
   * Erst wenn der eigene Vorspielton verklungen UND beim Mikrofon
   * angekommen ist. Frueher stand hier eine feste Zahl (1,7 s). Die war
   * schon ohne Lautsprecher 30 ms zu kurz — der Ton endet nach 1,73 s —
   * und ueber eine Bluetooth-Box um deren ganze Laufzeit. Ab etwa einer
   * halben Sekunde Laufzeit hoerte die App sich selbst und lobte das
   * Kind fuer den eigenen Ton.
   *
   * Der Motor weiss, wann sein Klang endet und wie lange der Ausgabeweg
   * braucht. Dazu kommt ein fester Rand fuer den Nachhall des Zimmers.
   * Die Untergrenze bleibt, damit sich am gewohnten Ablauf nichts
   * aendert, solange kein Grund dafuer besteht. */
  Level1.prototype._abWannZuhoeren = function (mindestens, wann, dauer) {
    var jetzt = this.k.motor.jetzt();
    var frueheste = jetzt + (mindestens != null ? mindestens : 1.7);
    if (wann == null) { return frueheste; }
    return Math.max(frueheste,
                    this.k.motor.klangEndeAmMikrofon(wann, dauer) + NACHHALL_RAND);
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

    if (urteil.art === 'ueberblasen') {
      // Kein Fehlversuch. Nur: die Luft darf sanfter werden.
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
    /* Nach einer Rueckmeldung: die hat gerade selbst geklungen, und
     * genau dann ist spieltBis aktuell und nicht veraltet. */
    this.hoerenAb = Math.max(this.k.motor.jetzt() + 0.25,
                             this.k.motor.spieltBis + this.k.motor.ausgabeVerzug() + NACHHALL_RAND);
    this.letzterPegel = this.k.motor.jetzt();
    this.k.tracker.reset();
  };

  /* Nichts gehoert: kein Zeitlimit, kein Abbruch — nur der Zielton
   * noch einmal und ein pulsierendes Griffbild. Beim dritten Mal
   * lauter, weil die Trompete dann vermutlich zu weit weg ist. */
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
