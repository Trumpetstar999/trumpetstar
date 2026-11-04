/* melodie.js — aus gespeicherten Takten wird eine spielbare Melodie.
 *
 * Buch und App lesen dieselbe Datei (data/buch.json). Eine Note steht
 * dort kurz als Liste:
 *
 *   ["g1", 4]          Viertel g1
 *   ["g1", 2, "."]     punktierte Halbe
 *   ["a1", 8, "~"]     Achtel, Haltebogen zur naechsten Note
 *   [null, 4]          Viertelpause
 *   ["x", 4]           Klatschen (Kreuz-Notenkopf): klingt nicht auf
 *                      der Floete, die App klatscht mit
 *
 * Kennzeichen im dritten Feld:  .  Punkt   ~  Haltebogen weiter
 *                               (  Bindebogen beginnt   )  endet
 *                               ,  Atemzeichen nach dieser Note
 *
 * Ein Stueck traegt dazu: taktart "4/4" | "3/4", vorzeichen -1|0|1,
 * auftakt (Schlaege im ersten Takt, 0 = kein Auftakt) und optional
 * wiederholung [vonTakt, bisTakt] (Indizes, beide eingeschlossen) und
 * kanon [Taktindex, ...] — dort setzt die zweite (dritte …) Gruppe ein.
 *
 * Zwei Sichten auf dieselbe Melodie:
 *   anzeige   jede gedruckte Note genau einmal — fuer den Notensatz
 *   noten     die Noten in Spielreihenfolge, Wiederholungen
 *             ausgeschrieben, mit Zeit (schlag) — fuer Klang, Marker
 *             und Erkennung. n.ai zeigt auf die gedruckte Note.
 *
 * Eine Zaehlzeit (Schlag) ist immer eine Viertel.
 */
(function (root, factory) {
  var M = factory();
  if (typeof module === 'object' && module.exports) { module.exports = M; }
  root.Melodie = M;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function dauerVon(wert, punkt) { return (4 / wert) * (punkt ? 1.5 : 1); }

  function taktartLesen(t) {
    var m = /^(\d+)\/(\d+)$/.exec(t || '4/4');
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [4, 4];
  }

  /**
   * stueck: { takte, taktart, vorzeichen, auftakt, wiederholung }
   * Liefert das Melodieobjekt, das Notensatz, Motor und Uebung lesen.
   */
  function aus(stueck, kennung) {
    var ta = taktartLesen(stueck.taktart);
    var taktLaenge = ta[0] * 4 / ta[1];
    var takte = [], anzeige = [];

    (stueck.takte || []).forEach(function (takt, ti) {
      var reihe = [], imTakt = 0;
      takt.forEach(function (e) {
        var zeichen = e[2] || '';
        var n = {
          i: anzeige.length, tonId: e[0] === 'x' ? null : e[0], pause: e[0] === null || e[0] === 'x',
          klatsch: e[0] === 'x', atem: zeichen.indexOf(',') >= 0,
          wert: e[1], punkt: zeichen.indexOf('.') >= 0,
          halte: zeichen.indexOf('~') >= 0,
          bogenAn: zeichen.indexOf('(') >= 0, bogenAus: zeichen.indexOf(')') >= 0,
          takt: ti, schlagImTakt: imTakt, fortsetzung: false
        };
        n.dauer = dauerVon(n.wert, n.punkt);
        imTakt += n.dauer;
        reihe.push(n); anzeige.push(n);
      });
      takte.push(reihe);
    });

    /* Haltebogen: die zweite Note wird nicht neu angestossen. Sie
     * klingt als Teil der ersten weiter — die erste traegt die
     * gemeinsame Klangdauer. */
    for (var i = 0; i < anzeige.length; i++) {
      var a = anzeige[i];
      a.klangDauer = a.dauer;
    }
    for (var j = anzeige.length - 1; j > 0; j--) {
      var vor = anzeige[j - 1], nach = anzeige[j];
      if (vor.halte && !vor.pause && !nach.pause && vor.tonId === nach.tonId) {
        nach.fortsetzung = true;
        vor.klangDauer = vor.dauer + nach.klangDauer;
      }
    }

    /* Spielreihenfolge. */
    var folge = [];
    for (var t = 0; t < takte.length; t++) { folge.push(t); }
    var w = stueck.wiederholung;
    if (w && w.length === 2) {
      var ende = folge.indexOf(w[1]);
      var zweiter = [];
      for (var t2 = w[0]; t2 <= w[1]; t2++) { zweiter.push(t2); }
      folge = folge.slice(0, ende + 1).concat(zweiter).concat(folge.slice(ende + 1));
    }

    var noten = [], schlag = 0;
    folge.forEach(function (ti, lauf) {
      takte[ti].forEach(function (n) {
        noten.push({
          ai: n.i, tonId: n.tonId, pause: n.pause, klatsch: n.klatsch, wert: n.wert, punkt: n.punkt,
          dauer: n.dauer, klangDauer: n.klangDauer, fortsetzung: n.fortsetzung,
          takt: ti, lauf: lauf, schlag: schlag
        });
        schlag += n.dauer;
      });
    });

    return {
      seed: kennung || 0, istLied: true,
      taktart: ta, taktLaenge: taktLaenge,
      vorzeichen: stueck.vorzeichen || 0,
      auftakt: stueck.auftakt || 0,
      wiederholung: (w && w.length === 2) ? w.slice() : null,
      kanon: stueck.kanon ? stueck.kanon.slice() : null,
      takte: takte, anzeige: anzeige, noten: noten,
      schlaegeGesamt: schlag
    };
  }

  /* Wie viele Takte in eine Zeile? Vier im 4/4-Takt, sechs im
   * 3/4-Takt — dann sind die Zeilen ungefaehr gleich lang. Ein
   * Auftakt kommt zur ersten Zeile dazu und zaehlt nicht mit. */
  function jeZeile(taktart) {
    var ta = Array.isArray(taktart) ? taktart : taktartLesen(taktart);
    return (ta[0] * 4 / ta[1]) <= 3 ? 6 : 4;
  }

  /** Teilt Taktindizes in Zeilen: [[0,1,2,3,4],[5,6,7,8],...] */
  function zeilen(anzahlTakte, taktart, auftakt, proZeile) {
    var je = proZeile || jeZeile(taktart);
    var raus = [], i = 0;
    while (i < anzahlTakte) {
      var n = je + ((i === 0 && auftakt) ? 1 : 0);
      var z = [];
      for (var k = i; k < Math.min(anzahlTakte, i + n); k++) { z.push(k); }
      raus.push(z);
      i += n;
    }
    /* Ein einzelner Takt allein in der letzten Zeile sieht aus wie
     * vergessen — er rutscht in die Zeile davor. */
    if (raus.length > 1 && raus[raus.length - 1].length === 1) {
      raus[raus.length - 2] = raus[raus.length - 2].concat(raus.pop());
    }
    return raus;
  }

  /** Die klingenden Noten in Spielreihenfolge, die neu angestossen
   *  werden muessen — gehaltene Fortsetzungen zaehlen nicht. */
  function anschlaege(melodie) {
    return melodie.noten.filter(function (n) { return !n.pause && !n.fortsetzung; });
  }

  return { aus: aus, dauerVon: dauerVon, taktartLesen: taktartLesen,
           jeZeile: jeZeile, zeilen: zeilen, anschlaege: anschlaege };
});
