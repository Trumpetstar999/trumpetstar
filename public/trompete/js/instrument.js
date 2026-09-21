/* instrument.js — welches Blechinstrument spielt das Kind?
 *
 * Vier Moeglichkeiten: Trompete in B, Horn in F, Horn in Es, Tenorhorn.
 * Das Notenbild bleibt bei allen vier GENAU dasselbe — Violinschluessel,
 * notiert c1 bis d2, dieselben Farben, dieselben Tiere. Unterschiedlich
 * sind nur drei Dinge:
 *
 *   1. wie tief es klingt. Notiert c1 klingt auf der Trompete in B zwei
 *      Halbtoene tiefer (B), auf dem Horn in F sieben (F), auf dem Horn
 *      in Es neun (Es), auf dem Tenorhorn vierzehn (B, eine Oktave
 *      tiefer als die Trompete). Danach richtet sich, was die App
 *      vorspielt UND was das Mikrofon erwartet.
 *
 *   2. wie weit hinunter zugehoert wird. Das tiefste notierte c klingt
 *      auf dem Tenorhorn 117 Hz — der Hochpass der Trompete (200 Hz)
 *      wuerde diesen Ton wegfiltern.
 *
 *   3. das Griffbild: Perinet-Ventile bei Trompete und Tenorhorn,
 *      Drehventil-Hebel beim Horn.
 *
 * Die GRIFFE selbst sind bei allen vier gleich, und das ist kein
 * Versehen: drei Ventile senken die Naturtonreihe immer um dieselben
 * Schritte, gleichgueltig in welcher Stimmung das Instrument gebaut ist.
 * Notiert d1 ist auf jedem dieser Instrumente 1 + 3.
 *
 * Gewechselt wird im Elternbereich. Danach laedt die App neu — die
 * Erkennung, der Sampler und das Griffbild haengen alle daran, und ein
 * halber Wechsel waere schlimmer als ein kurzer Neustart. Der
 * Fortschritt liegt im Speicher des Geraets und bleibt erhalten.
 */
(function (root) {
  'use strict';

  var SCHLUESSEL = 'hb-instrument';
  var STANDARD = 'b-trompete';
  var liste = [];
  var aktiv = null;

  function gemerkt() {
    try { return root.localStorage.getItem(SCHLUESSEL) || STANDARD; }
    catch (e) { return STANDARD; }
  }

  function merken(id) {
    try { root.localStorage.setItem(SCHLUESSEL, id); } catch (e) { /* Privatmodus */ }
  }

  function finden(id) {
    for (var i = 0; i < liste.length; i++) { if (liste[i].id === id) { return liste[i]; } }
    return null;
  }

  /** Rechnet einen Ton auf das gewaehlte Instrument um.
   *
   *  notiertMidi bleibt, wie es ist — das Notenbild aendert sich nie.
   *  klingendMidi und frequenzHz folgen der Stimmung des Instruments. */
  function umrechnen(ton, halbtoene, a1Hz) {
    ton.klingendMidi = ton.notiertMidi - halbtoene;
    ton.frequenzHz = Math.round(a1Hz * Math.pow(2, (ton.klingendMidi - 69) / 12) * 100) / 100;
  }

  /** Wendet die Wahl auf die geladenen Daten an. Wird EINMAL beim
   *  Aufbauen gerufen, bevor Motor, Tracker und Griffbild entstehen. */
  function anwenden(daten) {
    liste = daten.instrumente || [];
    aktiv = finden(gemerkt()) || finden(STANDARD) || liste[0] || {
      id: STANDARD, halbtoeneTiefer: 2, griffbild: 'trompete'
    };

    var a1Hz = (daten.stimmung && daten.stimmung.a1Hz) || 440;
    var halb = aktiv.halbtoeneTiefer;
    (daten.toene || []).forEach(function (t) { umrechnen(t, halb, a1Hz); });
    (daten.buchToene || []).forEach(function (t) { umrechnen(t, halb, a1Hz); });

    // Hoerbereich und Hochpass des Instruments uebernehmen.
    if (aktiv.erkennung) {
      for (var schl in aktiv.erkennung) {
        if (Object.prototype.hasOwnProperty.call(aktiv.erkennung, schl)) {
          daten.erkennung[schl] = aktiv.erkennung[schl];
        }
      }
    }
    daten.instrument = aktiv.id;
    return aktiv;
  }

  function setzen(id) {
    if (!finden(id) && id !== STANDARD) { return; }
    merken(id);
  }

  root.Instrument = {
    anwenden: anwenden,
    setzen: setzen,
    jetzt: function () { return aktiv; },
    id: function () { return aktiv ? aktiv.id : gemerkt(); },
    alle: function () { return liste.slice(); },
    standard: STANDARD
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
