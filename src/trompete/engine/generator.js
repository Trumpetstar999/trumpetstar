/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/generator.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* generator.js — Melodien wuerfeln und anschliessend gegen alle Regeln
 * pruefen (Auftrag 13). Bewusst KEIN Generator, der versucht direkt
 * gueltig zu bauen: erzeugen → pruefen → verwerfen → neu erzeugen.
 * Der Validator ist die Stelle, an der Regeln ergaenzt werden.
 *
 * Notenwerte:  16 = Sechzehntel, 8 = Achtel, 4 = Viertel, 2 = Halbe, 1 = Ganze.
 * Ein Punkt verlaengert um die Haelfte und steht als eigenes Feld
 * `punkt` an der Note.
 *
 * Zwei Erzeuger:
 *   erzeuge()          Melodien mit einfachem Rhythmus (2 und 4 Takte)
 *   erzeugeRhythmus()  das Rhythmus-Training: Takte aus frei waehlbaren
 *                      Bausteinen, auf einem Ton oder im Tonmaterial
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

  var SCHLAEGE = { 16: 0.25, 8: 0.5, 4: 1, 2: 2, 1: 4 };

  /** Notenwert in der Schreibweise der Liederdatei: 4, 2, 1, 8 oder
   *  mit Punkt als Text ('4.', '2.'). */
  function wertInfo(w) {
    var punkt = typeof w === 'string' && w.charAt(w.length - 1) === '.';
    var wert = parseInt(w, 10);
    var dauer = SCHLAEGE[wert] || 1;
    return { wert: wert, punkt: punkt, dauer: punkt ? dauer * 1.5 : dauer };
  }

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
                          .sort(function (a, b) {
                            return (a.frequenzHz - b.frequenzHz) || (a.stufe - b.stufe);
                          });
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

  /* Ab dieser Groesse wird aus dem Tonmaterial ein Ausschnitt gewaehlt.
   *
   * Die Melodieregeln (Ruheton am Anfang und Ende, kleine Schritte, ein
   * Bogen) halten jede Uebung in der Naehe ihres tiefsten Tons. Bei
   * neun Toenen ist das richtig. Bei einem Material von fis bis a2
   * kaeme die hohe Lage nie vor — jede Uebung finge beim kleinen fis
   * an. Deshalb bekommt jede Uebung ihr eigenes Fenster: sechs bis acht
   * benachbarte Toene, irgendwo im Material. */
  var FENSTER_AB = 10;

  function fensterWaehlen(rng, kontext) {
    var n = kontext.vorrat.length;
    if (n < FENSTER_AB) { return kontext; }
    var breite = 6 + Math.floor(rng() * 3);
    var start = Math.floor(rng() * (n - breite + 1));
    var ids = kontext.ids.slice(start, start + breite);
    return baueKontext(kontext.vorrat, ids);
  }

  /** Tonhoehen als Weg in kleinen Schritten: von jedem Ton aus kommen
   *  nur die in Frage, die hoechstens `maxSchritt` Stufen entfernt
   *  liegen UND von denen aus der Ruheton bis zum Schluss noch zu
   *  erreichen ist. Der Validator prueft danach wie bisher — aber er
   *  bekommt Kandidaten, die nicht schon an der Schrittweite scheitern. */
  function tonwegWuerfeln(rng, kontext, anzahl) {
    var ids = kontext.ids, idx = kontext.index, ruhe = kontext.ruheton;
    var weg = [ruhe];
    for (var i = 1; i < anzahl; i++) {
      if (i === anzahl - 1) { weg.push(ruhe); break; }
      var rest = anzahl - 1 - i;
      var vorher = weg[i - 1];
      var moeglich = ids.filter(function (id) {
        return Math.abs(idx[id] - idx[vorher]) <= kontext.maxSchritt &&
               Math.abs(idx[id] - idx[ruhe]) <= kontext.maxSchritt * rest;
      });
      if (!moeglich.length) { moeglich = ids; }
      weg.push(moeglich[Math.floor(rng() * moeglich.length)]);
    }
    return weg;
  }

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
      return (n.pause ? 'p' : '') + n.wert + (n.punkt ? '.' : '');
    }).join('-');
  }

  function erzeuge(opt) {
    var gesamt = baueKontext(opt.toene, opt.vorratIds);
    var stufe = opt.stufe || '2a';
    // Ein einziger Ton genuegt: dann ist es eine reine Rhythmusuebung.
    if (!gesamt.vorrat.length) { return null; }

    var seed = opt.seed >>> 0;
    var rng = mulberry32(seed);
    var maxVersuche = opt.maxVersuche || 4000;
    var kontext = fensterWaehlen(rng, gesamt);

    for (var versuch = 0; versuch < maxVersuche; versuch++) {
      var takte = rhythmusWuerfeln(rng, stufe);
      var noten = [];
      takte.forEach(function (t) { t.forEach(function (n) { noten.push(n); }); });

      // Tonhoehen wuerfeln, Ruheton an den Raendern gesetzt
      var klingend = noten.filter(function (n) { return !n.pause; });
      var weg = tonwegWuerfeln(rng, kontext, klingend.length);
      for (var i = 0; i < klingend.length; i++) { klingend[i].tonId = weg[i]; }
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

  /* ---------------------------------------------------------------- */
  /* Rhythmus-Training                                                  */
  /* ---------------------------------------------------------------- */
  /* Ein Takt wird aus Bausteinen gelegt. Jeder Baustein ist ein Stueck
   * Rhythmus, das man als Ganzes liest und zaehlt — genau so wird
   * Rhythmus auch gelernt: nicht Note fuer Note, sondern als Muster.
   *
   *   schlaege  wie viele Zaehlzeiten der Baustein fuellt
   *   auf       auf welchen Zaehlzeiten er beginnen darf (0 = die Eins);
   *             ohne Angabe ueberall, wo er in den Takt passt
   *   takt      nur in dieser Taktart (Zaehler)
   *   pause     der Baustein beginnt mit einer Pause
   *
   * Wer einen Baustein ergaenzt: hier eintragen, in sprachen.js einen
   * Namen geben — mehr ist nicht noetig. Der Auswahlbildschirm baut
   * sich aus dieser Liste. */
  var BAUSTEINE = [
    { id: 'ganze',        schlaege: 4, noten: [[1]], takt: 4 },
    { id: 'halbe',        schlaege: 2, noten: [[2]], gerade: true },
    { id: 'viertel',      schlaege: 1, noten: [[4]] },
    { id: 'achtel',       schlaege: 1, noten: [[8], [8]] },
    { id: 'punkthalbe',   schlaege: 3, noten: [[2, '.']], auf: [0] },
    { id: 'punktviertel', schlaege: 2, noten: [[4, '.'], [8]], gerade: true },
    { id: 'synkope',      schlaege: 2, noten: [[8], [4], [8]], gerade: true },
    { id: 'viertelpause', schlaege: 1, noten: [[4, 'r']], pause: true },
    { id: 'halbepause',   schlaege: 2, noten: [[2, 'r']], pause: true, gerade: true },
    { id: 'achtelpause',  schlaege: 1, noten: [[8, 'r'], [8]], pause: true }
  ];
  var BAUSTEIN_STANDARD = ['halbe', 'viertel'];

  function baustein(id) {
    for (var i = 0; i < BAUSTEINE.length; i++) { if (BAUSTEINE[i].id === id) { return BAUSTEINE[i]; } }
    return null;
  }

  /** Passt der Baustein an diese Stelle im Takt? */
  function passt(b, imTakt, zaehler) {
    if (b.schlaege > zaehler - imTakt) { return false; }
    if (b.takt && b.takt !== zaehler) { return false; }
    if (b.auf && b.auf.indexOf(imTakt) < 0) { return false; }
    /* Zweischlaegige Bausteine stehen im Vierertakt auf 1 oder 3 —
     * sonst laegen sie ueber der Taktmitte, und das liest sich schwer.
     * Im Dreiertakt duerfen sie auf 1 oder 2 beginnen. */
    if (b.gerade && zaehler % 2 === 0 && imTakt % 2 !== 0) { return false; }
    return true;
  }

  /** Die Noten eines Bausteins, ab `schlag` (im Stueck) und `imTakt`. */
  function bausteinNoten(b, taktNr, schlag, imTakt) {
    var aus = [], versatz = 0;
    for (var i = 0; i < b.noten.length; i++) {
      var e = b.noten[i];
      var pause = e[1] === 'r';
      var punkt = e[1] === '.';
      var dauer = SCHLAEGE[e[0]] * (punkt ? 1.5 : 1);
      aus.push({
        wert: e[0], punkt: punkt, pause: pause, takt: taktNr,
        schlag: schlag + versatz, schlagImTakt: imTakt + versatz, dauer: dauer,
        tonId: null
      });
      versatz += dauer;
    }
    return aus;
  }

  /**
   * opt: { toene, vorratIds, bausteine: [ids], zaehler: 2|3|4, takte: 2|4,
   *        seed, vermeideRhythmus }
   *
   * Regeln — bewusst wenige, und alle aus dem Unterricht:
   *   - das Stueck beginnt mit einem Klang, nicht mit einer Pause
   *   - nie zwei Pausen-Bausteine hintereinander
   *   - der Schlusstakt endet auf einem Klang
   *   - geht an einer Stelle kein gewaehlter Baustein auf, fuellt eine
   *     Viertelnote. Wer nur Halbe waehlt und einen Dreiertakt, bekommt
   *     also Halbe und Viertel — lieber das als gar keine Uebung.
   */
  function erzeugeRhythmus(opt) {
    var kontext = baueKontext(opt.toene, opt.vorratIds);
    if (!kontext.vorrat.length) { return null; }
    var zaehler = [2, 3, 4].indexOf(opt.zaehler) >= 0 ? opt.zaehler : 4;
    var taktzahl = opt.takte === 4 ? 4 : 2;
    var gewaehlt = (opt.bausteine || []).map(baustein).filter(Boolean);
    if (!gewaehlt.some(function (b) { return !b.pause; })) {
      gewaehlt = gewaehlt.concat(BAUSTEIN_STANDARD.map(baustein));
    }
    var viertel = baustein('viertel');
    var seed = opt.seed >>> 0;
    var rng = mulberry32(seed);
    var melodie = null;

    for (var versuch = 0; versuch < 60; versuch++) {
      var takte = [], noten = [], schlag = 0, letzterWarPause = true;
      for (var ti = 0; ti < taktzahl; ti++) {
        var takt = [], imTakt = 0;
        while (imTakt < zaehler) {
          var schlusstakt = ti === taktzahl - 1;
          var moeglich = gewaehlt.filter(function (b) {
            if (!passt(b, imTakt, zaehler)) { return false; }
            if (b.pause && letzterWarPause) { return false; }
            // Der letzte Baustein des Stuecks darf nicht in einer Pause enden.
            if (schlusstakt && imTakt + b.schlaege === zaehler &&
                b.noten[b.noten.length - 1][1] === 'r') { return false; }
            return true;
          });
          var b = moeglich.length ? moeglich[Math.floor(rng() * moeglich.length)] : viertel;
          var neu = bausteinNoten(b, ti, schlag, imTakt);
          for (var q = 0; q < neu.length; q++) { takt.push(neu[q]); noten.push(neu[q]); }
          letzterWarPause = !!b.pause;
          imTakt += b.schlaege; schlag += b.schlaege;
        }
        takte.push(takt);
      }

      var klingend = noten.filter(function (n) { return !n.pause; });
      var weg = kontext.einTon ? null : fensterWeg(rng, kontext, klingend.length);
      for (var i = 0; i < klingend.length; i++) {
        klingend[i].tonId = kontext.einTon ? kontext.ruheton : weg[i];
      }

      melodie = {
        seed: seed, versuch: versuch, stufe: 'r',
        takte: takte, noten: noten, zaehler: zaehler,
        vorrat: kontext.ids.slice(),
        schlaegeGesamt: taktzahl * zaehler
      };
      melodie.rhythmus = rhythmusKennung(melodie);
      if (opt.vermeideRhythmus && opt.vermeideRhythmus.indexOf(melodie.rhythmus) >= 0) { continue; }
      break;
    }
    if (melodie) { melodie.gueltig = true; }
    return melodie;
  }

  /* Tonweg fuers Rhythmus-Training im Tonmaterial: kleine Schritte,
   * Tonwiederholungen erlaubt (sie sind hier sogar erwuenscht — der
   * Rhythmus ist die Aufgabe, nicht die Melodie), Anfang und Ende auf
   * dem Ruheton des gewaehlten Ausschnitts. */
  function fensterWeg(rng, gesamt, anzahl) {
    var kontext = fensterWaehlen(rng, gesamt);
    var ids = kontext.ids, idx = kontext.index, ruhe = kontext.ruheton;
    var weg = [ruhe];
    for (var i = 1; i < anzahl; i++) {
      if (i === anzahl - 1) { weg.push(ruhe); break; }
      var rest = anzahl - 1 - i, vorher = weg[i - 1];
      var moeglich = ids.filter(function (id) {
        return Math.abs(idx[id] - idx[vorher]) <= 2 && Math.abs(idx[id] - idx[ruhe]) <= 2 * rest;
      });
      if (!moeglich.length) { moeglich = [vorher]; }
      weg.push(moeglich[Math.floor(rng() * moeglich.length)]);
    }
    return weg;
  }

  return {
    erzeuge: erzeuge,
    erzeugeRhythmus: erzeugeRhythmus,
    bausteine: BAUSTEINE,
    bausteinStandard: BAUSTEIN_STANDARD,
    bausteinNoten: bausteinNoten,
    wertInfo: wertInfo,
    pruefe: pruefe,
    rhythmusKennung: rhythmusKennung,
    baueKontext: baueKontext,
    mulberry32: mulberry32,
    SCHLAEGE: SCHLAEGE
  };
});
