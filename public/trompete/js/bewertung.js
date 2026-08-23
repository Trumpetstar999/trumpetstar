/* bewertung.js — Ton und Zeitpunkt getrennt pruefen (Auftrag 11).
 *
 * Bewertet wird immer die GANZE Uebung, nie Note fuer Note — sonst
 * bricht der Fluss ab. Das Zeitfenster haengt am Tempo (Auftrag 8.5):
 * +/- 15 % der Schlagdauer, damit langsames Spielen nicht kuenstlich
 * leichter bewertet wird als schnelles.
 */
(function (root, factory) {
  var B = factory();
  if (typeof module === 'object' && module.exports) { module.exports = B; }
  root.Bewertung = B;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** melodie : Ergebnis aus generator.js (oder ein Lied)
   *  gespielt: Ergebnis aus tracker.extrahiereNoten()
   *  opt     : { tempoBpm, tNull, zeitfensterAnteil }
   */
  function bewerte(melodie, gespielt, opt) {
    var schlag = 60 / opt.tempoBpm;
    var fenster = (opt.zeitfensterAnteil || 0.15) * schlag;
    var tNull = opt.tNull || 0;

    var soll = melodie.noten.filter(function (n) { return !n.pause; }).map(function (n) {
      return { tonId: n.tonId, tSoll: tNull + n.schlag * schlag, dauer: n.dauer * schlag, note: n };
    });

    var benutzt = new Array(gespielt.length);
    var ergebnisse = [];
    var suchfenster = Math.max(0.6 * schlag, 0.35);

    // 1) Zuordnung: naechstliegende, noch freie gespielte Note
    for (var i = 0; i < soll.length; i++) {
      var s = soll[i], besterIdx = -1, besteDist = Infinity;
      for (var j = 0; j < gespielt.length; j++) {
        if (benutzt[j]) { continue; }
        var d = Math.abs(gespielt[j].tStart - s.tSoll);
        if (d > suchfenster) { continue; }
        // Bei gleichem Abstand gewinnt der richtige Ton
        var strafe = gespielt[j].tonId === s.tonId ? 0 : 0.001;
        if (d + strafe < besteDist) { besteDist = d + strafe; besterIdx = j; }
      }
      if (besterIdx >= 0) { benutzt[besterIdx] = true; }
      ergebnisse.push({ index: i, tonId: s.tonId, tSoll: s.tSoll, gespieltIdx: besterIdx });
    }

    // 2) Verschmolzene Tonwiederholungen sind kein Fehler (Auftrag 8.4)
    for (i = 1; i < ergebnisse.length; i++) {
      var e = ergebnisse[i], vor = ergebnisse[i - 1];
      if (e.gespieltIdx >= 0 || vor.gespieltIdx < 0) { continue; }
      var g = gespielt[vor.gespieltIdx];
      if (g.tonId === e.tonId && g.tEnde >= soll[i].tSoll - fenster) {
        e.verschmolzen = true;
        e.gespieltIdx = vor.gespieltIdx;
      }
    }

    // 3) Urteil je Note
    var tonFehler = 0, zeitFehler = 0, fehlend = 0, naturton = 0;
    for (i = 0; i < ergebnisse.length; i++) {
      var r = ergebnisse[i];
      if (r.gespieltIdx < 0) { r.art = 'fehlt'; fehlend++; continue; }
      var gp = gespielt[r.gespieltIdx];
      r.gespielterTon = gp.tonId;
      r.oktave = gp.oktave;
      r.abweichung = gp.tStart - r.tSoll;

      if (gp.oktave === 1) {
        // Ueberblasen ist ein eigener Fall, nie ein falscher Ton
        r.art = 'naturton'; naturton++; continue;
      }
      var tonOk = gp.tonId === r.tonId;
      var zeitOk = r.verschmolzen || Math.abs(r.abweichung) <= fenster;
      if (!tonOk) { r.art = 'falscherTon'; tonFehler++; }
      else if (!zeitOk) { r.art = 'verspaetet'; zeitFehler++; }
      else { r.art = 'richtig'; }
    }

    // 4) Zusaetzlich gespielte Noten
    var zusatz = 0;
    for (j = 0; j < gespielt.length; j++) {
      if (!benutzt[j] && gespielt[j].oktave === 0) { zusatz++; }
    }

    var gesamtFehler = tonFehler + zeitFehler + fehlend + zusatz;
    var nichtsGehoert = gespielt.length === 0;

    return {
      noten: ergebnisse,
      tonFehler: tonFehler,
      zeitFehler: zeitFehler,
      fehlend: fehlend,
      zusatz: zusatz,
      naturton: naturton,
      fehler: gesamtFehler,
      nichtsGehoert: nichtsGehoert,
      zeitfenster: fenster,
      urteil: urteile(tonFehler, zeitFehler, fehlend, zusatz, naturton, nichtsGehoert, ergebnisse)
    };
  }

  /* Auftrag 12 — die Tabelle der Rueckmeldungen.
   * Es gibt darin keinen einzigen negativen Fall. */
  function urteile(tonFehler, zeitFehler, fehlend, zusatz, naturton, nichtsGehoert, ergebnisse) {
    if (nichtsGehoert) { return { fall: 'nichts' }; }
    if (naturton > 0 && tonFehler === 0 && fehlend === 0) { return { fall: 'naturton' }; }
    if (tonFehler === 0 && zeitFehler === 0 && fehlend === 0 && zusatz === 0 && naturton === 0) {
      return { fall: 'sauber' };
    }
    if (tonFehler === 1 && zeitFehler === 0 && fehlend === 0 && zusatz === 0) {
      for (var i = 0; i < ergebnisse.length; i++) {
        if (ergebnisse[i].art === 'falscherTon') {
          return { fall: 'einTonFalsch', index: i };
        }
      }
    }
    if (tonFehler === 0 && fehlend === 0) { return { fall: 'rhythmus' }; }
    if (naturton > 0) { return { fall: 'naturton' }; }
    return { fall: 'nochmal' };
  }

  return { bewerte: bewerte, urteile: urteile };
});
