/* level2.js — Rhythmus. Stufe 2a (zwei Takte) und 2b (vier Takte).
 *
 * Die Uebung steht bereit, der Play-Knopf atmet. Ein Druck darauf:
 * vier Vorzaehler-Schlaege — der letzte ist ein gruenes GO — und dann
 * laeuft das Stueck IM TEMPO durch. Der Marker wandert mit dem Puls,
 * der Klick laeuft hoerbar mit, und jede Note, die zur rechten Zeit
 * richtig kommt, bekommt ihr gruenes Haekchen. Stop haelt jederzeit an.
 *
 * Zwei Betriebsarten, ueber die beiden Bilder in der Leiste waehlbar:
 *
 *   mitspielen  Die App spielt die Melodie mit. Das Kind hat etwas zum
 *               Anlehnen. Haekchen gibt es hier nicht — das Mikrofon
 *               hoert den eigenen Lautsprecher mit und koennte die App
 *               nicht vom Kind unterscheiden.
 *   solo        Nur der Klick laeuft. Jetzt zaehlt es, jetzt kommen die
 *               Haekchen.
 *
 * Eine neue Uebung startet von selbst in "mitspielen" und wechselt
 * danach auf "solo" — erst vormachen, dann selber. Die beiden Knoepfe
 * setzen das jederzeit ausser Kraft.
 */
(function (root) {
  'use strict';

  var SAUBER_BIS_HASE = 3;      // nach drei sauberen Durchlaeufen winkt der Hase
  var FENSTER_VOR = 0.5;        // Schlaege, die eine Note zu frueh kommen darf
  var FENSTER_NACH = 1.3;       // ... und zu spaet
  var NACHLAUF = 1.2;           // Sekunden Zugabe am Schluss

  function Level2(k) {
    this.k = k;
    this.stufe = '2a';
    this.laeuft = false;          // Level ist offen
    this.phase = 'aus';           // aus | bereit | vorzaehler | spielt | fertig
    this.modus = 'mit';
    this.melodie = null;
    this.seed = -1;
    this.letzterSeed = -1;
    this.letzteRhythmen = [];
    this.saubereInFolge = 0;
    this.marke = 0;
    this.bild = null;
    this.haken = [];
    this.zeiten = {};
    this.letzteAnnahme = 0;
    this.letzterAkzeptLauf = -1;
    this.mitGelaufen = false;
  }

  Level2.prototype._spaeter = function (fn, ms) {
    var selbst = this, marke = this.marke;
    return setTimeout(function () {
      if (selbst.marke === marke && selbst.laeuft) { fn(); }
    }, Math.max(0, ms));
  };
  Level2.prototype._nochAktuell = function (marke) {
    return this.marke === marke && this.laeuft;
  };

  /* ---------------------------------------------------------------- */

  Level2.prototype.starten = function (stufe) {
    this.marke++;
    this.stufe = stufe;
    this.laeuft = true;
    this.saubereInFolge = 0;
    this.letzteRhythmen = [];
    this.k.punkte.classList.remove('aus');
    this.k.tempo.zeigen(true);
    this.k.grifffeld.style.visibility = 'visible';
    this.k.tierfeld.style.visibility = 'hidden';
    this.modus = this.k.fortschritt.modus();
    this._neueUebung();
  };

  Level2.prototype.beenden = function () {
    this.marke++;
    this.laeuft = false;
    this.phase = 'aus';
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this.k.tempo.sperren(false);
    this.k.grifffeld.classList.remove('pulsiert');
    this.k.knopfBereit(false);
    this._punkteAus();
  };

  Level2.prototype.setzeModus = function (art) {
    this.modus = (art === 'solo') ? 'solo' : 'mit';
    this.k.fortschritt.setzeModus(this.modus);
    this.k.zeigeModus(this.modus);
  };

  /* ---------------------------------------------------------------- */
  /* Uebung waehlen und bereitlegen                                    */
  /* ---------------------------------------------------------------- */

  Level2.prototype._neueUebung = function (wiederholen) {
    if (!this.laeuft) { return; }

    if (!wiederholen) {
      var vorrat = this.k.fortschritt.vorrat();
      var lied = this.k.liedFuer(this.stufe, vorrat);
      if (lied) {
        this.melodie = lied;
        this.seed = lied.seed;
      } else {
        this.seed = this.k.fortschritt.naechsteUebung(this.stufe, this.letzterSeed);
        this.melodie = root.Generator.erzeuge({
          toene: this.k.toene, vorratIds: vorrat, stufe: this.stufe,
          seed: this.seed, vermeideRhythmus: this.letzteRhythmen
        });
      }
      this.letzterSeed = this.seed;
      if (!this.melodie) { return; }
      if (this.melodie.rhythmus) {
        this.letzteRhythmen.push(this.melodie.rhythmus);
        while (this.letzteRhythmen.length > 2) { this.letzteRhythmen.shift(); }
      }
      // Eine frische Uebung wird erst vorgemacht, dann selbst gespielt.
      this.mitGelaufen = false;
      this.setzeModus('mit');
    }

    this.haken = [];
    this.zeiten = {};
    /* Das Ergebnis gehoert zum abgeschlossenen Durchgang. Wird es hier
     * nicht geloescht, liest jeder, der danach fragt, noch das Ergebnis
     * der vorigen Uebung. */
    this.letztesErgebnis = null;
    this.phase = 'bereit';
    this._zeichnen(-1);
    this._griffFuerKlingend(0);
    this.k.tempo.sperren(false);
    this.k.knopfBereit(false);
    this._punkteAus();
  };

  /* ---------------------------------------------------------------- */
  /* Start und Stop                                                    */
  /* ---------------------------------------------------------------- */

  Level2.prototype.start = function () {
    if (!this.laeuft || this.phase !== 'bereit' || this.k.rueckmeldung.laeuft) { return; }
    if (!this.melodie) { return; }
    this.phase = 'vorzaehler';
    this.k.knopfBereit(true);
    this.k.tempo.sperren(true);

    var bpm = this.k.tempo.bpm;
    var schlag = 60 / bpm;
    var t0 = this.k.motor.jetzt() + 0.35;
    this.startZeit = t0 + 4 * schlag;
    this.endeZeit = this.startZeit + this.melodie.schlaegeGesamt * schlag;

    // Vier Vorzaehler-Schlaege, der letzte ist das gruene GO.
    for (var s = 0; s < 4; s++) {
      this.k.motor.klick(t0 + s * schlag, s === 0);
      this._punktPlanen(s, t0 + s * schlag, s === 3);
    }
    // Der Puls laeuft durch das ganze Stueck.
    for (var b = 0; b < this.melodie.schlaegeGesamt; b++) {
      this.k.motor.klick(this.startZeit + b * schlag, b % 4 === 0, 0.85);
      this._punktPlanen(b % 4, this.startZeit + b * schlag, false);
    }
    if (this.modus === 'mit') {
      this.k.motor.spieleMelodie(this.melodie, bpm, { wann: this.startZeit, lautstaerke: 0.9 });
    }

    this.haken = [];
    this.zeiten = {};
    this.letzteAnnahme = 0;
    this.letzterAkzeptLauf = -1;
    this.k.tracker.reset();
    this.k.motor.erkennungZuruecksetzen();

    var selbst = this;
    this._spaeter(function () { selbst._laufen(bpm); },
                  (this.startZeit - this.k.motor.jetzt()) * 1000);
    this._spaeter(function () { selbst._auswerten(); },
                  (this.endeZeit - this.k.motor.jetzt() + NACHLAUF) * 1000);
  };

  Level2.prototype.stop = function () {
    if (!this.laeuft) { return; }
    this.marke++;                       // schneidet alle geplanten Rueckrufe ab
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    // Web Audio plant Klicks und Melodie im Voraus — ohne dies klingt
    // beim Stop alles weiter.
    this.k.motor.allesStoppen();
    this.k.motor.erkennungZuruecksetzen();
    this.k.knopfBereit(false);
    this._punkteAus();
    this._neueUebung(true);
  };

  /* ---------------------------------------------------------------- */
  /* Der Durchlauf: der Marker haengt am Puls, nicht am Kind           */
  /* ---------------------------------------------------------------- */

  Level2.prototype._laufen = function (bpm) {
    this.phase = 'spielt';
    var selbst = this;
    var schlag = 60 / bpm;
    var letzter = -2;
    var marke = this.marke;
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); }

    function rahmen() {
      if (!selbst._nochAktuell(marke) || selbst.phase !== 'spielt') { return; }
      var sj = (selbst.k.motor.jetzt() - selbst.startZeit) / schlag;
      var index = -1, kIndex = -1, k = 0;
      for (var i = 0; i < selbst.melodie.noten.length; i++) {
        var n = selbst.melodie.noten[i];
        if (sj >= n.schlag && sj < n.schlag + n.dauer) {
          index = i; kIndex = n.pause ? -1 : k; break;
        }
        if (!n.pause) { k++; }
      }
      if (index !== letzter) {
        letzter = index;
        selbst._zeichnen(index);
        if (kIndex >= 0) { selbst._griffFuerKlingend(kIndex); }
      }
      if (sj > selbst.melodie.schlaegeGesamt + 0.5) { return; }
      selbst.rahmen = requestAnimationFrame(rahmen);
    }
    this.rahmen = requestAnimationFrame(rahmen);
  };

  /* ---------------------------------------------------------------- */
  /* Erkennung: richtiger Ton zur richtigen Zeit                       */
  /* ---------------------------------------------------------------- */

  Level2.prototype.ereignisse = function (liste) {
    if (!this.laeuft || this.phase !== 'spielt') { return; }
    if (this.modus !== 'solo') { return; }        // beim Mitspielen wird nicht gewertet
    if (this.k.rueckmeldung.laeuft) { return; }

    for (var i = 0; i < liste.length; i++) {
      var e = liste[i];
      if (e.typ === 'kurz') { this._pruefeKlang(e.tonId, e.oktave, e.t, e.laufNr); }
      else if (e.typ === 'einsatz') {
        var jetzt = this.k.tracker.aktuelleKlasse();
        if (jetzt) { this._pruefeKlang(jetzt.tonId, jetzt.oktave, e.t, -jetzt.nr); }
      }
    }
  };

  Level2.prototype._pruefeKlang = function (tonId, oktave, t, laufNr) {
    if (t - this.letzteAnnahme < 0.18) { return; }
    if (laufNr === this.letzterAkzeptLauf) { return; }

    var kl = this.klingend();
    var schlag = 60 / this.k.tempo.bpm;
    var sj = (t - this.startZeit) / schlag;

    /* Ein falscher Naturton bei richtigem Griff ist kein Fehler — er
     * bringt nur kein Haekchen, weil er nun einmal nicht der erwartete
     * Ton ist. Waehrend eines laufenden Durchgangs wird bewusst nichts
     * eingeblendet: eine Animation mitten im Takt stoert mehr als sie
     * hilft. Die Rueckmeldung kommt in Level 1, wo Zeit dafuer ist. */
    void oktave;

    /* Die erste noch offene Note, deren Zeitfenster den Klang enthaelt
     * und deren Tonhoehe stimmt. Das Fenster ist bewusst grosszuegig
     * nach hinten: ein Kind kommt eher zu spaet als zu frueh. */
    for (var i = 0; i < kl.length; i++) {
      if (this.haken.indexOf(i) >= 0) { continue; }
      var b = kl[i].schlag;
      if (sj < b - FENSTER_VOR) { break; }        // noch nicht dran
      if (sj > b + FENSTER_NACH) { continue; }    // diese Note ist vorbei
      if (kl[i].tonId !== tonId) { continue; }
      this.letzteAnnahme = t;
      this.letzterAkzeptLauf = laufNr;
      this.haken.push(i);
      this.zeiten[i] = sj - b;
      this._zeichnenNurHaken();
      return;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Auswertung                                                        */
  /* ---------------------------------------------------------------- */

  Level2.prototype._auswerten = function () {
    if (this.phase !== 'spielt' && this.phase !== 'vorzaehler') { return; }
    this.phase = 'fertig';
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this._punkteAus();
    this.k.knopfBereit(false);
    this._zeichnen(-1);

    var selbst = this, marke = this.marke;
    var kl = this.klingend();

    /* Beim Mitspielen wird nicht bewertet — danach kommt der Solo-Durchgang. */
    if (this.modus === 'mit') {
      this.mitGelaufen = true;
      this.setzeModus('solo');
      this._spaeter(function () { selbst._neueUebung(true); }, 700);
      return;
    }

    var getroffen = this.haken.length;
    var alle = kl.length;
    this.letztesErgebnis = {
      getroffen: getroffen, noten: alle,
      urteil: { fall: getroffen >= alle ? 'sauber' : (getroffen === 0 ? 'nichts' : 'teils') }
    };
    this.k.fortschritt.notiereUebung(this.stufe, this.seed, alle - getroffen);

    if (getroffen >= alle) {
      // Nur ein wirklich vollstaendiger Solo-Durchgang zaehlt fuer den Tonvorrat.
      var gezaehlt = {};
      kl.forEach(function (n) {
        if (gezaehlt[n.tonId]) { return; }
        gezaehlt[n.tonId] = true;
        selbst.k.fortschritt.notiere(n.tonId, true);
      });
      this.saubereInFolge++;
      this.k.rueckmeldung.jubel().then(function () {
        if (!selbst._nochAktuell(marke)) { return; }
        selbst.k.tempo.sperren(false);
        if (selbst.saubereInFolge >= SAUBER_BIS_HASE) {
          selbst.saubereInFolge = 0;
          selbst.k.tempo.hasenWink();
        }
        selbst._neueUebung();
      });
      return;
    }

    /* Nicht alles gesessen: kein Summer, kein rotes Etwas — die Uebung
     * wird noch einmal vorgemacht und dann wieder bereitgelegt. */
    this.saubereInFolge = 0;
    this.setzeModus('mit');
    this.k.rueckmeldung.vorspielen(this.melodie, this.k.tempo.bpm, function (start) {
      selbst._markerMitlaufen(start, selbst.k.tempo.bpm);
    }).then(function () {
      if (!selbst._nochAktuell(marke)) { return; }
      selbst.k.tempo.sperren(false);
      selbst._neueUebung(true);
    });
  };

  /* ---------------------------------------------------------------- */
  /* Darstellung                                                       */
  /* ---------------------------------------------------------------- */

  Level2.prototype._zeichnen = function (markerIndex) {
    this.letzterMarker = markerIndex;
    this.bild = this.k.zeichneNote(this.melodie, null, markerIndex, this.haken);
    return this.bild;
  };
  Level2.prototype._zeichnenNurHaken = function () {
    this._zeichnen(this.letzterMarker === undefined ? -1 : this.letzterMarker);
  };

  Level2.prototype.klingend = function () {
    return this.melodie.noten.filter(function (n) { return !n.pause; });
  };

  Level2.prototype._griffFuerKlingend = function (kIndex) {
    var kl = this.klingend();
    var n = kl[Math.max(0, Math.min(kl.length - 1, kIndex))];
    if (n) { this.k.zeichneGriff(this.k.tonById(n.tonId)); }
  };

  Level2.prototype._punktPlanen = function (index, wann, istGo) {
    var selbst = this;
    this._spaeter(function () {
      var p = selbst.k.punkte.children[index];
      if (!p) { return; }
      if (istGo) { p.classList.add('los'); }
      else { p.style.backgroundColor = 'var(--marker)'; p.classList.add('an'); }
      setTimeout(function () {
        p.classList.remove('an');
        p.classList.remove('los');
        p.style.backgroundColor = '';
      }, istGo ? 420 : 190);
    }, (wann - this.k.motor.jetzt()) * 1000);
  };

  Level2.prototype._punkteAus = function () {
    for (var i = 0; i < this.k.punkte.children.length; i++) {
      var p = this.k.punkte.children[i];
      p.classList.remove('an');
      p.classList.remove('los');
      p.style.backgroundColor = '';
    }
  };

  /** Marker beim Vormachen nach einem unvollstaendigen Durchgang. */
  Level2.prototype._markerMitlaufen = function (start, bpm) {
    var selbst = this;
    var schlag = 60 / bpm;
    var letzter = -2;
    var marke = this.marke;
    function rahmen() {
      if (!selbst._nochAktuell(marke)) { return; }
      var sj = (selbst.k.motor.jetzt() - start) / schlag;
      var index = -1, k = 0, kIndex = -1;
      for (var i = 0; i < selbst.melodie.noten.length; i++) {
        var n = selbst.melodie.noten[i];
        if (sj >= n.schlag && sj < n.schlag + n.dauer) { index = i; kIndex = n.pause ? -1 : k; break; }
        if (!n.pause) { k++; }
      }
      if (index !== letzter) {
        letzter = index;
        selbst._zeichnen(index);
        if (kIndex >= 0) { selbst._griffFuerKlingend(kIndex); }
      }
      if (sj > selbst.melodie.schlaegeGesamt + 0.5) { selbst._zeichnen(-1); return; }
      requestAnimationFrame(rahmen);
    }
    requestAnimationFrame(rahmen);
  };

  root.Level2 = Level2;
})(typeof globalThis !== 'undefined' ? globalThis : this);
