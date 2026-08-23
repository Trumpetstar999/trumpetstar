/* generator.js — Melodien wuerfeln und anschliessend gegen alle Regeln
 * pruefen (Auftrag 13). Bewusst KEIN Generator, der versucht direkt
 * gueltig zu bauen: erzeugen → pruefen → verwerfen → neu erzeugen.
 * Der Validator ist die Stelle, an der Regeln ergaenzt werden.
 *
 * Notenwerte:  4 = Viertel, 2 = Halbe, 1 = Ganze
 */
(function (root, factory) {
  var G = factory();
  if (typeof module === 'object' && module.exports) { module.exports = G; }
  root.Generator = G;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var SCHLAEGE = { 4: 1, 2: 2, 1: 4 };

  /* Taktmuster. Jeder Takt fuellt genau 4 Schlaege.
   * 'r' markiert die Viertelpause — sie darf nur auf Zaehlzeit 4 stehen. */
  var MUSTER_2A = [
    { werte: [4, 4, 2], gewicht: 3 },
    { werte: [2, 2],    gewicht: 2 }
  ];
  var MUSTER_2B_INNEN = [
    { werte: [4, 4, 2],       gewicht: 4 },
    { werte: [2, 2],          gewicht: 3 },
    { werte: [4, 4, 4, 'r'],  gewicht: 1 }
  ];
  var MUSTER_2B_SCHLUSS = [
    { werte: [1],       gewicht: 5 },
    { werte: [2, 2],    gewicht: 1 },
    { werte: [4, 4, 2], gewicht: 1 }
  ];

  function ziehe(rng, liste) {
    var summe = 0, i;
    for (i = 0; i < liste.length; i++) { summe += liste[i].gewicht; }
    var w = rng() * summe;
    for (i = 0; i < liste.length; i++) {
      w -= liste[i].gewicht;
      if (w <= 0) { return liste[i]; }
    }
    return liste[liste.length - 1];
  }

  /* ---------------------------------------------------------------- */
  /* Kontext: welche Toene stehen zur Verfuegung, wie weit darf         */
  /* gesprungen werden                                                  */
  /* ---------------------------------------------------------------- */

  function baueKontext(alleToene, vorratIds) {
    var vorrat = alleToene.filter(function (t) { return vorratIds.indexOf(t.id) >= 0; })
                          .sort(function (a, b) { return a.frequenzHz - b.frequenzHz; });
    var einTon = vorrat.length === 1;
    // Schrittweite: bis vier Toene hoechstens eine Terz, ab fuenf eine Quart
    // (gemessen in Tonleiterschritten innerhalb des Vorrats).
    var maxSchritt = vorrat.length >= 5 ? 3 : 2;
    return {
      vorrat: vorrat,
      einTon: einTon,
      ids: vorrat.map(function (t) { return t.id; }),
      ruheton: vorrat.length ? vorrat[0].id : null,
      maxSchritt: maxSchritt,
      /* Abstand zweier Toene: die Notenstufe, nicht die Position im
       * Vorrat. Waehlen die Eltern einen Umfang mit Luecke — etwa nur
       * h1 und d2 —, waere ein Sprung sonst als Sekunde gezaehlt. */
      index: (function () {
        var m = {};
        vorrat.forEach(function (t) { m[t.id] = t.stufe; });
        return m;
      })()
    };
  }

  /* ---------------------------------------------------------------- */
  /* Validator                                                          */
  /* ---------------------------------------------------------------- */
  /* Liefert ein Array von Regelverstoessen (leer = gueltig).           */

  function pruefe(melodie, kontext, stufe) {
    var verstoesse = [];
    var noten = melodie.noten;
    var klingend = noten.filter(function (n) { return !n.pause; });

    function melde(regel) { verstoesse.push(regel); }

    if (!klingend.length) { melde('leer'); return verstoesse; }

    /* Steht erst ein einziger Ton zur Verfuegung, geht es nur um den
     * Rhythmus. Alle Regeln, die von mehreren Tonhoehen handeln —
     * Ruheton, Schrittweite, Bogen, Tonwiederholung — sind dann
     * gegenstandslos und werden uebersprungen. */
    var einTon = kontext.einTon;

    /* Tonvorrat --------------------------------------------------- */
    for (var i = 0; i < klingend.length; i++) {
      if (kontext.ids.indexOf(klingend[i].tonId) < 0) { melde('fremder-ton'); break; }
    }

    /* Ruheton am Anfang und am Ende -------------------------------- */
    if (!einTon) {
      if (klingend[0].tonId !== kontext.ruheton) { melde('anfang-nicht-ruheton'); }
      if (klingend[klingend.length - 1].tonId !== kontext.ruheton) { melde('ende-nicht-ruheton'); }
    }

    /* Schrittweite -------------------------------------------------- */
    for (i = 1; !einTon && i < klingend.length; i++) {
      var d = Math.abs(kontext.index[klingend[i].tonId] - kontext.index[klingend[i - 1].tonId]);
      if (d > kontext.maxSchritt) { melde('sprung-zu-gross'); break; }
    }

    /* Mindestens zwei verschiedene Toene ---------------------------- */
    var verschieden = {};
    klingend.forEach(function (n) { verschieden[n.tonId] = 1; });
    if (!einTon && Object.keys(verschieden).length < 2) { melde('zu-wenig-verschiedene-toene'); }

    /* Hoechstens drei Noten in derselben Richtung ------------------- */
    var lauf = 0, richtung = 0;
    for (i = 1; !einTon && i < klingend.length; i++) {
      var diff = kontext.index[klingend[i].tonId] - kontext.index[klingend[i - 1].tonId];
      var r = diff > 0 ? 1 : (diff < 0 ? -1 : 0);
      if (r !== 0 && r === richtung) {
        lauf++;
        if (lauf >= 3) { melde('zu-lange-in-eine-richtung'); break; }
      } else { richtung = r; lauf = r === 0 ? 0 : 1; }
    }

    /* Hoechster Ton in der Mitte: ein Bogen, keine Treppe -----------
     * Gemessen wird der Schwerpunkt ALLER Vorkommen des hoechsten Tons,
     * nicht nur das erste. Bei nur zwei Toenen im Vorrat wechseln sich
     * die beiden zwangslaeufig ab; dann liegt der hoechste Ton zwar
     * schon frueh, sein Schwerpunkt aber trotzdem in der Mitte — und
     * genau das ist gemeint. */
    var hoechster = -1;
    for (i = 0; !einTon && i < klingend.length; i++) {
      if (kontext.index[klingend[i].tonId] > hoechster) {
        hoechster = kontext.index[klingend[i].tonId];
      }
    }
    var n = klingend.length;
    var summeIdx = 0, anzahlHoch = 0;
    for (i = 0; i < n; i++) {
      if (kontext.index[klingend[i].tonId] === hoechster) { summeIdx += i; anzahlHoch++; }
    }
    var schwerpunkt = summeIdx / anzahlHoch;
    var hoechsterAmRand = (kontext.index[klingend[0].tonId] === hoechster) ||
                          (kontext.index[klingend[n - 1].tonId] === hoechster);
    if (!einTon && (hoechsterAmRand || schwerpunkt < (n - 1) * 0.25 || schwerpunkt > (n - 1) * 0.75)) {
      melde('hoechster-ton-nicht-in-der-mitte');
    }

    /* Tonwiederholungen -------------------------------------------- */
    var wdh = 0, wdhOhneTrennung = 0;
    for (i = 1; i < noten.length; i++) {
      if (noten[i].pause || noten[i - 1].pause) { continue; }
      if (noten[i].tonId === noten[i - 1].tonId) {
        wdh++;
        // Als sicher trennbar gilt nur eine Wiederholung ueber eine
        // Pause oder ueber einen Taktstrich hinweg.
        var ueberTaktstrich = noten[i].takt !== noten[i - 1].takt;
        if (!ueberTaktstrich) { wdhOhneTrennung++; }
      }
    }
    if (!einTon && stufe === '2a' && wdh > 0) { melde('wiederholung-in-2a'); }
    if (!einTon && stufe === '2b') {
      if (wdh > 1) { melde('zu-viele-wiederholungen'); }
      if (wdhOhneTrennung > 0) { melde('wiederholung-ohne-trennung'); }
    }

    /* Taktbau ------------------------------------------------------- */
    var takte = melodie.takte;
    for (i = 0; i < takte.length; i++) {
      var s = 0;
      for (var j = 0; j < takte[i].length; j++) { s += SCHLAEGE[takte[i][j].wert] || 1; }
      if (Math.abs(s - 4) > 1e-9) { melde('takt-nicht-voll'); break; }
    }
    // Jeder Takt endet auf einer Halben (2a) bzw. der letzte auf einer Ganzen (2b)
    for (i = 0; i < takte.length; i++) {
      var letzte = takte[i][takte[i].length - 1];
      var istSchlusstakt = (i === takte.length - 1);
      if (letzte.pause) {
        if (stufe === '2a') { melde('pause-in-2a'); }
        else if (letzte.schlagImTakt !== 3) { melde('pause-nicht-auf-vier'); }
      } else if (stufe === '2a') {
        if (letzte.wert !== 2) { melde('takt-endet-nicht-auf-halber'); break; }
      } else if (istSchlusstakt) {
        if (letzte.wert !== 1 && letzte.wert !== 2) { melde('schlusstakt-zu-kurz'); }
      } else if (letzte.wert !== 2) {
        melde('takt-endet-nicht-auf-halber'); break;
      }
    }

    /* Notenwerte --------------------------------------------------- */
    var erlaubt = stufe === '2a' ? [4, 2] : [4, 2, 1];
    for (i = 0; i < noten.length; i++) {
      if (!noten[i].pause && erlaubt.indexOf(noten[i].wert) < 0) { melde('unerlaubter-notenwert'); break; }
      if (noten[i].pause && noten[i].wert !== 4) { melde('unerlaubte-pause'); break; }
    }
    var pausen = noten.filter(function (x) { return x.pause; }).length;
    if (pausen > 1) { melde('zu-viele-pausen'); }

    /* Laenge -------------------------------------------------------- */
    if (stufe === '2a' && klingend.length > 6) { melde('zu-viele-noten-in-2a'); }

    /* Bei einem einzigen Ton haengt alles am neuen Anstoss jeder Note.
     * Deshalb hoechstens drei Noten je Takt — das laesst genug Luft
     * zum Absetzen. */
    if (einTon) {
      for (i = 0; i < takte.length; i++) {
        var klingendImTakt = 0;
        for (var q = 0; q < takte[i].length; q++) { if (!takte[i][q].pause) { klingendImTakt++; } }
        if (klingendImTakt > 3) { melde('zu-dicht-fuer-einen-ton'); break; }
      }
    }

    return verstoesse;
  }

  /* ---------------------------------------------------------------- */
  /* Erzeugung                                                          */
  /* ---------------------------------------------------------------- */

  function rhythmusWuerfeln(rng, stufe) {
    var taktzahl = stufe === '2a' ? 2 : 4;
    var takte = [], schlag = 0;
    for (var i = 0; i < taktzahl; i++) {
      var muster;
      if (stufe === '2a') { muster = ziehe(rng, MUSTER_2A); }
      else if (i === taktzahl - 1) { muster = ziehe(rng, MUSTER_2B_SCHLUSS); }
      else { muster = ziehe(rng, MUSTER_2B_INNEN); }
      var takt = [], imTakt = 0;
      for (var j = 0; j < muster.werte.length; j++) {
        var w = muster.werte[j];
        var pause = (w === 'r');
        var wert = pause ? 4 : w;
        takt.push({
          wert: wert, pause: pause, takt: i,
          schlag: schlag, schlagImTakt: imTakt, dauer: SCHLAEGE[wert]
        });
        schlag += SCHLAEGE[wert];
        imTakt += SCHLAEGE[wert];
      }
      takte.push(takt);
    }
    return takte;
  }

  /** Kennzeichnung des Rhythmus, um zwei gleiche Uebungen hintereinander
   *  zu vermeiden: die Notenwerte in ihrer Reihenfolge. */
  function rhythmusKennung(melodie) {
    return melodie.noten.map(function (n) {
      return (n.pause ? 'p' : '') + n.wert;
    }).join('-');
  }

  function erzeuge(opt) {
    var kontext = baueKontext(opt.toene, opt.vorratIds);
    var stufe = opt.stufe || '2a';
    // Ein einziger Ton genuegt: dann ist es eine reine Rhythmusuebung.
    if (!kontext.vorrat.length) { return null; }

    var seed = opt.seed >>> 0;
    var rng = mulberry32(seed);
    var maxVersuche = opt.maxVersuche || 4000;

    for (var versuch = 0; versuch < maxVersuche; versuch++) {
      var takte = rhythmusWuerfeln(rng, stufe);
      var noten = [];
      takte.forEach(function (t) { t.forEach(function (n) { noten.push(n); }); });

      // Tonhoehen wuerfeln, Ruheton an den Raendern gesetzt
      var klingend = noten.filter(function (n) { return !n.pause; });
      for (var i = 0; i < klingend.length; i++) {
        if (i === 0 || i === klingend.length - 1) { klingend[i].tonId = kontext.ruheton; }
        else { klingend[i].tonId = kontext.ids[Math.floor(rng() * kontext.ids.length)]; }
      }
      noten.forEach(function (n) { if (n.pause) { n.tonId = null; } });

      var melodie = {
        seed: seed, versuch: versuch, stufe: stufe,
        takte: takte, noten: noten,
        vorrat: kontext.ids.slice(),
        schlaegeGesamt: takte.length * 4
      };
      var verstoesse = pruefe(melodie, kontext, stufe);
      if (!verstoesse.length) {
        melodie.rhythmus = rhythmusKennung(melodie);
        // Drei Uebungen je Stufe sollen verschiedene Rhythmen haben
        if (opt.vermeideRhythmus &&
            opt.vermeideRhythmus.indexOf(melodie.rhythmus) >= 0 &&
            versuch < maxVersuche - 300) { continue; }
        melodie.gueltig = true;
        return melodie;
      }
    }
    return null;
  }

  return {
    erzeuge: erzeuge,
    pruefe: pruefe,
    rhythmusKennung: rhythmusKennung,
    baueKontext: baueKontext,
    mulberry32: mulberry32,
    SCHLAEGE: SCHLAEGE
  };
});
