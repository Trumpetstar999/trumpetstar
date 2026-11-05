/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/render/griff.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* griff.js — Griffbild einer B-Trompete.
 *
 * Drei Ventile als nummerierte Kreise, so wie sie in jeder
 * Grifftabelle stehen: ein gedruecktes Ventil ist gefuellt, ein offenes
 * leer. Links steht das erste Ventil (Zeigefinger), dann Mittel-, dann
 * Ringfinger — dieselbe Reihenfolge, die man vor sich hat, wenn man am
 * eigenen Instrument hinuntersieht.
 *
 * Die Kinderfassung zeigte hier eine gezeichnete Trompete mit
 * fahrenden Ventilen. Fuer Erwachsene ist das Schema das bessere Bild:
 * es ist dasselbe, das im Lehrbuch und ueber den Noten steht, und es
 * laesst sich auf einen Blick lesen, auch klein neben der Notenzeile.
 *
 * Damit der Wechsel zu sehen ist, wird beim zweiten und jedem weiteren
 * Aufruf NICHT neu gezeichnet: die drei Ventile bleiben stehen und
 * bekommen nur einen anderen Zustand. Ein neu aufgebautes SVG haette
 * keinen Zustand, von dem aus sich etwas aendern koennte.
 *
 * Zu einem Griff gehoert auf der Trompete nicht genau ein Ton: c1, g1,
 * c2, e2 und g2 werden alle offen gegriffen und nur durch die
 * Lippenspannung unterschieden. Das Griffbild allein genuegt also nie
 * — es steht immer neben der Note, und die sagt, wie hoch.
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attr) {
    var e = document.createElementNS(NS, name);
    for (var k in attr) {
      if (attr[k] !== null && attr[k] !== undefined) { e.setAttribute(k, attr[k]); }
    }
    return e;
  }

  var W = 1774, H = 887;
  var VENTIL_X = [717, 828, 939];
  var zaehler = 0;

  /* Farbiges Griffbild — dieselbe Einstellung wie beim Notensatz. Ein
   * gedruecktes Ventil traegt dann die Farbe des Tons statt Schwarz. */
  var EINFARBIG = true;

  /** Baut die drei Ventile EINMAL auf und merkt sie sich am SVG. */
  function aufbauen(svg) {
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.classList.add('tp-trumpet');
    var id = 'tp-ventilsicht-' + (++zaehler);
    var defs = el('defs', {}), clip = el('clipPath', { id: id });
    clip.appendChild(el('rect', { x: 0, y: 0, width: W, height: 309 }));
    defs.appendChild(clip); svg.appendChild(defs);
    var aussen = el('g', { 'clip-path': 'url(#' + id + ')' });
    svg.appendChild(aussen);

    var teile = [];
    for (var i = 0; i < 3; i++) {
      var g = el('g', { 'class': 'ventil' });
      var schaft = el('rect', { x: VENTIL_X[i] - 13, y: 202, width: 26, height: 138,
        rx: 8, fill: 'var(--griff-linie)' });
      var knopf = el('circle', {
        'class': 'ventil-knopf', cx: VENTIL_X[i], cy: 183, r: 48, 'stroke-width': 5
      });
      var zahl = el('text', {
        'class': 'ventil-zahl', x: VENTIL_X[i], y: 197,
        'text-anchor': 'middle', 'font-size': 40, 'font-weight': 700
      });
      zahl.textContent = String(i + 1);
      g.appendChild(schaft);
      g.appendChild(knopf);
      g.appendChild(zahl);
      aussen.appendChild(g);
      teile.push({ gruppe: g, knopf: knopf, zahl: zahl });
    }
    svg.__ventile = teile;
    return teile;
  }

  /** Zeichnet die drei Ventile in ein SVG.
   *
   *  ton  ein Ton aus toene.json — oder `Griff.offen` fuer ein Bild
   *       ohne bestimmten Ton.
   */
  function zeichne(svg, ton) {
    var ventile = (ton && ton.griff && ton.griff.ventile) || [0, 0, 0];
    var teile = svg.__ventile;
    if (!teile || teile.length !== 3 || !svg.firstChild) { teile = aufbauen(svg); }

    var farbe = EINFARBIG ? 'var(--ventil-an)' : (ton && ton.farbe) || 'var(--ventil-an)';
    var rand = EINFARBIG ? 'var(--ventil-an)' : (ton && ton.farbeRand) || 'var(--ventil-an)';

    for (var i = 0; i < 3; i++) {
      var gedrueckt = ventile[i] === 1;
      var t = teile[i];
      t.gruppe.setAttribute('class', 'ventil' + (gedrueckt ? ' gedrueckt' : ''));
      t.knopf.setAttribute('fill', gedrueckt ? farbe : 'var(--loch-offen)');
      t.knopf.setAttribute('stroke', gedrueckt ? rand : 'var(--griff-linie)');
      /* Auf der Tonfarbe steht die Ziffer weiss; im einfarbigen Bild
       * nimmt sie die Farbe, die das Stylesheet zum gefuellten Ventil
       * vorsieht — im Dunkelmodus kann das eine andere sein. */
      t.zahl.setAttribute('fill', gedrueckt ? (EINFARBIG ? 'var(--ventil-zahl)' : '#fff')
                                            : 'var(--griff-linie)');
    }
    return svg;
  }

  /** Der Griff in Worten: "1 + 2", oder "0" fuer offen. */
  function inWorten(ton) {
    var ventile = (ton && ton.griff && ton.griff.ventile) || [0, 0, 0];
    var aus = [];
    for (var i = 0; i < 3; i++) { if (ventile[i] === 1) { aus.push(String(i + 1)); } }
    return aus.length ? aus.join(' + ') : '0';
  }

  /** Ein Ton ohne Ton: alle Ventile offen. */
  var OFFEN = { griff: { ventile: [0, 0, 0] } };

  root.Griff = {
    zeichne: zeichne, inWorten: inWorten, breite: W, hoehe: H, offen: OFFEN,
    einfarbig: function (an) { EINFARBIG = !!an; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
