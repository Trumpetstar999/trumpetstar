/* satz.js — das Notenbild eines Buchstuecks.
 *
 * Level 1 bis 3 zeichnet noten.js: Viertel, Halbe, Ganze, sonst nichts.
 * Das Buch braucht mehr, und zwar genau so, wie es gedruckt ist:
 * Tonart und Taktart, Achtel mit Balken, Punkte, Halte- und Bindebogen,
 * Triolen, Wiederholungszeichen mit 1./2. Klammer, Mehrtaktpausen und
 * die kleinen Haken der Atemzeichen. Das Kind haelt das Buch neben das
 * iPad — jede Abweichung ist eine Frage, die es nicht stellen kann.
 *
 * Gezeichnet wird zeilenweise, mit den Zeilen des Buches. Es gibt zwei
 * Ansichten:
 *
 *   eine Zeile   gross, fuer das Ueben Zeile fuer Zeile
 *   zwei Zeilen  fuer das ganze Lied; beim Spielen rueckt die naechste
 *                Zeile nach
 *
 * Alle Masse rechnen in Zwischenraeumen (Z), wie in noten.js: die fuenf
 * Linien liegen bei y = -2 .. +2, die Mittellinie ist h1. Einheitlich
 * ueber alle Zeilen eines Stuecks, damit die Noten beim Weiterruecken
 * nicht die Groesse wechseln.
 *
 * Das Bild wird EINMAL gebaut. Marker, Haekchen und das Nachruecken
 * aendern danach nur einzelne Elemente — ein ganzes Lied hat mehrere
 * hundert Noten, und der Marker wechselt mehrmals in der Sekunde.
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var TICKS = 48;

  var KOPF_RX = 0.63, KOPF_RY = 0.5;
  var HALS = 3.2;                  // Halslaenge
  var BALKEN_DICKE = 0.46;
  var BALKEN_ABSTAND = 0.76;       // zweiter Balken bei Sechzehnteln
  var ZEILEN_LUFT = 0.8;
  var SK = 0.92;                   // Massstab des Violinschluessels

  /* Vorzeichen der Tonart auf den Notenstufen des Violinschluessels. */
  var KREUZ_STUFEN = [4, 1, 5, 2, -1, 3, 0];
  var B_STUFEN = [0, 3, -1, 2, -2, 1, -3];

  /* Die Ziffern der Taktangabe, gestochen wie im Notendruck.
   *
   * Sie kommen nicht aus einer Schrift des Geraets: Georgia — die schoene
   * Serifenschrift, die auf jedem iPad da ist — hat Mediaevalziffern, und
   * dort haengen 3, 4, 5, 7 und 9 unter die Grundlinie. Die Taktangabe
   * sass dadurch einen halben Zwischenraum zu tief.
   *
   * Die Umrisse stammen aus Leland, der Notenschrift von MuseScore
   * (Copyright (c) 2021 MuseScore BVBA, SIL Open Font License 1.1). Jede
   * Ziffer ist genau zwei Zwischenraeume hoch und um ihre Grundlinie
   * zentriert — so fuellt der Zaehler die obere, der Nenner die untere
   * Haelfte des Systems. b ist die Breite in Zwischenraeumen. */
  var ZIFFERN = {
    '0': { b: 1.62, d: 'M0.81-1.02C0.38-1.02 0.06-0.58 0.06 0C0.06 0.58 0.38 1.02 0.81 1.02C1.23 1.02 1.56 0.58 1.56 0C1.56-0.58 1.23-1.02 0.81-1.02ZM1.04 0.56C1.04 0.7 0.98 0.86 0.81 0.86C0.64 0.86 0.57 0.7 0.57 0.56V-0.56C0.57-0.7 0.64-0.86 0.81-0.86C0.98-0.86 1.04-0.7 1.04-0.56Z' },
    '1': { b: 1.4, d: 'M1 0.79V-0.93C1-0.96 0.98-0.98 0.95-0.98H0.55C0.54-0.98 0.54-0.98 0.53-0.97C0.52-0.97 0.52-0.96 0.51-0.96L0.06-0.18C0.06-0.17 0.06-0.16 0.06-0.16C0.06-0.14 0.07-0.12 0.08-0.12L0.16-0.07C0.17-0.07 0.18-0.06 0.18-0.06C0.2-0.06 0.22-0.08 0.22-0.09L0.51-0.58V0.79H0.2C0.18 0.79 0.16 0.81 0.16 0.84V0.92C0.16 0.95 0.18 0.97 0.2 0.97H1.3C1.33 0.97 1.34 0.95 1.34 0.92V0.84C1.34 0.81 1.33 0.79 1.3 0.79Z' },
    '2': { b: 1.57, d: 'M1.37 0.16C1.34 0.24 1.26 0.53 1.06 0.53C0.8 0.53 0.74 0.37 0.53 0.37C0.5 0.37 0.46 0.38 0.42 0.38C0.42 0.38 0.52 0.23 0.95 0.1C1.37-0.03 1.48-0.24 1.48-0.48C1.48-0.65 1.4-0.98 0.8-0.98C0.2-0.98 0.08-0.62 0.08-0.43C0.08-0.27 0.22-0.14 0.38-0.14C0.55-0.14 0.68-0.27 0.68-0.43C0.68-0.54 0.6-0.67 0.5-0.71C0.48-0.71 0.47-0.73 0.47-0.75C0.47-0.78 0.49-0.8 0.56-0.82C0.58-0.83 0.64-0.84 0.7-0.84C0.92-0.84 0.97-0.7 0.97-0.5C0.97-0.03 0.41 0.07 0.18 0.42C0.18 0.42 0.06 0.58 0.06 0.77C0.06 0.96 0.16 0.97 0.2 0.97C0.27 0.97 0.34 0.92 0.34 0.85C0.34 0.83 0.33 0.82 0.32 0.8C0.3 0.74 0.29 0.7 0.29 0.66C0.29 0.65 0.29 0.64 0.3 0.63C0.3 0.6 0.33 0.56 0.43 0.56C0.54 0.56 0.59 0.7 0.66 0.8C0.73 0.91 0.84 0.97 0.97 0.97C1.1 0.97 1.27 0.88 1.34 0.73C1.42 0.58 1.51 0.28 1.51 0.18C1.51 0.12 1.48 0.1 1.44 0.1C1.41 0.1 1.38 0.12 1.37 0.16Z' },
    '3': { b: 1.52, d: 'M1.09-0.06C1.29-0.14 1.43-0.27 1.43-0.49C1.43-0.52 1.42-0.98 0.73-0.98C0.04-0.98 0.06-0.49 0.06-0.49H0.06L0.06-0.48C0.06-0.34 0.18-0.22 0.32-0.22C0.46-0.22 0.58-0.34 0.58-0.48C0.58-0.6 0.49-0.71 0.38-0.73C0.38-0.74 0.38-0.74 0.39-0.74C0.44-0.78 0.52-0.8 0.6-0.8C0.76-0.8 0.94-0.7 0.94-0.49C0.94-0.24 0.76-0.2 0.71-0.19C0.66-0.18 0.44-0.17 0.39-0.17C0.34-0.17 0.34-0.11 0.34-0.11V-0.03C0.34-0.03 0.34 0.01 0.39 0.02C0.46 0.02 0.55 0.02 0.68 0.04C0.85 0.06 0.94 0.18 0.94 0.46C0.94 0.73 0.76 0.8 0.6 0.8C0.48 0.8 0.38 0.77 0.34 0.74C0.47 0.73 0.58 0.62 0.58 0.48C0.58 0.34 0.46 0.22 0.32 0.22C0.18 0.22 0.06 0.34 0.06 0.48C0.06 0.81 0.36 0.98 0.66 0.98C1.04 0.98 1.46 0.84 1.46 0.41C1.46 0.12 1.26-0.01 1.08-0.06Z' },
    '4': { b: 1.83, d: 'M0.83 0.51V0.8H0.5C0.47 0.8 0.44 0.83 0.44 0.86V0.94C0.44 0.97 0.47 0.99 0.5 0.99H1.71C1.74 0.99 1.77 0.97 1.77 0.94V0.86C1.77 0.83 1.74 0.8 1.71 0.8H1.36V0.51H1.71C1.74 0.51 1.77 0.48 1.77 0.45V0.37C1.77 0.34 1.74 0.32 1.71 0.32H1.36V-0.32C1.36-0.34 1.34-0.36 1.32-0.37L1.28-0.4C1.27-0.4 1.26-0.4 1.25-0.4C1.24-0.4 1.22-0.4 1.21-0.39L0.85-0.06C0.84-0.04 0.83-0.03 0.83-0.01V0.32H0.37C0.37 0.32 0.82-0.16 1.29-0.8C1.3-0.82 1.31-0.84 1.31-0.85C1.31-0.87 1.3-0.89 1.3-0.89L1.21-0.98C1.2-0.99 1.18-1 1.17-1C1.14-1 0.6-1 0.58-1C0.54-1 0.52-0.97 0.52-0.95C0.52-0.95 0.5-0.65 0.4-0.33C0.29 0 0.17 0.2 0.07 0.34C0.07 0.34 0.06 0.36 0.06 0.39C0.06 0.4 0.06 0.4 0.06 0.41C0.08 0.44 0.1 0.48 0.1 0.48C0.1 0.48 0.11 0.51 0.14 0.51Z' },
    '5': { b: 1.51, d: 'M0.11-0.87C0.11-0.87 0.13-0.68 0.13-0.47C0.13-0.29 0.12-0.11 0.11 0.07C0.11 0.07 0.11 0.07 0.11 0.08C0.11 0.1 0.11 0.13 0.14 0.13C0.17 0.14 0.26 0.16 0.28 0.16C0.28 0.16 0.29 0.17 0.3 0.17C0.31 0.17 0.33 0.16 0.34 0.14C0.36 0.08 0.4-0.12 0.65-0.12C0.94-0.12 0.99 0.12 0.99 0.31C0.99 0.55 0.91 0.81 0.63 0.81C0.54 0.81 0.48 0.8 0.46 0.78C0.45 0.78 0.44 0.77 0.44 0.76C0.44 0.75 0.44 0.74 0.46 0.73C0.49 0.71 0.62 0.66 0.62 0.47C0.62 0.27 0.48 0.2 0.32 0.2C0.17 0.2 0.06 0.34 0.06 0.48C0.06 0.83 0.39 0.98 0.7 0.98C1.11 0.98 1.45 0.73 1.45 0.3C1.45-0.12 1.15-0.34 0.75-0.34C0.62-0.34 0.48-0.31 0.36-0.23C0.36-0.23 0.35-0.23 0.35-0.23C0.33-0.23 0.32-0.24 0.32-0.26V-0.51C0.32-0.53 0.34-0.55 0.36-0.55H0.37C0.43-0.55 0.56-0.53 0.7-0.53C0.99-0.53 1.2-0.59 1.32-0.89C1.32-0.9 1.32-0.92 1.32-0.93C1.32-0.96 1.3-0.98 1.25-0.98C1.24-0.98 1.22-0.98 1.2-0.98C1-0.93 0.85-0.91 0.7-0.91C0.56-0.91 0.42-0.93 0.24-0.95C0.24-0.95 0.22-0.96 0.2-0.96C0.14-0.96 0.11-0.94 0.11-0.87Z' },
    '6': { b: 1.61, d: 'M0.99-0.19C0.74-0.19 0.66-0.12 0.6-0.06C0.59-0.14 0.58-0.21 0.58-0.27C0.58-0.5 0.66-0.8 0.94-0.8C1.04-0.8 1.1-0.76 1.14-0.72C1.06-0.68 0.99-0.58 0.99-0.48C0.99-0.34 1.1-0.23 1.24-0.23C1.39-0.23 1.5-0.34 1.5-0.48V-0.5C1.5-0.53 1.5-0.59 1.48-0.62C1.43-0.77 1.26-0.98 0.86-0.98C0.5-0.98 0.24-0.64 0.16-0.45C0.12-0.36 0.06-0.16 0.06 0.06C0.06 0.31 0.13 0.58 0.36 0.79C0.6 0.97 0.74 0.98 0.88 0.98C1.02 0.98 1.55 0.81 1.55 0.35C1.55-0.04 1.24-0.19 0.99-0.19ZM0.84 0.81C0.71 0.81 0.6 0.63 0.6 0.4C0.6 0.18 0.71 0 0.84 0C0.97 0 1.08 0.18 1.08 0.4C1.08 0.63 0.97 0.81 0.84 0.81Z' },
    '7': { b: 1.52, d: 'M0.65 0.49C0.56 0.62 0.44 0.78 0.44 0.93C0.44 0.98 0.46 1 0.5 1C0.56 1 0.6 0.98 0.73 0.98C0.74 0.98 0.76 0.98 0.78 0.98C0.89 0.97 1 1 1.02 1C1.06 1 1.13 0.96 1.12 0.92C1.12 0.92 1.12 0.91 1.12 0.91C1.12 0.9 1.1 0.78 1.1 0.63C1.1 0.54 1.11 0.45 1.13 0.36C1.18 0.17 1.31-0.17 1.4-0.42C1.44-0.54 1.46-0.77 1.46-0.86C1.46-0.89 1.46-0.91 1.46-0.95C1.46-0.99 1.44-1 1.42-1C1.4-1 1.36-1 1.34-1C1.32-1 1.3-0.99 1.3-0.95C1.3-0.91 1.29-0.64 1.13-0.64C0.96-0.64 0.91-0.98 0.65-0.98C0.4-0.98 0.25-0.72 0.24-0.7V-0.89C0.24-0.92 0.22-0.94 0.2-0.94H0.1C0.08-0.94 0.06-0.92 0.06-0.89V-0.15C0.06-0.13 0.08-0.11 0.1-0.11H0.2C0.22-0.11 0.24-0.13 0.24-0.15V-0.28C0.24-0.37 0.3-0.5 0.44-0.5C0.58-0.5 0.59-0.34 0.91-0.34C0.99-0.34 1.14-0.36 1.18-0.4C1.15-0.34 0.74 0.36 0.65 0.49Z' },
    '8': { b: 1.63, d: 'M1.3-0.07C1.43-0.17 1.52-0.3 1.52-0.46C1.52-0.75 1.2-0.98 0.82-0.98C0.43-0.98 0.11-0.75 0.11-0.46C0.11-0.3 0.15-0.16 0.34-0.04C0.16 0.07 0.06 0.22 0.06 0.41C0.06 0.73 0.4 0.99 0.82 0.99C1.23 0.99 1.57 0.73 1.57 0.41C1.57 0.22 1.5 0.04 1.3-0.07ZM1.07-0.18C0.8-0.27 0.5-0.4 0.5-0.58C0.5-0.74 0.64-0.8 0.82-0.8C1.06-0.8 1.23-0.68 1.23-0.5C1.23-0.31 1.14-0.22 1.07-0.18ZM0.82 0.77C0.56 0.77 0.34 0.63 0.34 0.4C0.34 0.14 0.55 0.07 0.55 0.07C0.82 0.16 1.21 0.3 1.21 0.52C1.21 0.63 1.07 0.77 0.82 0.77Z' },
    '9': { b: 1.61, d: 'M0.62 0.19C0.86 0.19 0.95 0.12 1.01 0.06C1.02 0.14 1.03 0.2 1.03 0.27C1.03 0.5 0.95 0.79 0.67 0.79C0.57 0.79 0.51 0.76 0.47 0.72C0.55 0.68 0.62 0.57 0.62 0.48C0.62 0.34 0.51 0.22 0.36 0.22C0.22 0.22 0.1 0.34 0.1 0.48V0.49C0.1 0.53 0.11 0.59 0.13 0.62C0.18 0.76 0.35 0.98 0.75 0.98C1.11 0.98 1.37 0.63 1.45 0.45C1.49 0.35 1.55 0.16 1.55-0.07C1.55-0.31 1.48-0.59 1.24-0.8C1.01-0.97 0.86-0.98 0.72-0.98C0.58-0.98 0.06-0.82 0.06-0.35C0.06 0.04 0.37 0.19 0.62 0.19ZM0.77-0.82C0.9-0.82 1.01-0.63 1.01-0.41C1.01-0.18 0.9 0 0.77 0C0.64 0 0.52-0.18 0.52-0.41C0.52-0.63 0.64-0.82 0.77-0.82Z' }
  };

  /* Farbe: die des Tonbuchstabens. Stufe 0 ist h, 1 ist c ... */
  var BUCHSTABE = ['h1', 'c1', 'd1', 'e1', 'f1', 'g1', 'a1'];

  function el(name, attr, eltern) {
    var e = document.createElementNS(NS, name);
    for (var k in attr) {
      if (attr[k] !== null && attr[k] !== undefined) { e.setAttribute(k, attr[k]); }
    }
    if (eltern) { eltern.appendChild(e); }
    return e;
  }
  function r2(v) { return Math.round(v * 1000) / 1000; }

  /* ---------------------------------------------------------------- */
  /* Zeichen                                                           */
  /* ---------------------------------------------------------------- */

  function kreuz(g, x, y) {
    var s = { stroke: 'var(--linie)', 'stroke-linecap': 'butt' };
    el('line', mix(s, { x1: r2(x - 0.17), y1: r2(y - 0.95), x2: r2(x - 0.17), y2: r2(y + 1.15), 'stroke-width': 0.12 }), g);
    el('line', mix(s, { x1: r2(x + 0.17), y1: r2(y - 1.15), x2: r2(x + 0.17), y2: r2(y + 0.95), 'stroke-width': 0.12 }), g);
    el('line', mix(s, { x1: r2(x - 0.42), y1: r2(y - 0.22), x2: r2(x + 0.42), y2: r2(y - 0.48), 'stroke-width': 0.24 }), g);
    el('line', mix(s, { x1: r2(x - 0.42), y1: r2(y + 0.48), x2: r2(x + 0.42), y2: r2(y + 0.22), 'stroke-width': 0.24 }), g);
  }
  function be(g, x, y) {
    el('line', { x1: r2(x - 0.28), y1: r2(y - 1.6), x2: r2(x - 0.28), y2: r2(y + 0.5),
                 stroke: 'var(--linie)', 'stroke-width': 0.13 }, g);
    el('path', { d: 'M' + r2(x - 0.28) + ',' + r2(y + 0.5) +
                    ' C' + r2(x + 0.62) + ',' + r2(y - 0.02) + ' ' + r2(x + 0.42) + ',' + r2(y - 0.78) +
                    ' ' + r2(x - 0.28) + ',' + r2(y - 0.18),
                 fill: 'none', stroke: 'var(--linie)', 'stroke-width': 0.17 }, g);
  }
  function aufloesung(g, x, y) {
    var s = { stroke: 'var(--linie)' };
    el('line', mix(s, { x1: r2(x - 0.2), y1: r2(y - 1.1), x2: r2(x - 0.2), y2: r2(y + 0.55), 'stroke-width': 0.12 }), g);
    el('line', mix(s, { x1: r2(x + 0.2), y1: r2(y - 0.55), x2: r2(x + 0.2), y2: r2(y + 1.1), 'stroke-width': 0.12 }), g);
    el('line', mix(s, { x1: r2(x - 0.2), y1: r2(y - 0.3), x2: r2(x + 0.2), y2: r2(y - 0.46), 'stroke-width': 0.24 }), g);
    el('line', mix(s, { x1: r2(x - 0.2), y1: r2(y + 0.46), x2: r2(x + 0.2), y2: r2(y + 0.3), 'stroke-width': 0.24 }), g);
  }
  function vorzeichen(g, art, x, y) {
    if (art === '#') { kreuz(g, x, y); } else if (art === 'b') { be(g, x, y); } else { aufloesung(g, x, y); }
  }
  function mix(a, b) { var o = {}, k; for (k in a) { o[k] = a[k]; } for (k in b) { o[k] = b[k]; } return o; }

  function pause(g, x, wert, ganzTakt) {
    var linie = 'var(--linie)';
    if (wert === 1 || ganzTakt) {
      el('rect', { x: r2(x - 0.5), y: -1, width: 1, height: 0.44, fill: linie }, g);
    } else if (wert === 2) {
      el('rect', { x: r2(x - 0.5), y: -0.44, width: 1, height: 0.44, fill: linie }, g);
    } else if (wert === 4) {
      el('path', { d: 'M' + r2(x - 0.16) + ',-1.3 L' + r2(x + 0.2) + ',-0.62 L' + r2(x - 0.14) + ',-0.1' +
                      ' L' + r2(x + 0.22) + ',0.52 C' + r2(x - 0.02) + ',0.32 ' + r2(x - 0.28) + ',0.5 ' +
                      r2(x - 0.1) + ',0.9',
                   fill: 'none', stroke: linie, 'stroke-width': 0.2, 'stroke-linecap': 'round',
                   'stroke-linejoin': 'round' }, g);
    } else {
      var faehnchen = wert >= 16 ? 2 : 1;
      el('line', { x1: r2(x + 0.32), y1: -0.55, x2: r2(x - 0.12), y2: r2(faehnchen === 2 ? 1.35 : 0.95),
                   stroke: linie, 'stroke-width': 0.13, 'stroke-linecap': 'round' }, g);
      for (var f = 0; f < faehnchen; f++) {
        var fy = -0.5 + f * 0.72;
        el('circle', { cx: r2(x - 0.2), cy: r2(fy), r: 0.19, fill: linie }, g);
        el('path', { d: 'M' + r2(x - 0.2) + ',' + r2(fy + 0.05) + ' Q' + r2(x + 0.05) + ',' + r2(fy + 0.25) +
                        ' ' + r2(x + 0.32 - f * 0.18) + ',' + r2(fy - 0.05),
                     fill: 'none', stroke: linie, 'stroke-width': 0.12 }, g);
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Das Bild                                                          */
  /* ---------------------------------------------------------------- */

  /**
   * svg  <svg>-Element
   * o    { takte, zeilen: [[von, bis], ...], zeigen: [ersteZeile, letzteZeile],
   *        sichtbar: 1|2, breitePx, hoehePx, tonKarte, einfarbig }
   */
  function Bild(svg, o) {
    this.svg = svg;
    this.o = o;
    this.takte = o.takte;
    this.zeilen = o.zeilen;
    this.sichtbar = o.sichtbar || 1;
    this.pos = {};
    this.hakenEl = {};
    this.oben = 0;
    this._bauen();
  }

  Bild.prototype._farbe = function (stufe) {
    if (this.o.einfarbig) { return { fuell: 'var(--linie)', rand: 'var(--linie)' }; }
    var ton = this.o.tonKarte[BUCHSTABE[((stufe % 7) + 7) % 7]];
    return ton ? { fuell: ton.farbe, rand: ton.farbeRand } : { fuell: 'var(--linie)', rand: 'var(--linie)' };
  };

  /* Die Takte einer Zeile in Elemente zerlegen und ihre Mindestbreite
   * bestimmen. Noch ohne Koordinaten — die kommen erst, wenn feststeht,
   * wie breit die Zeile werden darf. */
  Bild.prototype._zeileAufbereiten = function (von, bis, tonart, taktart) {
    var z = { von: von, bis: bis, teile: [], kopfBreite: 0, mindest: 0, gewicht: 0 };
    var vz = tonart;
    /* Kopf: Schluessel, Tonart, beim ersten Takt des Stuecks oder bei
     * einem Wechsel auch die Taktart. So steht es im Buch. */
    if (this.takte[von].vz !== undefined) { vz = this.takte[von].vz; }
    z.vz = vz;
    // `tu`: im Buch ohne Taktangabe gedruckt (die ersten Seiten).
    z.taktart = (this.takte[von].ta && !this.takte[von].tu) ? this.takte[von].ta : null;
    z.kopfBreite = 0.5 + 2.6 + (vz ? Math.abs(vz) * 0.82 + 0.4 : 0) + (z.taktart ? 2.9 : 0.2);
    if (this.takte[von].li === '|:') { z.kopfBreite += 1.1; }

    for (var b = von; b < bis; b++) {
      var takt = this.takte[b];
      var teil = { takt: b, noten: [], links: 0 };
      if (b > von) {
        if (takt.vz !== undefined && takt.vz !== vz) { teil.vzWechsel = takt.vz; teil.links += Math.abs(takt.vz || 1) * 0.82 + 0.6; vz = takt.vz; }
        if (takt.ta) { teil.taWechsel = takt.ta; teil.links += 2.9; }
        if (takt.li === '|:') { teil.links += 1.0; }
      }
      if (takt.ta) { taktart = takt.ta; }
      if (takt.mr) {
        teil.mr = takt.mr;
        teil.mindest = 7;
        teil.gewicht = 2;
      } else {
        var allein = takt.n.length === 1 && !takt.n[0].t;
        takt.n.forEach(function (n, i) {
          var m = 1.85;
          if (!n.t) { m = 1.5; }
          if (n.v) { m += 1.0; }
          if (n.p) { m += 0.45 * n.p; }
          if (n.t && n.w >= 8 && !n.b) { m += 0.5; }
          if (n.w >= 16) { m -= 0.15; }
          var dauer = n.d / TICKS;
          teil.noten.push({ n: n, i: i, mindest: m, gewicht: Math.pow(dauer, 0.62), ganzTakt: allein });
        });
        teil.mindest = teil.noten.reduce(function (s, x) { return s + x.mindest; }, 0);
        teil.gewicht = teil.noten.reduce(function (s, x) { return s + x.gewicht; }, 0);
      }
      teil.mindest += teil.links;
      teil.strich = takt.re === ':|' ? 1.25 : (takt.re === '|.' ? 1.0 : (takt.re === '||' ? 0.85 : 0.62));
      z.teile.push(teil);
      z.mindest += teil.mindest + teil.strich;
      z.gewicht += teil.gewicht;
    }
    z.mindest += z.kopfBreite + 0.3;
    z.nachher = { vz: vz, taktart: taktart };
    return z;
  };

  Bild.prototype._bauen = function () {
    var svg = this.svg, o = this.o, selbst = this;
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    // 1) Zeilen aufbereiten
    var vz = 0, ta = [4, 4];
    this.z = this.zeilen.map(function (zl) {
      var z = selbst._zeileAufbereiten(zl[0], zl[1], vz, ta);
      vz = z.nachher.vz; ta = z.nachher.taktart;
      return z;
    });

    // 2) Senkrechte Ausdehnung, einheitlich fuer alle Zeilen
    this.z.forEach(function (z) { selbst._hoehe(z); });
    var oben = -2, unten = 2;
    this.z.forEach(function (z) { oben = Math.min(oben, z.oben); unten = Math.max(unten, z.unten); });
    this.zeilenOben = oben;
    this.zeilenHoehe = unten - oben;

    /* 3) Massstab: die dichteste Zeile des STUECKS bestimmt die Breite,
     * auch wenn gerade nur eine Zeile gezeigt wird. So behalten die
     * Noten ihre Groesse, wenn das Kind zur naechsten Zeile weitergeht.
     * Nach oben ist die Groesse begrenzt: vier ganze Noten wuerden sonst
     * den halben Bildschirm fuellen. */
    var zeigen = o.zeigen || [0, this.z.length - 1];
    var breitesteZ = 0, zi;
    for (zi = 0; zi < this.z.length; zi++) { breitesteZ = Math.max(breitesteZ, this.z[zi].mindest); }
    var sichtHoeheZ = this.sichtbar * this.zeilenHoehe + (this.sichtbar - 1) * ZEILEN_LUFT;
    var zPx = Math.min(o.breitePx / (breitesteZ * 1.08), o.hoehePx / sichtHoeheZ, o.hoehePx / 9);
    this.zPx = zPx;
    this.breiteZ = o.breitePx / zPx;
    this.hoeheZ = o.hoehePx / zPx;
    this.zeigen = zeigen;

    svg.setAttribute('width', o.breitePx);
    svg.setAttribute('height', o.hoehePx);
    svg.setAttribute('viewBox', '0 0 ' + r2(this.breiteZ) + ' ' + r2(this.hoeheZ));

    // Der sichtbare Block steht senkrecht in der Mitte.
    this.randOben = (this.hoeheZ - sichtHoeheZ) / 2;
    this.inhalt = el('g', { 'class': 'satz-inhalt' }, svg);
    this.ebeneNoten = el('g', {}, this.inhalt);
    this.ebeneHaken = el('g', {}, this.inhalt);
    this.ring = el('circle', { r: 0.95, fill: 'none', stroke: 'var(--marker)', 'stroke-width': 0.16,
                               'class': 'marker-ring', visibility: 'hidden' }, this.inhalt);

    // Beginnt die erste gezeigte Zeile mitten in einer 1./2. Klammer?
    this._klammerOffen = false;
    for (var b = 0; b < this.z[zeigen[0]].von; b++) {
      if (this.takte[b].vs) { this._klammerOffen = true; }
      if (this.takte[b].ve) { this._klammerOffen = false; }
    }
    for (zi = zeigen[0]; zi <= zeigen[1]; zi++) { this._zeileZeichnen(this.z[zi], zi); }
    this.zeigeZeile(zeigen[0], true);
  };

  /* Wie weit reicht eine Zeile nach oben und unten? Mit Platz fuer
   * Haekchen ueber den Noten und fuer die 1./2. Klammer — und fuer das,
   * was ueber Kopf und Hals hinausragt: Balken, Atemzeichen, Boegen und
   * Artikulation. Was hier fehlt, schneidet der Rand des Bildes ab,
   * sobald die Zeile oben oder unten im Bild steht. Was hier zu viel
   * ist, macht im ganzen Lied alle Noten kleiner — deshalb wird so
   * gerechnet, wie _balken, _artikulation, _atem und _bogen zeichnen. */
  Bild.prototype._hoehe = function (z) {
    var oben = -2.9, unten = 2.9;          // mindestens der Violinschluessel
    var klammer = false;
    var alle = [];                         // die klingenden Noten der Zeile
    function balken(gruppe) {
      // Richtung und Lage des Balkens wie in _balken.
      var summe = 0;
      gruppe.forEach(function (i) { summe += i.n.s; });
      var hoch = summe < 0, s = hoch ? -1 : 1;
      var a = gruppe[0], b = gruppe[gruppe.length - 1];
      var ya = a.y + s * HALS, yb = b.y + s * HALS;
      var neigung = Math.max(-0.6, Math.min(0.6, yb - ya)), mitte = (ya + yb) / 2;
      ya = mitte - neigung / 2; yb = mitte + neigung / 2;
      /* Kein Hals kuerzer als 2.5. Wo genau der Balken ueber einer
       * mittleren Note liegt, haengt von den Abstaenden ab; gerechnet
       * wird mit dem Balkenende, das ihr naeher kaeme. */
      var nah = hoch ? Math.max(ya, yb) : Math.min(ya, yb), schieben = 0;
      gruppe.forEach(function (i, j) {
        var by = j === 0 ? ya : (j === gruppe.length - 1 ? yb : nah);
        schieben = Math.max(schieben, 2.5 - s * (by - i.y));
      });
      ya += s * schieben; yb += s * schieben;
      gruppe.forEach(function (i) { i.hoch = hoch; i.ende = hoch ? Math.min(ya, yb) : Math.max(ya, yb); });
      if (a.n.tr) {                        // die Triolenziffer am Balken
        var by2 = (ya + yb) / 2;
        if (hoch) { oben = Math.min(oben, Math.min(by2, a.y - 1, b.y - 1) - 0.9 - 1.2); }
        else { unten = Math.max(unten, Math.max(by2, a.y + 1, b.y + 1) + 1.4 + 0.3); }
      }
    }
    // Ein Bogen liegt auf einer Seite der Koepfe und reicht so weit hinaus.
    function bogen(i, untendrunter, weit) {
      if (untendrunter) { unten = Math.max(unten, i.y + weit); } else { oben = Math.min(oben, i.y - weit); }
    }
    z.teile.forEach(function (teil) {
      if (this.takte[teil.takt].vs || this.takte[teil.takt].ve) { klammer = true; }
      if (teil.mr) { oben = Math.min(oben, -4.7); }   // die Zahl ueber der Mehrtaktpause
      var noten = [], gruppe = null;
      teil.noten.forEach(function (x) {
        var n = x.n;
        // Das Atemzeichen steht ueber der Note, ueber einer Pause auf -2.9 (_atem).
        if (n.at) { oben = Math.min(oben, Math.min(-2.9, (n.t ? -n.s / 2 : 0) - 1.5) - 0.84); }
        if (!n.t) { return; }
        var i = { n: n, y: -n.s / 2, hoch: n.s < 0 };
        i.ende = i.y + (i.hoch ? -HALS : HALS);
        noten.push(i);
        alle.push(i);
        var b = n.b ? n.b[0] : '';
        if (b === 'b') { gruppe = [i]; }
        else if (gruppe && (b === 'c' || b === 'e')) {
          gruppe.push(i);
          if (b === 'e') { balken(gruppe); gruppe = null; }
        }
      });
      noten.forEach(function (i) {
        var hals = i.n.w !== 1;
        oben = Math.min(oben, (hals && i.hoch ? Math.min(i.ende - 0.3, i.y - 0.6) : i.y - 0.6) - 1.2);
        unten = Math.max(unten, (hals && !i.hoch ? Math.max(i.ende + 0.3, i.y + 0.6) : i.y + 0.6) + 0.3);
        // Artikulation gegenueber dem Hals, genau wie _artikulation (nur mit Hals).
        if (hals && i.n.ar) {
          var seite = i.hoch ? 1 : -1, ay = i.y + seite * 1.05, rand = ay;
          if (Math.abs(ay - Math.round(ay)) < 0.01 && Math.abs(ay) <= 2) { ay += seite * 0.4; }
          if (i.n.ar.indexOf('s') >= 0) { rand = ay + seite * 0.15; ay += seite * 0.55; }
          if (i.n.ar.indexOf('t') >= 0) { rand = ay + seite * 0.07; ay += seite * 0.55; }
          if (i.n.ar.indexOf('>') >= 0) { rand = ay + seite * 0.34; }
          if (seite > 0) { unten = Math.max(unten, rand); } else { oben = Math.min(oben, rand); }
        }
      });
    }, this);
    /* Boegen wie in _boegen: ein Haltebogen auf der Seite gegenueber dem
     * Hals, ein Bindebogen unter den Koepfen nur, wenn alle Haelse unter
     * ihm nach oben zeigen. Hoechstens 0.75 + 0.975 weit; ein angefangener
     * Bogen am Zeilenanfang ist kurz und flach. */
    alle.forEach(function (i, k) {
      var bg = i.n.bg || '', bo = i.n.bo || '';
      if (bg.indexOf('a') >= 0) { bogen(i, i.hoch, 1.73); }
      if (bg.indexOf('z') >= 0 && k === 0) { bogen(i, i.hoch, 1.23); }
      if (bo.indexOf('a') >= 0) {
        var j = k + 1;
        while (j < alle.length && (alle[j].n.bo || '').indexOf('z') < 0) { j++; }
        var drunter = alle.slice(k, j + 1).every(function (x) { return x.hoch; });
        bogen(i, drunter, 1.73);
        if (j < alle.length) { bogen(alle[j], drunter, 1.73); }
      }
      if (bo.indexOf('z') >= 0 && bo.indexOf('a') < 0 &&
          !alle.slice(0, k).some(function (x) { return (x.n.bo || '').indexOf('a') >= 0; })) {
        bogen(i, i.hoch, 1.23);
      }
    });
    if (klammer) { oben = Math.min(oben, -4.9); }
    z.oben = oben - 0.3;
    z.unten = unten + 0.3;
  };

  Bild.prototype._zeileZeichnen = function (z, zi) {
    var selbst = this;
    var y0 = this.randOben - this.zeilenOben + zi * (this.zeilenHoehe + ZEILEN_LUFT);
    z.y0 = y0;
    var g = el('g', { transform: 'translate(0,' + r2(y0) + ')' }, this.ebeneNoten);
    var linie = 'var(--linie)';
    var ende = this.breiteZ - 0.3;

    for (var L = -2; L <= 2; L++) {
      el('line', { x1: 0.2, y1: L, x2: r2(ende), y2: L, stroke: linie, 'stroke-width': 0.085 }, g);
    }

    // Kopf
    var x = 0.5;
    el('path', { d: root.Noten.schluesselPfad(),
                 transform: 'translate(' + r2(x + 1.05 * SK) + ',' + r2(1 - SK) + ') scale(' + SK + ')',
                 fill: 'none', stroke: linie, 'stroke-width': r2(0.155 / SK),
                 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    x += 2.6;
    x = this._tonart(g, x, z.vz);
    if (z.taktart) { x = this._taktart(g, x, z.taktart); } else { x += 0.2; }
    if (this.takte[z.von].li === '|:') { x = this._wiederholungLinks(g, x); }

    // Breite verteilen: jeder bekommt sein Minimum, der Rest nach Dauer.
    var frei = Math.max(0, (ende - 0.1) - x - (z.mindest - z.kopfBreite - 0.3));
    var jeGewicht = z.gewicht > 0 ? frei / z.gewicht : 0;

    // Eine Klammer, die in der vorigen Zeile begann, laeuft hier weiter.
    var klammerStart = this._klammerOffen ? { x: x - 0.3, text: '' } : null;
    var balkenGruppe = null;
    var boegen = [];

    z.teile.forEach(function (teil, ti) {
      var takt = selbst.takte[teil.takt];
      var taktStart = x;
      if (teil.vzWechsel !== undefined) { x = selbst._tonart(g, x + 0.3, teil.vzWechsel) + 0.2; }
      if (teil.taWechsel) { x = selbst._taktart(g, x, teil.taWechsel); }
      if (ti > 0 && takt.li === '|:') { x = selbst._wiederholungLinks(g, x - 0.3); }
      if (takt.vs) { klammerStart = { x: taktStart, text: takt.vs.replace(/,/g, '., ') + '.' }; }

      var letzterTaktDerZeile = ti === z.teile.length - 1;
      if (teil.mr) {
        var breite = teil.mindest - teil.links + teil.gewicht * jeGewicht;
        selbst._mehrtaktpause(g, x, x + breite, teil.mr);
        x += breite;
      } else {
        teil.noten.forEach(function (nx, k) {
          var slot = nx.mindest + nx.gewicht * jeGewicht;
          var n = nx.n;
          var ref = teil.takt + ':' + nx.i;
          if (n.unsichtbar) { x += slot; return; }
          /* Das Atemzeichen nach der letzten Note eines Takts steht im
           * Buch ueber dem Taktstrich, sonst zwischen den beiden Noten. */
          var atemX = (k === teil.noten.length - 1)
            ? (letzterTaktDerZeile ? ende - 0.3 : x + slot + teil.strich / 2 - 0.1)
            : x + slot - 0.35;
          if (!n.t) {
            var px = nx.ganzTakt ? taktStart + (x + slot - taktStart) / 2 : x + 0.3 + 0.63;
            pause(g, px, n.w, nx.ganzTakt);
            if (n.p) { el('circle', { cx: r2(px + 0.75), cy: -0.5, r: 0.16, fill: linie }, g); }
            // Ueber einer Pause steht das Atemzeichen mittig darauf — dort wird geatmet.
            if (n.at) { selbst._atem(g, px, { y: 0 }); }
          } else {
            var kx = x + (n.v ? 1.0 : 0) + 0.3 + KOPF_RX;
            var info = selbst._note(g, n, kx, y0, ref, zi);
            if (n.b && n.b[0] === 'b') { balkenGruppe = [info]; }
            else if (balkenGruppe && n.b && (n.b[0] === 'c' || n.b[0] === 'e')) {
              balkenGruppe.push(info);
              if (n.b[0] === 'e') { selbst._balken(g, balkenGruppe); balkenGruppe = null; }
            } else {
              selbst._hals(g, info);
            }
            boegen.push(info);
            if (n.at) { selbst._atem(g, atemX, info); }
          }
          x += slot;
        });
      }
      if (balkenGruppe) { balkenGruppe.forEach(function (i) { selbst._hals(g, i); }); balkenGruppe = null; }

      // Taktstrich
      var letzter = letzterTaktDerZeile;
      var sx = letzter ? ende : x + teil.strich / 2;
      selbst._strich(g, sx, takt.re, letzter);
      if (klammerStart && takt.ve) {
        selbst._klammer(g, klammerStart.x, sx, klammerStart.text, takt.ve === 'z', z.oben);
        klammerStart = null;
      }
      x += teil.strich;
    });
    if (klammerStart) { this._klammer(g, klammerStart.x, ende, klammerStart.text, false, z.oben); }
    this._klammerOffen = !!klammerStart;

    this._boegen(g, boegen, zi);
  };

  Bild.prototype._tonart = function (g, x, vz) {
    if (!vz) { return x; }
    var stufen = vz > 0 ? KREUZ_STUFEN : B_STUFEN;
    for (var i = 0; i < Math.abs(vz); i++) {
      vorzeichen(g, vz > 0 ? '#' : 'b', x + 0.45, -stufen[i] / 2);
      x += 0.82;
    }
    return x + 0.55;
  };

  Bild.prototype._taktart = function (g, x, ta) {
    /* Vor den Ziffern bleibt Luft, damit sie nicht am Vorzeichen kleben,
     * und dahinter, damit die erste Note frei steht. */
    var mitte = x + 1.35;
    zahlZeichnen(g, ta[0], mitte, -1);           // Zaehler: obere Haelfte
    zahlZeichnen(g, ta[1], mitte, 1);            // Nenner: untere Haelfte
    return x + 2.9;
  };

  /* Eine Zahl aus den gestochenen Ziffern, waagerecht um `mitte`, mit der
   * Grundlinie auf `y`. Zweistellige Zahlen (12/8) stehen nebeneinander. */
  function zahlZeichnen(g, zahl, mitte, y) {
    var ziffern = String(zahl).split('');
    var breite = 0;
    ziffern.forEach(function (z) { breite += ZIFFERN[z] ? ZIFFERN[z].b : 1.5; });
    var x = mitte - breite / 2;
    ziffern.forEach(function (z) {
      if (ZIFFERN[z]) {
        el('path', { d: ZIFFERN[z].d, transform: 'translate(' + r2(x) + ',' + r2(y) + ')',
                     fill: 'var(--linie)' }, g);
      }
      x += ZIFFERN[z] ? ZIFFERN[z].b : 1.5;
    });
  }

  Bild.prototype._wiederholungLinks = function (g, x) {
    el('rect', { x: r2(x), y: -2, width: 0.3, height: 4, fill: 'var(--linie)' }, g);
    el('line', { x1: r2(x + 0.52), y1: -2, x2: r2(x + 0.52), y2: 2, stroke: 'var(--linie)', 'stroke-width': 0.08 }, g);
    el('circle', { cx: r2(x + 0.82), cy: -0.5, r: 0.17, fill: 'var(--linie)' }, g);
    el('circle', { cx: r2(x + 0.82), cy: 0.5, r: 0.17, fill: 'var(--linie)' }, g);
    return x + 1.1;
  };

  Bild.prototype._strich = function (g, x, art, amEnde) {
    var linie = 'var(--linie)';
    if (art === '|.' || art === ':|') {
      el('rect', { x: r2(x - 0.3), y: -2, width: 0.3, height: 4, fill: linie }, g);
      el('line', { x1: r2(x - 0.55), y1: -2, x2: r2(x - 0.55), y2: 2, stroke: linie, 'stroke-width': 0.08 }, g);
      if (art === ':|') {
        el('circle', { cx: r2(x - 0.88), cy: -0.5, r: 0.17, fill: linie }, g);
        el('circle', { cx: r2(x - 0.88), cy: 0.5, r: 0.17, fill: linie }, g);
      }
    } else if (art === '||') {
      el('line', { x1: r2(x - 0.3), y1: -2, x2: r2(x - 0.3), y2: 2, stroke: linie, 'stroke-width': 0.08 }, g);
      el('line', { x1: r2(x), y1: -2, x2: r2(x), y2: 2, stroke: linie, 'stroke-width': 0.08 }, g);
    } else {
      el('line', { x1: r2(amEnde ? x - 0.04 : x), y1: -2, x2: r2(amEnde ? x - 0.04 : x), y2: 2,
                   stroke: linie, 'stroke-width': 0.08 }, g);
    }
  };

  Bild.prototype._klammer = function (g, x1, x2, text, geschlossen, oben) {
    var y = Math.max(oben + 0.45, -4.5);
    var linie = 'var(--linie)';
    if (text) {
      el('line', { x1: r2(x1 + 0.12), y1: r2(y), x2: r2(x1 + 0.12), y2: r2(y + 1.3), stroke: linie, 'stroke-width': 0.09 }, g);
      el('text', { x: r2(x1 + 0.4), y: r2(y + 1.05), 'font-size': 1.15, fill: linie,
                   'font-family': 'Georgia, "Times New Roman", serif' }, g).textContent = text;
    }
    el('line', { x1: r2(x1 + 0.12), y1: r2(y), x2: r2(x2 - 0.2), y2: r2(y), stroke: linie, 'stroke-width': 0.09 }, g);
    if (geschlossen) {
      el('line', { x1: r2(x2 - 0.2), y1: r2(y), x2: r2(x2 - 0.2), y2: r2(y + 1.3), stroke: linie, 'stroke-width': 0.09 }, g);
    }
  };

  Bild.prototype._mehrtaktpause = function (g, x1, x2, anzahl) {
    var linie = 'var(--linie)';
    el('rect', { x: r2(x1 + 0.8), y: -0.45, width: r2(x2 - x1 - 1.6), height: 0.9, fill: linie }, g);
    el('line', { x1: r2(x1 + 0.8), y1: -1, x2: r2(x1 + 0.8), y2: 1, stroke: linie, 'stroke-width': 0.12 }, g);
    el('line', { x1: r2(x2 - 0.8), y1: -1, x2: r2(x2 - 0.8), y2: 1, stroke: linie, 'stroke-width': 0.12 }, g);
    // Die Zahl der Takte in denselben gestochenen Ziffern wie die Taktangabe.
    zahlZeichnen(g, anzahl, (x1 + x2) / 2, -3.45);
  };

  /* Notenkopf, Hilfslinien, Vorzeichen, Punkte, Artikulation. Der Hals
   * kommt spaeter — bei Balkengruppen haengt seine Laenge vom Balken ab. */
  Bild.prototype._note = function (g, n, kx, y0, ref, zi) {
    var y = -n.s / 2;
    var farbe = this._farbe(n.s);
    var linie = 'var(--linie)';

    for (var h = 3; h <= y + 0.01; h++) {
      el('line', { x1: r2(kx - 0.95), y1: h, x2: r2(kx + 0.95), y2: h, stroke: linie, 'stroke-width': 0.11 }, g);
    }
    for (var hh = -3; hh >= y - 0.01; hh--) {
      el('line', { x1: r2(kx - 0.95), y1: hh, x2: r2(kx + 0.95), y2: hh, stroke: linie, 'stroke-width': 0.11 }, g);
    }
    if (n.v) { vorzeichen(g, n.v, kx - KOPF_RX - 0.62, y); }

    var offen = n.w === 1 || n.w === 2;
    var kopf = el('ellipse', { cx: r2(kx), cy: r2(y), rx: KOPF_RX, ry: KOPF_RY,
                               transform: 'rotate(-18 ' + r2(kx) + ' ' + r2(y) + ')',
                               fill: offen ? 'none' : farbe.fuell, stroke: farbe.rand, 'stroke-width': 0.085 }, g);
    if (offen) {
      el('ellipse', { cx: r2(kx), cy: r2(y), rx: KOPF_RX - 0.115, ry: KOPF_RY - 0.115,
                      transform: 'rotate(-18 ' + r2(kx) + ' ' + r2(y) + ')',
                      fill: 'none', stroke: farbe.fuell, 'stroke-width': 0.2 }, g);
    }
    var aufLinie = Math.abs(y - Math.round(y)) < 0.01;
    for (var p = 0; p < (n.p || 0); p++) {
      el('circle', { cx: r2(kx + KOPF_RX + 0.38 + p * 0.42), cy: r2(aufLinie ? y - 0.5 : y), r: 0.15, fill: linie }, g);
    }

    var halsHoch = n.s < 0;
    var info = { n: n, x: kx, y: y, halsHoch: halsHoch, kopf: kopf, zeile: zi, ref: ref };
    this.pos[ref] = { x: kx, y: y + y0, zeile: zi, oben: y + y0 - 0.6 };
    return info;
  };

  Bild.prototype._hals = function (g, info, spitze) {
    var n = info.n;
    if (n.w === 1) { return; }
    var hoch = info.halsHoch;
    var hx = hoch ? info.x + KOPF_RX - 0.06 : info.x - KOPF_RX + 0.06;
    var ende = spitze !== undefined ? spitze : info.y + (hoch ? -HALS : HALS);
    el('line', { x1: r2(hx), y1: r2(info.y), x2: r2(hx), y2: r2(ende),
                 stroke: 'var(--linie)', 'stroke-width': 0.12 }, g);
    if (spitze === undefined && n.w >= 8) {
      var faehnchen = n.w >= 16 ? 2 : 1;
      for (var f = 0; f < faehnchen; f++) {
        var fy = ende + (hoch ? f * 0.75 : -f * 0.75);
        var r = hoch ? 1 : -1;
        el('path', { d: 'M' + r2(hx) + ',' + r2(fy) +
                        ' C' + r2(hx + 0.15) + ',' + r2(fy + r * 0.9) + ' ' + r2(hx + 1.0) + ',' + r2(fy + r * 1.1) +
                        ' ' + r2(hx + 0.62) + ',' + r2(fy + r * 2.1),
                     fill: 'none', stroke: 'var(--linie)', 'stroke-width': 0.17, 'stroke-linecap': 'round' }, g);
      }
    }
    info.halsEnde = ende;
    this._artikulation(g, info);
    this.pos[info.ref].oben = Math.min(this.pos[info.ref].oben,
      (hoch ? Math.min(ende, info.y - 0.6) : info.y - 0.6) + (this.pos[info.ref].y - info.y));
  };

  Bild.prototype._balken = function (g, gruppe) {
    var selbst = this;
    // Halsrichtung der ganzen Gruppe: nach dem Mittel der Notenstufen.
    var summe = 0;
    gruppe.forEach(function (i) { summe += i.n.s; });
    var hoch = summe < 0;
    gruppe.forEach(function (i) { i.halsHoch = hoch; });
    var a = gruppe[0], b = gruppe[gruppe.length - 1];
    var xa = hoch ? a.x + KOPF_RX - 0.06 : a.x - KOPF_RX + 0.06;
    var xb = hoch ? b.x + KOPF_RX - 0.06 : b.x - KOPF_RX + 0.06;
    var ya = a.y + (hoch ? -HALS : HALS), yb = b.y + (hoch ? -HALS : HALS);
    var neigung = Math.max(-0.6, Math.min(0.6, yb - ya));
    var mitte = (ya + yb) / 2;
    ya = mitte - neigung / 2; yb = mitte + neigung / 2;
    // Kein Hals darf kuerzer als 2.5 werden.
    var schieben = 0;
    gruppe.forEach(function (i) {
      var hx = hoch ? i.x + KOPF_RX - 0.06 : i.x - KOPF_RX + 0.06;
      var by = ya + (yb - ya) * ((hx - xa) / Math.max(0.001, xb - xa));
      var laenge = hoch ? i.y - by : by - i.y;
      if (laenge < 2.5) { schieben = Math.max(schieben, 2.5 - laenge); }
    });
    ya += hoch ? -schieben : schieben; yb += hoch ? -schieben : schieben;
    function balkenY(hx) { return ya + (yb - ya) * ((hx - xa) / Math.max(0.001, xb - xa)); }

    gruppe.forEach(function (i) {
      var hx = hoch ? i.x + KOPF_RX - 0.06 : i.x - KOPF_RX + 0.06;
      selbst._hals(g, i, balkenY(hx));
    });
    var d = hoch ? BALKEN_DICKE : -BALKEN_DICKE;
    function balken(x1, x2, versatz) {
      var y1 = balkenY(x1) + versatz, y2 = balkenY(x2) + versatz;
      el('path', { d: 'M' + r2(x1) + ',' + r2(y1) + ' L' + r2(x2) + ',' + r2(y2) +
                      ' L' + r2(x2) + ',' + r2(y2 + d) + ' L' + r2(x1) + ',' + r2(y1 + d) + ' Z',
                   fill: 'var(--linie)' }, g);
    }
    balken(xa - 0.06, xb + 0.06, 0);

    // Zweiter Balken (Sechzehntel) und Faehnchen-Stuecke.
    var v2 = hoch ? BALKEN_ABSTAND : -BALKEN_ABSTAND;
    var laufStart = null;
    gruppe.forEach(function (i, k) {
      var hx = hoch ? i.x + KOPF_RX - 0.06 : i.x - KOPF_RX + 0.06;
      var art = (i.n.b || '')[1];
      if (art === 'b') { laufStart = hx; }
      else if (art === 'e' && laufStart !== null) { balken(laufStart - 0.06, hx + 0.06, v2); laufStart = null; }
      else if (art === 'f') { balken(hx, hx + 1.0, v2); }
      else if (art === 'h') { balken(hx - 1.0, hx, v2); }
      void k;
    });

    // Triole ueber (oder unter) dem Balken.
    if (a.n.tr) {
      var tx = (xa + xb) / 2;
      var ty = (hoch ? Math.min(balkenY(tx), a.y - 1, b.y - 1) - 0.9 : Math.max(balkenY(tx), a.y + 1, b.y + 1) + 1.4);
      el('text', { x: r2(tx), y: r2(ty), 'text-anchor': 'middle', 'font-size': 1.25, 'font-style': 'italic',
                   'font-family': 'Georgia, "Times New Roman", serif', fill: 'var(--linie)' }, g).textContent = a.n.tr;
    }
  };

  Bild.prototype._artikulation = function (g, info) {
    var ar = info.n.ar;
    if (!ar) { return; }
    var seite = info.halsHoch ? 1 : -1;            // gegenueber dem Hals
    var y = info.y + seite * 1.05;
    if (Math.abs(y - Math.round(y)) < 0.01 && Math.abs(y) <= 2) { y += seite * 0.4; }
    var linie = 'var(--linie)';
    if (ar.indexOf('s') >= 0) { el('circle', { cx: r2(info.x), cy: r2(y), r: 0.15, fill: linie }, g); y += seite * 0.55; }
    if (ar.indexOf('t') >= 0) {
      el('line', { x1: r2(info.x - 0.5), y1: r2(y), x2: r2(info.x + 0.5), y2: r2(y), stroke: linie, 'stroke-width': 0.13 }, g);
      y += seite * 0.55;
    }
    if (ar.indexOf('>') >= 0) {
      el('path', { d: 'M' + r2(info.x - 0.5) + ',' + r2(y - 0.28) + ' L' + r2(info.x + 0.5) + ',' + r2(y) +
                      ' L' + r2(info.x - 0.5) + ',' + r2(y + 0.28),
                   fill: 'none', stroke: linie, 'stroke-width': 0.12 }, g);
    }
  };

  /* Das Atemzeichen: ein kleiner Haken ueber dem System, am Ende der
   * Note — wie im Buch. Schmal und schwarz, damit es nicht mit dem
   * gruenen Haekchen fuer eine gelungene Note verwechselt wird. */
  Bild.prototype._atem = function (g, x, info) {
    // So gross wie im Buch: gut ein Zwischenraum hoch, duenn gezogen.
    var y = Math.min(-2.9, info.y - 1.5);
    el('path', { d: 'M' + r2(x - 0.42) + ',' + r2(y - 0.12) + ' L' + r2(x - 0.12) + ',' + r2(y + 0.4) +
                    ' L' + r2(x + 0.46) + ',' + r2(y - 0.78),
                 fill: 'none', stroke: 'var(--linie)', 'stroke-width': 0.11,
                 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  };

  /* Halte- und Bindebogen innerhalb der Zeile. Reicht ein Bogen ueber
   * das Zeilenende, wird er dort offen weitergefuehrt. */
  Bild.prototype._boegen = function (g, noten, zi) {
    var selbst = this;
    var ende = this.breiteZ - 0.3;
    noten.forEach(function (info, k) {
      var bg = info.n.bg || '';
      if (bg.indexOf('a') >= 0) {
        var ziel = noten[k + 1];
        selbst._bogen(g, info, ziel && ziel.n.t === info.n.t ? ziel : null, ende, true);
      }
      if ((info.n.bg || '').indexOf('z') >= 0 && k === 0) {
        selbst._bogenAnfang(g, info, true);
      }
      var bo = info.n.bo || '';
      if (bo.indexOf('a') >= 0) {
        var j = k + 1;
        while (j < noten.length && (noten[j].n.bo || '').indexOf('z') < 0) { j++; }
        selbst._bogen(g, info, j < noten.length ? noten[j] : null, ende, false, noten.slice(k, j + 1));
      }
      if (bo.indexOf('z') >= 0 && bo.indexOf('a') < 0) {
        var offen = true;
        for (var m = 0; m < k; m++) { if ((noten[m].n.bo || '').indexOf('a') >= 0) { offen = false; } }
        if (offen) { selbst._bogenAnfang(g, info, false); }
      }
    });
    void zi;
  };

  Bild.prototype._bogen = function (g, a, b, ende, halte, spanne) {
    var unten = a.halsHoch;
    var spitze;
    if (!halte && spanne) {
      /* Bindebogen: auf der Kopfseite, wenn die meisten Haelse von ihm
       * wegzeigen. Er muss ueber (oder unter) allem liegen, was er
       * ueberspannt — auch ueber Haelsen und Balken dazwischen. */
      var hoch = 0;
      spanne.forEach(function (i) { if (i.halsHoch) { hoch++; } });
      // Unter die Koepfe nur, wenn alle Haelse nach oben zeigen; sonst darueber.
      unten = hoch === spanne.length;
      spitze = unten ? -Infinity : Infinity;
      spanne.forEach(function (i) {
        var ende2 = i.halsEnde !== undefined ? i.halsEnde : i.y + (i.halsHoch ? -HALS : HALS);
        if (unten) { spitze = Math.max(spitze, i.halsHoch ? i.y + 0.8 : ende2 + 0.4); }
        else { spitze = Math.min(spitze, i.halsHoch ? ende2 - 0.4 : i.y - 0.8); }
      });
    }
    var x1 = a.x + (halte ? KOPF_RX * 0.6 : 0);
    var x2 = b ? b.x - (halte ? KOPF_RX * 0.6 : 0) : ende;
    var y1 = a.y + (unten ? 0.75 : -0.75);
    var y2 = b ? b.y + (unten ? 0.75 : -0.75) : y1;
    this._bogenPfad(g, x1, y1, x2, y2, unten, spitze);
  };

  Bild.prototype._bogenAnfang = function (g, b, halte) {
    var unten = b.halsHoch;
    var x2 = b.x - (halte ? KOPF_RX * 0.6 : 0);
    var y = b.y + (unten ? 0.75 : -0.75);
    this._bogenPfad(g, Math.max(3.2, x2 - 3), y, x2, y, unten);
  };

  /* Ein Bogen als gefuellte Sichel — in der Mitte dicker als an den
   * Enden, wie im Notensatz. `spitze` ist die Hoehe, die er mindestens
   * erreichen muss. */
  Bild.prototype._bogenPfad = function (g, x1, y1, x2, y2, unten, spitze) {
    var s = unten ? 1 : -1;
    var L = Math.max(0.5, x2 - x1);
    var h = s * Math.min(1.3, 0.4 + L * 0.08);
    if (spitze !== undefined && isFinite(spitze)) {
      // Die Kontrollpunkte liegen ein Drittel hoeher als die Kurve.
      var noetig = (spitze - (y1 + y2) / 2) * 4 / 3;
      if (s * noetig > s * h) { h = noetig; }
    }
    var c1x = x1 + L * 0.28, c2x = x2 - L * 0.28;
    var d = 'M' + r2(x1) + ',' + r2(y1) +
            ' C' + r2(c1x) + ',' + r2(y1 + h) + ' ' + r2(c2x) + ',' + r2(y2 + h) + ' ' + r2(x2) + ',' + r2(y2) +
            ' C' + r2(c2x) + ',' + r2(y2 + h - s * 0.28) + ' ' + r2(c1x) + ',' + r2(y1 + h - s * 0.28) + ' ' + r2(x1) + ',' + r2(y1) + ' Z';
    el('path', { d: d, fill: 'var(--linie)' }, g);
  };

  /* ---------------------------------------------------------------- */
  /* Was sich nach dem Bauen noch aendert                              */
  /* ---------------------------------------------------------------- */

  /** Rueckt so, dass Zeile zi oben steht. Am Ende des Stuecks bleibt
   *  die letzte volle Ansicht stehen, statt ins Leere zu ruecken.
   *  `dauer` (Sekunden): so lange gleitet das Bild; ohne Angabe springt es. */
  Bild.prototype.zeigeZeile = function (zi, sofort, dauer) {
    var erste = this.zeigen[0];
    var letzteOben = Math.max(erste, this.zeigen[1] - this.sichtbar + 1);
    var oben = Math.max(erste, Math.min(letzteOben, zi));
    if (oben === this.oben && !sofort) { return; }
    this.oben = oben;
    var dy = -oben * (this.zeilenHoehe + ZEILEN_LUFT);
    this.inhalt.style.transition = (sofort || !dauer) ? 'none'
      : 'transform ' + r2(dauer) + 's ease-in-out';
    this.inhalt.setAttribute('transform', 'translate(0,' + r2(dy) + ')');
    this.inhalt.style.transform = 'translate(0px,' + r2(dy) + 'px)';
  };

  /** Welche gezeigte Zeile steht an dieser Bildschirmhoehe (clientY)?
   *  Getippt wird oft knapp daneben — es zaehlt die naechstgelegene. */
  Bild.prototype.zeileBei = function (clientY) {
    var r = this.svg.getBoundingClientRect();
    if (!r.height) { return null; }
    var y = (clientY - r.top) / r.height * this.hoeheZ + this.oben * (this.zeilenHoehe + ZEILEN_LUFT);
    var zi = Math.floor((y - this.randOben + ZEILEN_LUFT / 2) / (this.zeilenHoehe + ZEILEN_LUFT));
    return Math.max(this.zeigen[0], Math.min(this.zeigen[1], zi));
  };

  Bild.prototype.zeileVon = function (ref) {
    var p = this.pos[ref];
    return p ? p.zeile : null;
  };

  Bild.prototype.marker = function (ref) {
    var p = ref && this.pos[ref];
    if (!p) { this.ring.setAttribute('visibility', 'hidden'); return; }
    this.ring.setAttribute('cx', r2(p.x));
    this.ring.setAttribute('cy', r2(p.y));
    this.ring.setAttribute('visibility', 'visible');
  };

  /** Genau diese Noten tragen ein Haekchen. */
  Bild.prototype.haken = function (refs) {
    var soll = {};
    (refs || []).forEach(function (r) { soll[r] = true; });
    var ref;
    for (ref in this.hakenEl) {
      if (!soll[ref]) { this.ebeneHaken.removeChild(this.hakenEl[ref]); delete this.hakenEl[ref]; }
    }
    for (ref in soll) {
      if (this.hakenEl[ref] || !this.pos[ref]) { continue; }
      var p = this.pos[ref];
      // Ueber der Note und ueber der obersten Linie — was hoeher liegt.
      var y = Math.min(p.oben - 0.75, this.z[p.zeile].y0 - 2.5);
      this.hakenEl[ref] = el('path', {
        d: 'M' + r2(p.x - 0.3) + ',' + r2(y + 0.02) + ' L' + r2(p.x - 0.08) + ',' + r2(y + 0.25) +
           ' L' + r2(p.x + 0.32) + ',' + r2(y - 0.26),
        fill: 'none', stroke: 'var(--haken)', 'stroke-width': 0.16,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'class': 'haken'
      }, this.ebeneHaken);
    }
  };

  root.Satz = {
    zeichne: function (svg, o) { return new Bild(svg, o); }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
