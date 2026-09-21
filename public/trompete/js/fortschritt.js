/* fortschritt.js — was sitzt, was noch nicht, und was als naechstes drankommt.
 *
 * Alles liegt in localStorage, nichts verlaesst das Geraet. Geht der
 * Speicher verloren, faengt die App wortlos wieder bei c1 an — kein
 * Drama, keine Fehlermeldung.
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

  var SCHLUESSEL = 'trompete.fortschritt.v1';
  /* Wie streng die App zuhoert. Die Zahlen dahinter stehen in
   * toene.json; hier steht nur, welche Stufe gewaehlt ist. Voreinstellung
   * ist die leichteste — wer gerade anfaengt, soll Haekchen bekommen. */
  var STUFEN = ['superleicht', 'leicht', 'mittel', 'schwer'];
  var FENSTER = 8;        // "in den letzten acht Versuchen ..."
  var SITZT_AB = 6;       // "... mindestens sechsmal getroffen"
  /* Alle Toene aus toene.json duerfen mit der Zeit dazukommen —
   * die Reihenfolge steht dort, nicht hier. */
  var MAX_TOENE = 99;

  /* Zwei getrennte Fortschritte.
   *
   *   '1'  Level 1 — einzelne Toene halten
   *   '2'  Level 2 und 3 — dieselben Toene im Rhythmus
   *
   * Warum getrennt: einen Ton treffen und ihn im Takt treffen sind zwei
   * verschiedene Faehigkeiten. Wer in Level 1 bei allen neun Toenen
   * angekommen ist, faengt in Level 2 trotzdem wieder bei c1 an —
   * sonst stuende das Kind beim ersten Rhythmusstueck sofort vor dem
   * vollen Tonumfang.
   *
   * Level 2 und 3 teilen sich EINEN Fortschritt: dort ist der Ton
   * schon im Takt gesessen, nur die Uebung wird laenger. Was in Level 2
   * erarbeitet wurde, gilt in Level 3 weiter.
   *
   * Die Trefferstatistik gehoert mit in den Bereich. Laege sie
   * gemeinsam, waere in Level 2 sofort alles freigeschaltet: die Toene
   * "sitzen" ja schon aus Level 1. */
  var BEREICHE = ['1', '2'];

  /** Level-Name zu Bereich. '1' ist Level 1, alles andere ('2a', '2b')
   *  teilt sich den zweiten Bereich. */
  function bereichVon(level) { return level === '1' ? '1' : '2'; }

  function Fortschritt(opt) {
    this.toene = opt.toene.slice().sort(function (a, b) {
      return a.freischaltReihenfolge - b.freischaltReihenfolge;
    });
    this.speicher = opt.speicher || null;
    this.zufall = opt.zufall || Math.random;
    this.stand = this._laden();
    this.aktuell = '1';
  }

  /** Sagt, welcher Bereich gerade geuebt wird. Wird beim Start eines
   *  Levels gesetzt; alle folgenden Aufrufe beziehen sich darauf. */
  Fortschritt.prototype.setzeBereich = function (level) {
    this.aktuell = bereichVon(level);
  };
  Fortschritt.prototype.bereich = function () { return this.aktuell; };

  Fortschritt.prototype._b = function (bereich) {
    var name = bereich ? bereichVon(bereich) : this.aktuell;
    return this.stand.bereiche[name];
  };

  Fortschritt.prototype._frischerBereich = function () {
    return {
      vorrat: [this.toene[0].id],       // c1 allein
      versuche: {}                      // tonId -> Array aus 0/1, juengstes hinten
    };
  };

  Fortschritt.prototype._frisch = function () {
    return {
      bereiche: { '1': this._frischerBereich(), '2': this._frischerBereich() },
      uebungen: {},                     // "stufe:seed" -> { versuche, fehler }
      tempo: 45,
      letztesLevel: null,
      notenfarbe: 'bunt',
      buchNotenfarbe: 'schwarz',        // im Buch wie im Druck: schwarz
      schwierigkeit: 'superleicht',
      sprache: 'de',
      modus: 'mit',
      handbetrieb: false,               // true, wenn Eltern den Vorrat gesetzt haben
      buch: { zuletzt: null, stimme: {}, st: {} }
    };
  };

  Fortschritt.prototype._laden = function () {
    if (!this.speicher) { return this._frisch(); }
    try {
      var roh = this.speicher.getItem(SCHLUESSEL);
      if (!roh) { return this._frisch(); }
      var s = JSON.parse(roh);
      if (!s) { return this._frisch(); }

      /* Ein Stand aus der Zeit vor den getrennten Bereichen: was darin
       * steht, ist in Level 1 erarbeitet worden. Es wandert dorthin,
       * und Level 2 faengt frisch an — genau das, was ohnehin gelten
       * soll. */
      if (Array.isArray(s.vorrat)) {
        s.bereiche = { '1': { vorrat: s.vorrat, versuche: s.versuche || {} },
                       '2': this._frischerBereich() };
        delete s.vorrat;
        delete s.versuche;
      }
      if (!s.bereiche) { return this._frisch(); }

      // Unbekannte Ton-IDs (z. B. nach einer Aenderung an toene.json) still wegwerfen
      var bekannt = this.toene.map(function (t) { return t.id; });
      var selbst = this;
      for (var bi = 0; bi < BEREICHE.length; bi++) {
        var b = s.bereiche[BEREICHE[bi]];
        if (!b || !Array.isArray(b.vorrat)) { b = s.bereiche[BEREICHE[bi]] = this._frischerBereich(); }
        b.vorrat = b.vorrat.filter(function (id) { return bekannt.indexOf(id) >= 0; });
        if (!b.vorrat.length) { b.vorrat = [selbst.toene[0].id]; }
        b.versuche = b.versuche || {};
      }
      s.uebungen = s.uebungen || {};
      s.tempo = typeof s.tempo === 'number' ? s.tempo : 45;
      // Aeltere Staende kannten 60 als Untergrenze
      if (s.tempo < 45) { s.tempo = 45; }
      if (STUFEN.indexOf(s.schwierigkeit) < 0) { s.schwierigkeit = 'superleicht'; }
      if (['de', 'en', 'es'].indexOf(s.sprache) < 0) { s.sprache = 'de'; }
      if (s.modus !== 'solo') { s.modus = 'mit'; }
      // Staende aus der Zeit vor dem Buch kennen es noch nicht.
      if (!s.buch || typeof s.buch !== 'object') { s.buch = {}; }
      s.buch.zuletzt = typeof s.buch.zuletzt === 'string' ? s.buch.zuletzt : null;
      if (!s.buch.stimme || typeof s.buch.stimme !== 'object') { s.buch.stimme = {}; }
      if (!s.buch.st || typeof s.buch.st !== 'object') { s.buch.st = {}; }
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

  Fortschritt.prototype.vorrat = function (bereich) { return this._b(bereich).vorrat.slice(); };

  Fortschritt.prototype.trefferquote = function (tonId, bereich) {
    var v = this._b(bereich).versuche[tonId];
    if (!v || !v.length) { return null; }
    var summe = 0;
    for (var i = 0; i < v.length; i++) { summe += v[i]; }
    return summe / v.length;
  };

  Fortschritt.prototype.sitzt = function (tonId, bereich) {
    var v = this._b(bereich).versuche[tonId];
    if (!v || v.length < FENSTER) { return false; }
    var summe = 0;
    for (var i = 0; i < v.length; i++) { summe += v[i]; }
    return summe >= SITZT_AB;
  };

  /** Ein Versuch wird notiert. Ueberblasen zaehlt weder als Treffer noch
   *  als Fehlversuch — es ist ein eigener Fall und soll nicht bestrafen. */
  Fortschritt.prototype.notiere = function (tonId, treffer, bereich) {
    if (treffer === null || treffer === undefined) { return; }
    var b = this._b(bereich);
    var v = b.versuche[tonId] || (b.versuche[tonId] = []);
    v.push(treffer ? 1 : 0);
    while (v.length > FENSTER) { v.shift(); }
    this._vielleichtFreischalten(bereich);
    this._sichern();
  };

  /** Der naechste Ton kommt still dazu, sobald alle bisherigen sitzen.
   *  Kein Freischalt-Bildschirm, kein Hinweis — er ist einfach da. */
  Fortschritt.prototype._vielleichtFreischalten = function (bereich) {
    if (this.stand.handbetrieb) { return false; }
    var b = this._b(bereich);
    if (b.vorrat.length >= MAX_TOENE) { return false; }
    for (var i = 0; i < b.vorrat.length; i++) {
      if (!this.sitzt(b.vorrat[i], bereich)) { return false; }
    }
    for (var j = 0; j < this.toene.length; j++) {
      if (b.vorrat.indexOf(this.toene[j].id) < 0) {
        b.vorrat.push(this.toene[j].id);
        return true;
      }
    }
    return false;
  };

  /* ---------------------------------------------------------------- */
  /* Gewichtete Tonauswahl (Auftrag 5 / 14)                            */
  /* ---------------------------------------------------------------- */

  Fortschritt.prototype.naechsterTon = function (letzterTon) {
    var vorrat = this._b().vorrat;
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
  /* Wie streng zugehoert wird — siehe STUFEN oben. */
  Fortschritt.prototype.schwierigkeit = function () {
    return STUFEN.indexOf(this.stand.schwierigkeit) >= 0
      ? this.stand.schwierigkeit : 'superleicht';
  };
  Fortschritt.prototype.setzeSchwierigkeit = function (stufe) {
    this.stand.schwierigkeit = STUFEN.indexOf(stufe) >= 0 ? stufe : 'superleicht';
    this._sichern();
  };
  Fortschritt.stufen = STUFEN;

  /* Bunte oder schwarze Noten und Griffbilder. Bunt ist der Einstieg,
   * schwarz das, was in jedem anderen Notenheft steht. */
  Fortschritt.prototype.notenfarbe = function () {
    return this.stand.notenfarbe === 'schwarz' ? 'schwarz' : 'bunt';
  };
  Fortschritt.prototype.setzeNotenfarbe = function (art) {
    this.stand.notenfarbe = (art === 'schwarz') ? 'schwarz' : 'bunt';
    this._sichern();
  };

  /* Im Buch gilt eine eigene Wahl, und sie steht von Haus aus auf
   * schwarz: das Kind hat die gedruckte Seite daneben liegen, und dort
   * sind die Noten schwarz. Bunt waere hier ein zweites Notenbild, das
   * es erst mit dem ersten vergleichen muesste. */
  Fortschritt.prototype.buchNotenfarbe = function () {
    return this.stand.buchNotenfarbe === 'bunt' ? 'bunt' : 'schwarz';
  };
  Fortschritt.prototype.setzeBuchNotenfarbe = function (art) {
    this.stand.buchNotenfarbe = (art === 'bunt') ? 'bunt' : 'schwarz';
    this._sichern();
  };

  /* Sprache des Elternbereichs — der einzige Text der App. Das Kind
   * bekommt davon nichts mit, es sieht nur Noten und Farben. */
  Fortschritt.prototype.sprache = function () {
    return ['de', 'en', 'es'].indexOf(this.stand.sprache) >= 0 ? this.stand.sprache : 'de';
  };
  Fortschritt.prototype.setzeSprache = function (code) {
    this.stand.sprache = ['de', 'en', 'es'].indexOf(code) >= 0 ? code : 'de';
    this._sichern();
  };

  /* Mitspielen oder solo. */
  Fortschritt.prototype.modus = function () { return this.stand.modus || 'mit'; };
  Fortschritt.prototype.setzeModus = function (art) {
    this.stand.modus = (art === 'solo') ? 'solo' : 'mit';
    this._sichern();
  };

  Fortschritt.prototype.letztesLevel = function () { return this.stand.letztesLevel; };
  Fortschritt.prototype.setzeLetztesLevel = function (id) {
    this.stand.letztesLevel = id; this._sichern();
  };

  /* Buch ------------------------------------------------------------ */
  /* Was im Buch geschafft ist. Nichts davon schaltet etwas frei, und
   * nichts fliesst in die Trefferquoten der Toene: im Buch ist die
   * Reihenfolge der Seiten der Lehrgang, und dort kommen Toene vor, die
   * Level 1 bis 3 gar nicht kennen.
   *
   *   buch.zuletzt       das zuletzt aufgeschlagene Stueck
   *   buch.stimme[id]    die zuletzt gewaehlte Stimme eines Duetts (0 oder 1)
   *   buch.st["id:s"]    { z: [1, 1, 0], g: 1 } — geschaffte Zeilen, und
   *                      ob das ganze Lied am Stueck geschafft ist */
  Fortschritt.prototype.buchStand = function (id, stimme) {
    var e = this.stand.buch.st[id + ':' + (stimme || 0)];
    return {
      zeilen: e && Array.isArray(e.z) ? e.z.map(function (x) { return !!x; }) : [],
      ganz: !!(e && e.g)
    };
  };

  Fortschritt.prototype._buchEintrag = function (id, stimme) {
    var schluessel = id + ':' + (stimme || 0);
    var e = this.stand.buch.st[schluessel] || (this.stand.buch.st[schluessel] = { z: [], g: 0 });
    if (!Array.isArray(e.z)) { e.z = []; }
    return e;
  };

  Fortschritt.prototype.notiereBuchZeile = function (id, stimme, zeile) {
    var e = this._buchEintrag(id, stimme);
    while (e.z.length <= zeile) { e.z.push(0); }
    e.z[zeile] = 1;
    this._sichern();
  };

  Fortschritt.prototype.notiereBuchGanz = function (id, stimme) {
    this._buchEintrag(id, stimme).g = 1;
    this._sichern();
  };

  /** Ist das Lied in irgendeiner Stimme ganz geschafft? */
  Fortschritt.prototype.buchGeschafft = function (id) {
    return this.buchStand(id, 0).ganz || this.buchStand(id, 1).ganz;
  };

  Fortschritt.prototype.buchZuletzt = function () { return this.stand.buch.zuletzt; };
  Fortschritt.prototype.buchStimme = function (id) { return this.stand.buch.stimme[id] === 1 ? 1 : 0; };
  Fortschritt.prototype.setzeBuchStueck = function (id, stimme) {
    this.stand.buch.zuletzt = id;
    this.stand.buch.stimme[id] = stimme === 1 ? 1 : 0;
    this._sichern();
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
    /* Von Hand gewaehlt gilt fuer BEIDE Bereiche. Die Trennung ist
     * eine Hilfe der Automatik; wer sie ausschaltet, sagt "das sind die
     * Toene, die mein Kind ueben soll" — und meint damit nicht nur
     * eines der Levels. */
    for (var i = 0; i < BEREICHE.length; i++) {
      this.stand.bereiche[BEREICHE[i]].vorrat = sauber.slice();
    }
    this.stand.handbetrieb = !automatischWeiter;
    this._sichern();
    return true;
  };

  /** Einen einzelnen Ton an- oder abschalten. Der letzte verbliebene
   *  Ton laesst sich nicht abschalten — ohne Ton gibt es nichts zu ueben. */
  Fortschritt.prototype.tonUmschalten = function (id) {
    var jetzt = this.vorratGesamt();
    var drin = jetzt.indexOf(id) >= 0;
    var neu = drin
      ? jetzt.filter(function (x) { return x !== id; })
      : jetzt.concat([id]);
    if (!neu.length) { return false; }
    return this.setzeVorrat(neu);
  };

  Fortschritt.prototype.handbetrieb = function () { return !!this.stand.handbetrieb; };

  /** Gibt die Steuerung des Tonumfangs wieder an die App zurueck. */
  Fortschritt.prototype.automatik = function () {
    this.stand.handbetrieb = false;
    for (var i = 0; i < BEREICHE.length; i++) { this._vielleichtFreischalten(BEREICHE[i]); }
    this._sichern();
  };

  /** Alle Toene, die in IRGENDEINEM Bereich dabei sind. Der
   *  Eltern-Bereich zeigt und schaltet damit — dort geht es um die
   *  Frage "welche Toene uebt mein Kind", nicht um einzelne Levels. */
  Fortschritt.prototype.vorratGesamt = function () {
    var aus = [];
    for (var i = 0; i < BEREICHE.length; i++) {
      var v = this.stand.bereiche[BEREICHE[i]].vorrat;
      for (var j = 0; j < v.length; j++) { if (aus.indexOf(v[j]) < 0) { aus.push(v[j]); } }
    }
    var reihenfolge = this.toene.map(function (t) { return t.id; });
    aus.sort(function (a, b) { return reihenfolge.indexOf(a) - reihenfolge.indexOf(b); });
    return aus;
  };

  Fortschritt.prototype.zuruecksetzen = function () {
    /* Die Sprache ueberlebt: sie ist kein Fortschritt, sondern die
     * Bedingung dafuer, dass die Eltern diesen Knopf ueberhaupt lesen
     * konnten. Ihn zu druecken darf sie nicht ins Deutsche zuruecksetzen. */
    var sprache = this.sprache();
    this.stand = this._frisch();
    this.stand.sprache = sprache;
    this._sichern();
  };

  /** Die Tabelle im Eltern-Bereich. Sie fasst beide Bereiche zusammen:
   *  gefragt ist dort, wie sicher das Kind einen Ton trifft, nicht in
   *  welchem Level es ihn getroffen hat. */
  Fortschritt.prototype.bericht = function () {
    var gesamt = this.vorratGesamt();
    return this.toene.map(function (t) {
      var v = [];
      for (var i = 0; i < BEREICHE.length; i++) {
        v = v.concat(this.stand.bereiche[BEREICHE[i]].versuche[t.id] || []);
      }
      var treffer = v.reduce(function (a, b) { return a + b; }, 0);
      return {
        id: t.id, farbe: t.farbe, versuche: v.length, treffer: treffer,
        quote: v.length ? treffer / v.length : null,
        sitzt: this.sitzt(t.id, '1') || this.sitzt(t.id, '2'),
        imVorrat: gesamt.indexOf(t.id) >= 0
      };
    }, this);
  };

  Fortschritt.SCHLUESSEL = SCHLUESSEL;
  Fortschritt.FENSTER = FENSTER;
  Fortschritt.SITZT_AB = SITZT_AB;
  return Fortschritt;
});
