/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/fortschritt.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* fortschritt.js — was sitzt, was noch nicht, und was als naechstes drankommt.
 *
 * Alles liegt in localStorage, nichts verlaesst das Geraet. Geht der
 * Speicher verloren, faengt die App wieder bei c1 an — kein Drama,
 * keine Fehlermeldung.
 *
 * Hier liegen auch die Einstellungen: Tonmaterial, Strenge, Hilfen im
 * Notenbild und was im Rhythmus-Training zuletzt gewaehlt war.
 */
(function (root, factory) {
  var F = factory();
  if (typeof module === 'object' && module.exports) { module.exports = F; }
  root.Fortschritt = F;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* Eigener Schluessel: liegt die Fassung fuer Erwachsene einmal auf
   * derselben Adresse wie die Kinderfassung, duerfen sich die beiden
   * Staende nicht gegenseitig ueberschreiben. */
  var SCHLUESSEL = 'trompete-erwachsene.fortschritt.v1';
  var TEMPO_MIN = 40, TEMPO_START = 60;
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
   *   '1'  Toene — einzelne Toene treffen und halten
   *   '2'  Rhythmus und Melodien — dieselben Toene im Takt
   *
   * Warum getrennt: einen Ton treffen und ihn im Takt treffen sind zwei
   * verschiedene Faehigkeiten. Wer bei den Einzeltoenen schon weit
   * gekommen ist, faengt im Takt trotzdem wieder bei c1 an — sonst
   * stuende beim ersten Stueck sofort der ganze Umfang auf dem Blatt.
   *
   * Rhythmus-Training und beide Melodie-Laengen teilen sich EINEN
   * Fortschritt: dort ist der Ton schon im Takt gesessen, nur die
   * Uebung wird laenger.
   *
   * Die Trefferstatistik gehoert mit in den Bereich. Laege sie
   * gemeinsam, waere im zweiten Bereich sofort alles freigeschaltet:
   * die Toene "sitzen" ja schon aus dem ersten.
   *
   * Das alles gilt nur, solange die Automatik das Tonmaterial fuehrt.
   * Wer es in den Einstellungen selbst waehlt, waehlt fuer beide. */
  var BEREICHE = ['1', '2'];

  /** Level-Name zu Bereich. '1' sind die Einzeltoene, alles andere
   *  ('r', '2a', '2b') teilt sich den zweiten Bereich. */
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
      tempo: TEMPO_START,
      letztesLevel: null,
      notenfarbe: 'schwarz',
      schwierigkeit: 'superleicht',
      sprache: 'de',
      modus: 'mit',
      handbetrieb: false,               // true, wenn das Tonmaterial von Hand gewaehlt ist
      hilfen: { namen: true, zaehlen: true },
      rhythmus: frischerRhythmus(),
      latenz: null,                     // Sekunden; null = noch nie gemessen
      songs: frischeSongs(),
      videos: frischeVideos()
    };
  };

  /* Was im Rhythmus-Training gewaehlt ist. Der Einstieg ist bewusst
   * schmal: Halbe und Viertel auf einem Ton, den jeder Anfaenger hat. */
  function frischerRhythmus() {
    return {
      zaehler: 4,                       // 2, 3 oder 4 Viertel je Takt
      takte: 2,                         // 2 oder 4
      bausteine: ['halbe', 'viertel'],
      material: 'einton',               // 'einton' | 'vorrat'
      ton: 'c1',
      eingabe: 'trompete'               // 'trompete' | 'tippen'
    };
  }

  /* Lieder: welche Fassung zuletzt lief, in welchem Tempo jedes Lied
   * zuletzt geuebt wurde und wie oft es bis zum Ende durchlief. Das
   * Tempo wird JE LIED gemerkt — wer ein Stueck von 60 auf 100 Prozent
   * hocharbeitet, will beim naechsten Oeffnen dort weitermachen. */
  function frischeSongs() {
    return { fassung: 'voll', tempo: {}, gespielt: {}, zuletzt: null };
  }
  function songsPruefen(x) {
    var f = frischeSongs();
    if (!x || typeof x !== 'object') { return f; }
    return {
      fassung: x.fassung === 'pb' ? 'pb' : 'voll',
      tempo: (x.tempo && typeof x.tempo === 'object') ? x.tempo : {},
      gespielt: (x.gespielt && typeof x.gespielt === 'object') ? x.gespielt : {},
      zuletzt: typeof x.zuletzt === 'string' ? x.zuletzt : null
    };
  }

  /* Videos: das Tempo je Video (wie bei den Liedern) und welches zuletzt
   * offen war. */
  function frischeVideos() { return { tempo: {}, zuletzt: null }; }
  function videosPruefen(x) {
    if (!x || typeof x !== 'object') { return frischeVideos(); }
    return {
      tempo: (x.tempo && typeof x.tempo === 'object') ? x.tempo : {},
      zuletzt: typeof x.zuletzt === 'string' ? x.zuletzt : null
    };
  }

  function rhythmusPruefen(r, bekannt) {
    var f = frischerRhythmus();
    if (!r || typeof r !== 'object') { return f; }
    return {
      zaehler: [2, 3, 4].indexOf(r.zaehler) >= 0 ? r.zaehler : f.zaehler,
      takte: r.takte === 4 ? 4 : 2,
      bausteine: Array.isArray(r.bausteine) && r.bausteine.length
        ? r.bausteine.filter(function (b) { return typeof b === 'string'; }) : f.bausteine,
      material: r.material === 'vorrat' ? 'vorrat' : 'einton',
      ton: bekannt.indexOf(r.ton) >= 0 ? r.ton : f.ton,
      eingabe: r.eingabe === 'tippen' ? 'tippen' : 'trompete'
    };
  }

  Fortschritt.prototype._laden = function () {
    if (!this.speicher) { return this._frisch(); }
    try {
      var roh = this.speicher.getItem(SCHLUESSEL);
      if (!roh) { return this._frisch(); }
      var s = JSON.parse(roh);
      if (!s) { return this._frisch(); }

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
      s.tempo = typeof s.tempo === 'number' ? s.tempo : TEMPO_START;
      if (s.tempo < TEMPO_MIN) { s.tempo = TEMPO_MIN; }
      s.hilfen = s.hilfen || {};
      s.hilfen = { namen: s.hilfen.namen !== false, zaehlen: s.hilfen.zaehlen !== false };
      s.rhythmus = rhythmusPruefen(s.rhythmus, bekannt);
      if (typeof s.latenz !== 'number' || !(s.latenz >= 0 && s.latenz < 1)) { s.latenz = null; }
      s.songs = songsPruefen(s.songs);
      s.videos = videosPruefen(s.videos);
      if (STUFEN.indexOf(s.schwierigkeit) < 0) { s.schwierigkeit = 'superleicht'; }
      if (['de', 'en', 'es'].indexOf(s.sprache) < 0) { s.sprache = 'de'; }
      if (s.modus !== 'solo') { s.modus = 'mit'; }
      return s;
    } catch (e) {
      return this._frisch();
    }
  };

  Fortschritt.prototype._sichern = function () {
    if (!this.speicher) { return; }
    try { this.speicher.setItem(SCHLUESSEL, JSON.stringify(this.stand)); }
    catch (e) { /* voller Speicher ist kein Grund, das Ueben zu stoeren */ }
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

  /* Schwarze oder farbige Noten. Schwarz ist die Voreinstellung — so
   * steht es in jedem Notenheft. Farbig gibt jedem Stammton seine eigene
   * Farbe; wer mag, nimmt das als Lesehilfe dazu. */
  Fortschritt.prototype.notenfarbe = function () {
    return this.stand.notenfarbe === 'bunt' ? 'bunt' : 'schwarz';
  };
  Fortschritt.prototype.setzeNotenfarbe = function (art) {
    this.stand.notenfarbe = (art === 'schwarz') ? 'schwarz' : 'bunt';
    this._sichern();
  };

  /* Sprache der Oberflaeche. */
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

  /* Hilfen im Notenbild: Notennamen und Zaehlzeiten unter den Noten.
   * Beide sind Stuetzraeder — an fuer den Einstieg, und mit einem
   * Fingertipp weg, sobald es ohne gehen soll. */
  Fortschritt.prototype.hilfe = function (name) {
    return !!(this.stand.hilfen && this.stand.hilfen[name]);
  };
  Fortschritt.prototype.setzeHilfe = function (name, an) {
    if (name !== 'namen' && name !== 'zaehlen') { return; }
    this.stand.hilfen[name] = !!an;
    this._sichern();
  };

  /* Rhythmus-Training: die zuletzt gewaehlte Zusammenstellung. */
  Fortschritt.prototype.rhythmus = function () {
    var r = this.stand.rhythmus;
    return {
      zaehler: r.zaehler, takte: r.takte, bausteine: r.bausteine.slice(),
      material: r.material, ton: r.ton, eingabe: r.eingabe
    };
  };
  Fortschritt.prototype.setzeRhythmus = function (r) {
    var bekannt = this.toene.map(function (t) { return t.id; });
    var neu = this.rhythmus();
    for (var k in r) { if (Object.prototype.hasOwnProperty.call(r, k)) { neu[k] = r[k]; } }
    this.stand.rhythmus = rhythmusPruefen(neu, bekannt);
    this._sichern();
  };

  /* Laufzeit Lautsprecher -> Mikrofon in Sekunden, gemessen am eigenen
   * Vorzaehler (siehe level2.js). null, solange nichts gemessen wurde. */
  Fortschritt.prototype.latenz = function () { return this.stand.latenz; };
  Fortschritt.prototype.setzeLatenz = function (s) {
    this.stand.latenz = (typeof s === 'number' && s >= 0 && s < 1) ? s : null;
    this._sichern();
  };

  /* Lieder ------------------------------------------------------------ */

  /** Tempo eines Lieds in Prozent des Originals (40 bis 120). */
  Fortschritt.prototype.songTempo = function (id) {
    var p = this.stand.songs.tempo[id];
    return (typeof p === 'number' && p >= 40 && p <= 120) ? p : 100;
  };
  Fortschritt.prototype.setzeSongTempo = function (id, prozent) {
    this.stand.songs.tempo[id] = Math.max(40, Math.min(120, Math.round(prozent)));
    this._sichern();
  };
  /** 'voll' = mit Trompete, 'pb' = nur die Begleitung. */
  Fortschritt.prototype.songFassung = function () { return this.stand.songs.fassung; };
  Fortschritt.prototype.setzeSongFassung = function (f) {
    this.stand.songs.fassung = (f === 'pb') ? 'pb' : 'voll';
    this._sichern();
  };
  /** Wie oft das Lied bis zum Ende durchlief. */
  Fortschritt.prototype.songGespielt = function (id) { return this.stand.songs.gespielt[id] || 0; };
  Fortschritt.prototype.notiereSong = function (id) {
    this.stand.songs.gespielt[id] = this.songGespielt(id) + 1;
    this._sichern();
  };
  Fortschritt.prototype.letzterSong = function () { return this.stand.songs.zuletzt; };
  Fortschritt.prototype.setzeLetztenSong = function (id) {
    this.stand.songs.zuletzt = id; this._sichern();
  };

  /* Videos ------------------------------------------------------------ */

  /** Tempo eines Videos in Prozent des Originals (40 bis 120). */
  Fortschritt.prototype.videoTempo = function (id) {
    var p = this.stand.videos.tempo[id];
    return (typeof p === 'number' && p >= 40 && p <= 120) ? p : 100;
  };
  Fortschritt.prototype.setzeVideoTempo = function (id, prozent) {
    this.stand.videos.tempo[id] = Math.max(40, Math.min(120, Math.round(prozent)));
    this._sichern();
  };
  Fortschritt.prototype.letztesVideo = function () { return this.stand.videos.zuletzt; };
  Fortschritt.prototype.setzeLetztesVideo = function (id) {
    this.stand.videos.zuletzt = id; this._sichern();
  };

  Fortschritt.prototype.letztesLevel = function () { return this.stand.letztesLevel; };
  Fortschritt.prototype.setzeLetztesLevel = function (id) {
    this.stand.letztesLevel = id; this._sichern();
  };

  /* Tonmaterial von Hand --------------------------------------------- */

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
     * Toene, die ich ueben will" — und meint damit nicht nur einen der
     * Bereiche. */
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

  /** Alle Toene, die in IRGENDEINEM Bereich dabei sind. Die
   *  Einstellungen zeigen und schalten damit — dort geht es um die
   *  Frage "welche Toene uebe ich", nicht um einzelne Bereiche. */
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
     * Bedingung dafuer, dass dieser Knopf ueberhaupt zu lesen war. Ihn
     * zu druecken darf sie nicht ins Deutsche zuruecksetzen. */
    var sprache = this.sprache();
    this.stand = this._frisch();
    this.stand.sprache = sprache;
    this._sichern();
  };

  /** Die Tabelle in den Einstellungen. Sie fasst beide Bereiche
   *  zusammen: gefragt ist dort, wie sicher ein Ton sitzt, nicht in
   *  welchem Bereich er getroffen wurde. */
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
  Fortschritt.TEMPO_START = TEMPO_START;
  return Fortschritt;
});
