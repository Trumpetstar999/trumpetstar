/* fortschritt.js — was sitzt, was noch nicht, und was als naechstes drankommt.
 *
 * Alles liegt in localStorage, nichts verlaesst das Geraet. Geht der
 * Speicher verloren, faengt die App wortlos wieder bei h1 an — kein
 * Drama, keine Fehlermeldung (Auftrag 14).
 *
 * Das Kind sieht von alledem nichts: kein Punktestand, keine Anzeige,
 * keine Belehrung. Die Gewichtung wirkt still.
 */
(function (root, factory) {
  var F = factory();
  if (typeof module === 'object' && module.exports) { module.exports = F; }
  root.Fortschritt = F;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SCHLUESSEL = 'blockfloete.fortschritt.v1';
  var FENSTER = 8;        // "in den letzten acht Versuchen ..."
  var SITZT_AB = 6;       // "... mindestens sechsmal getroffen"
  /* Alle Toene aus toene.json duerfen mit der Zeit dazukommen —
   * die Reihenfolge steht dort, nicht hier. */
  var MAX_TOENE = 99;

  /* Startton und Richtung. Zwei Wege sind vorgesehen:
   *   'c1' — von c1 aus nach oben (Voreinstellung)
   *   'g1' — von g1 aus nach unten, danach die Toene oberhalb von g1
   * Alles andere faellt still auf 'c1' zurueck. */
  var STARTTOENE = { c1: 'auf', g1: 'ab' };

  /** Freischaltreihenfolge aus Startton und Richtung. Die Zahl
   *  'freischaltReihenfolge' in toene.json wird dadurch ersetzt — der
   *  Weg durch die Toene haengt jetzt am Startton. */
  function reihenfolge(toene, startton) {
    var nachHoehe = toene.slice().sort(function (a, b) { return a.stufe - b.stufe; });
    var start = STARTTOENE[startton] ? startton : 'c1';
    var idx = -1;
    for (var i = 0; i < nachHoehe.length; i++) {
      if (nachHoehe[i].id === start) { idx = i; break; }
    }
    if (idx < 0) { return nachHoehe; }
    var folge = [], rest = [], j;
    if (STARTTOENE[start] === 'ab') {
      for (j = idx; j >= 0; j--) { folge.push(nachHoehe[j]); }
      for (j = idx + 1; j < nachHoehe.length; j++) { rest.push(nachHoehe[j]); }
    } else {
      for (j = idx; j < nachHoehe.length; j++) { folge.push(nachHoehe[j]); }
      for (j = idx - 1; j >= 0; j--) { rest.push(nachHoehe[j]); }
    }
    return folge.concat(rest);
  }

  function Fortschritt(opt) {
    this.alleToene = opt.toene.slice();
    this.speicher = opt.speicher || null;
    this.zufall = opt.zufall || Math.random;
    this.toene = reihenfolge(this.alleToene, 'c1');
    this.stand = this._laden();
    this.toene = reihenfolge(this.alleToene, this.stand.startton);
  }

  Fortschritt.prototype._frisch = function () {
    return {
      vorrat: [this.toene[0].id],       // der Startton allein
      versuche: {},                     // tonId -> Array aus 0/1, juengstes hinten
      uebungen: {},                     // "stufe:seed" -> { versuche, fehler }
      tempo: 45,
      letztesLevel: null,
      stimmung: 'B',
      modus: 'mit',
      startton: 'c1',
      handbetrieb: false                // true, wenn Eltern den Vorrat gesetzt haben
    };
  };


  Fortschritt.prototype._laden = function () {
    if (!this.speicher) { return this._frisch(); }
    try {
      var roh = this.speicher.getItem(SCHLUESSEL);
      if (!roh) { return this._frisch(); }
      var s = JSON.parse(roh);
      if (!s || !Array.isArray(s.vorrat) || !s.vorrat.length) { return this._frisch(); }
      // Unbekannte Ton-IDs (z. B. nach einer Aenderung an toene.json) still wegwerfen
      var bekannt = this.toene.map(function (t) { return t.id; });
      s.vorrat = s.vorrat.filter(function (id) { return bekannt.indexOf(id) >= 0; });
      if (!s.vorrat.length) { return this._frisch(); }
      s.versuche = s.versuche || {};
      s.uebungen = s.uebungen || {};
      s.tempo = typeof s.tempo === 'number' ? s.tempo : 45;
      // Aeltere Staende kannten 60 als Untergrenze
      if (s.tempo < 45) { s.tempo = 45; }
      if (s.stimmung !== 'C') { s.stimmung = 'B'; }
      if (s.modus !== 'solo') { s.modus = 'mit'; }
      if (!STARTTOENE[s.startton]) { s.startton = 'c1'; }

      return s;
    } catch (e) {
      return this._frisch();
    }
  };

  Fortschritt.prototype._sichern = function () {
    if (!this.speicher) { return; }
    try { this.speicher.setItem(SCHLUESSEL, JSON.stringify(this.stand)); }
    catch (e) { /* voller Speicher ist kein Grund, das Kind zu stoeren */ }
  };

  /* ---------------------------------------------------------------- */

  Fortschritt.prototype.vorrat = function () { return this.stand.vorrat.slice(); };

  Fortschritt.prototype.trefferquote = function (tonId) {
    var v = this.stand.versuche[tonId];
    if (!v || !v.length) { return null; }
    var summe = 0;
    for (var i = 0; i < v.length; i++) { summe += v[i]; }
    return summe / v.length;
  };

  Fortschritt.prototype.sitzt = function (tonId) {
    var v = this.stand.versuche[tonId];
    if (!v || v.length < FENSTER) { return false; }
    var summe = 0;
    for (var i = 0; i < v.length; i++) { summe += v[i]; }
    return summe >= SITZT_AB;
  };

  /** Ein Versuch wird notiert. Ueberblasen zaehlt weder als Treffer noch
   *  als Fehlversuch — es ist ein eigener Fall und soll nicht bestrafen. */
  Fortschritt.prototype.notiere = function (tonId, treffer) {
    if (treffer === null || treffer === undefined) { return; }
    var v = this.stand.versuche[tonId] || (this.stand.versuche[tonId] = []);
    v.push(treffer ? 1 : 0);
    while (v.length > FENSTER) { v.shift(); }
    this._vielleichtFreischalten();
    this._sichern();
  };

  /** Der naechste Ton kommt still dazu, sobald alle bisherigen sitzen.
   *  Kein Freischalt-Bildschirm, kein Hinweis — er ist einfach da. */
  Fortschritt.prototype._vielleichtFreischalten = function () {
    if (this.stand.handbetrieb) { return false; }
    if (this.stand.vorrat.length >= MAX_TOENE) { return false; }
    for (var i = 0; i < this.stand.vorrat.length; i++) {
      if (!this.sitzt(this.stand.vorrat[i])) { return false; }
    }
    for (var j = 0; j < this.toene.length; j++) {
      if (this.stand.vorrat.indexOf(this.toene[j].id) < 0) {
        this.stand.vorrat.push(this.toene[j].id);
        return true;
      }
    }
    return false;
  };

  /* ---------------------------------------------------------------- */
  /* Gewichtete Tonauswahl (Auftrag 5 / 14)                            */
  /* ---------------------------------------------------------------- */

  Fortschritt.prototype.naechsterTon = function (letzterTon) {
    var vorrat = this.stand.vorrat;
    if (vorrat.length === 1) { return vorrat[0]; }

    var kandidaten = vorrat.filter(function (id) { return id !== letzterTon; });
    if (!kandidaten.length) { kandidaten = vorrat.slice(); }

    var gewichte = [], summe = 0;
    for (var i = 0; i < kandidaten.length; i++) {
      var q = this.trefferquote(kandidaten[i]);
      // Noch nie gespielt → hoechstes Gewicht; sitzt sicher → niedrigstes.
      var g = 1 + 3 * (1 - (q === null ? 0 : q));
      gewichte.push(g); summe += g;
    }
    var w = this.zufall() * summe;
    for (var j = 0; j < kandidaten.length; j++) {
      w -= gewichte[j];
      if (w <= 0) { return kandidaten[j]; }
    }
    return kandidaten[kandidaten.length - 1];
  };

  /* ---------------------------------------------------------------- */
  /* Uebungen (Level 2)                                                */
  /* ---------------------------------------------------------------- */

  Fortschritt.prototype.notiereUebung = function (stufe, seed, fehler) {
    var k = stufe + ':' + seed;
    var u = this.stand.uebungen[k] || (this.stand.uebungen[k] = { versuche: 0, fehler: 0 });
    u.versuche++;
    if (fehler > 0) { u.fehler++; }
    // Speicher nicht unbegrenzt wachsen lassen
    var schluessel = Object.keys(this.stand.uebungen);
    if (schluessel.length > 300) {
      var sauber = schluessel.filter(function (s) {
        return this.stand.uebungen[s].fehler > 0;
      }, this).slice(-200);
      var neu = {};
      sauber.forEach(function (s) { neu[s] = this.stand.uebungen[s]; }, this);
      neu[k] = u;
      this.stand.uebungen = neu;
    }
    this._sichern();
  };

  /** Verpasste Uebungen kommen still oefter dran — aber nie direkt
   *  hintereinander dieselbe. */
  Fortschritt.prototype.naechsteUebung = function (stufe, letzterSeed) {
    var offene = [];
    for (var k in this.stand.uebungen) {
      if (k.indexOf(stufe + ':') !== 0) { continue; }
      var seed = parseInt(k.slice(stufe.length + 1), 10);
      if (seed === letzterSeed) { continue; }
      var u = this.stand.uebungen[k];
      if (u.fehler > 0) { offene.push({ seed: seed, gewicht: u.fehler }); }
    }
    if (offene.length && this.zufall() < 0.35) {
      var summe = 0, i;
      for (i = 0; i < offene.length; i++) { summe += offene[i].gewicht; }
      var w = this.zufall() * summe;
      for (i = 0; i < offene.length; i++) {
        w -= offene[i].gewicht;
        if (w <= 0) { return offene[i].seed; }
      }
    }
    var neu;
    do { neu = Math.floor(this.zufall() * 1000000); } while (neu === letzterSeed);
    return neu;
  };

  /* ---------------------------------------------------------------- */

  Fortschritt.prototype.tempo = function () { return this.stand.tempo; };
  Fortschritt.prototype.setzeTempo = function (bpm) {
    this.stand.tempo = bpm; this._sichern();
  };
  /* B- oder C-Trompete. Verschiebt die Frequenzen, auf die das Mikrofon
   * hoert, um zwei Halbtoene — Griffe und Notenbild bleiben gleich. */
  Fortschritt.prototype.stimmung = function () { return this.stand.stimmung || 'B'; };
  Fortschritt.prototype.setzeStimmung = function (art) {
    this.stand.stimmung = (art === 'C') ? 'C' : 'B';
    this._sichern();
  };

  /* Mitspielen oder solo. */
  Fortschritt.prototype.modus = function () { return this.stand.modus || 'mit'; };
  Fortschritt.prototype.setzeModus = function (art) {
    this.stand.modus = (art === 'solo') ? 'solo' : 'mit';
    this._sichern();
  };

  /* Startton: 'c1' (dann nach oben) oder 'g1' (dann nach unten).
   * Wird er gewechselt, faengt der Tonvorrat wieder beim neuen
   * Startton an — sonst stuende das Kind mitten in der alten Folge. */
  Fortschritt.prototype.startton = function () { return this.stand.startton || 'c1'; };
  Fortschritt.prototype.setzeStartton = function (id) {
    var neu = STARTTOENE[id] ? id : 'c1';
    if (neu === this.startton()) { return; }
    this.stand.startton = neu;
    this.toene = reihenfolge(this.alleToene, neu);
    this.stand.vorrat = [this.toene[0].id];
    this.stand.handbetrieb = false;
    this._sichern();
  };

  /** Die Toene in der Reihenfolge, in der sie freigeschaltet werden. */
  Fortschritt.prototype.reihenfolge = function () { return this.toene.slice(); };



  Fortschritt.prototype.letztesLevel = function () { return this.stand.letztesLevel; };
  Fortschritt.prototype.setzeLetztesLevel = function (id) {
    this.stand.letztesLevel = id; this._sichern();
  };

  /* Eltern-Bereich --------------------------------------------------- */

  /** Setzt den Tonumfang von Hand. Ab dann schaltet die App nichts mehr
   *  selbst dazu — bis `automatik()` sie wieder loslaesst. */
  Fortschritt.prototype.setzeVorrat = function (ids, automatischWeiter) {
    var bekannt = this.toene.map(function (t) { return t.id; });
    var sauber = ids.filter(function (id) { return bekannt.indexOf(id) >= 0; });
    if (!sauber.length) { return false; }
    // in der Reihenfolge der Freischaltung ablegen, nicht in Klickfolge
    var reihenfolge = this.toene.map(function (t) { return t.id; });
    sauber.sort(function (a, b) { return reihenfolge.indexOf(a) - reihenfolge.indexOf(b); });
    this.stand.vorrat = sauber;
    this.stand.handbetrieb = !automatischWeiter;
    this._sichern();
    return true;
  };

  /** Einen einzelnen Ton an- oder abschalten. Der letzte verbliebene
   *  Ton laesst sich nicht abschalten — ohne Ton gibt es nichts zu ueben. */
  Fortschritt.prototype.tonUmschalten = function (id) {
    var drin = this.stand.vorrat.indexOf(id) >= 0;
    var neu = drin
      ? this.stand.vorrat.filter(function (x) { return x !== id; })
      : this.stand.vorrat.concat([id]);
    if (!neu.length) { return false; }
    return this.setzeVorrat(neu);
  };

  Fortschritt.prototype.handbetrieb = function () { return !!this.stand.handbetrieb; };

  /** Gibt die Steuerung des Tonumfangs wieder an die App zurueck. */
  Fortschritt.prototype.automatik = function () {
    this.stand.handbetrieb = false;
    this._vielleichtFreischalten();
    this._sichern();
  };

  Fortschritt.prototype.zuruecksetzen = function () {
    this.stand = this._frisch();
    this._sichern();
  };

  Fortschritt.prototype.bericht = function () {
    return this.toene.map(function (t) {
      var v = this.stand.versuche[t.id] || [];
      var treffer = v.reduce(function (a, b) { return a + b; }, 0);
      return {
        id: t.id, farbe: t.farbe, versuche: v.length, treffer: treffer,
        quote: v.length ? treffer / v.length : null,
        sitzt: this.sitzt(t.id),
        imVorrat: this.stand.vorrat.indexOf(t.id) >= 0
      };
    }, this);
  };

  Fortschritt.SCHLUESSEL = SCHLUESSEL;
  Fortschritt.FENSTER = FENSTER;
  Fortschritt.SITZT_AB = SITZT_AB;
  return Fortschritt;
});
