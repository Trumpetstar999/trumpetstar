/* griff.js — Griffbild einer Trompete.
 *
 * Die Trompete selbst ist eine fertige Zeichnung (img/trompete-koerper.png):
 * Mundstueck links, Schallbecher rechts, drei Ventilzuege in der Mitte.
 * Darueber liegen nur noch die drei Ventilknoepfe als SVG — die muessen
 * sich bewegen und einfaerben koennen, also bleiben sie gezeichnet.
 *
 * Gedrueckte Ventile sind in der Farbe des Tons gefuellt und sichtbar
 * nach unten versetzt, nicht gedrueckte stehen oben und bleiben leer.
 * Das Versetzen ist wichtig: ein fuenfjaehriges Kind erkennt "gedrueckt"
 * an der Bewegung schneller als an der Farbe.
 *
 * Anders als bei der Blockfloete sagt der Griff allein noch nicht,
 * welcher Ton kommt — c1, g1 und c2 haben alle drei denselben Griff
 * (offen). Was sie trennt, ist die Lippenspannung. Deshalb steht daneben
 * eine kleine Leiter, die zeigt, der wievielte Naturton gemeint ist.
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var XLINK = 'http://www.w3.org/1999/xlink';

  function el(name, attr) {
    var e = document.createElementNS(NS, name);
    for (var k in attr) {
      if (attr[k] !== null && attr[k] !== undefined) { e.setAttribute(k, attr[k]); }
    }
    return e;
  }

  /* Breit statt hoch: das Griffbild liegt unter dem Notensystem ueber
   * die volle Bildschirmbreite. Links die Trompete, rechts die
   * Naturton-Leiter. */
  var W = 460, H = 150;
  var BILD = '/trompete/img/trompete-koerper.png';

  /* Die Zeichnung ist 1536 x 1024 gross und wird auf 300 Einheiten
   * Breite gelegt. Daraus ergeben sich die Ventilpositionen. */
  /* Massstab: die Trompete wird kleiner gezeichnet als frueher, damit
   * sie im unteren Bildbereich nicht erschlaegt. Alle Ventilmasse
   * haengen an SKALA, damit Bild und Knoepfe zusammenbleiben. */
  var SKALA = 0.50;
  var BILD_X = 40, BILD_Y = 34, BILD_W = 300 * SKALA, BILD_H = 200 * SKALA;
  function bx_(x) { return BILD_X + x * SKALA; }
  function by_(y) { return BILD_Y - 12 * SKALA + y * SKALA; }
  var VENTIL_X = [bx_(118.8), bx_(136.7), bx_(156.2)];
  var CASING_OBEN = by_(76);     // Oberkante der Ventilzuege im Bild
  var VENTIL_OBEN = by_(54);     // Knopf nicht gedrueckt
  var VENTIL_UNTEN = by_(68);    // Knopf gedrueckt: sichtbar tiefer
  var VENTIL_R = 9.5 * SKALA;



  function zeichne(svg, ton, opt) {
    opt = opt || {};
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var farbe = ton.farbe, rand = ton.farbeRand;
    var linie = 'var(--griff-linie)';
    var g = el('g', {});
    svg.appendChild(g);

    /* ---- Die Trompete als fertige Zeichnung --------------------- */
    var bild = el('image', {
      x: BILD_X, y: BILD_Y - 12 * SKALA, width: BILD_W, height: BILD_H,
      preserveAspectRatio: 'xMidYMid meet'
    });
    bild.setAttributeNS(XLINK, 'xlink:href', BILD);
    bild.setAttribute('href', BILD);
    g.appendChild(bild);

    /* ---- Die drei Ventilknoepfe --------------------------------- */
    /* Ein Knopf besteht aus vier Teilen: Schaft, Schattenring unter der
     * Kuppe, die Kuppe selbst und ein heller Glanzpunkt. Das gibt dem
     * flachen Kreis Tiefe, ohne dass ein Bild noetig waere. */
    
    var defs = el('defs', {});
    svg.appendChild(defs);
    var gradId = 'ventilglanz-' + Math.random().toString(36).slice(2, 8);
    var grad = el('linearGradient', { id: gradId, x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': '#000', 'stop-opacity': '0.18' }));
    grad.appendChild(el('stop', { offset: '30%', 'stop-color': '#fff', 'stop-opacity': '0.55' }));
    grad.appendChild(el('stop', { offset: '62%', 'stop-color': '#fff', 'stop-opacity': '0.05' }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': '0.22' }));
    defs.appendChild(grad);

    var ventile = ton.griff.ventile;
    for (var i = 0; i < 3; i++) {
      var gedrueckt = ventile[i] === 1;
      var oben = gedrueckt ? VENTIL_UNTEN : VENTIL_OBEN;   // Oberkante Perle
      var cx = VENTIL_X[i];
      var perleH = 7.5 * SKALA;      // Hoehe der Perle (kein Kreis!)
      var rx = VENTIL_R;
      var ry = 3.0 * SKALA;          // Perspektive der runden Deckflaeche

      // Schaft vom Knopf hinunter in den Ventilzug
      g.appendChild(el('rect', {
        x: cx - 3.0 * SKALA, y: oben + perleH - 1,
        width: 6.0 * SKALA,
        height: Math.max(0, CASING_OBEN - (oben + perleH) + 4 * SKALA),
        fill: 'var(--messing)', stroke: linie, 'stroke-width': 1.4
      }));
      // Fingerauflage-Ring (Kranz) direkt unter der Perle
      g.appendChild(el('rect', {
        x: cx - rx * 0.78, y: oben + perleH - 1.2 * SKALA,
        width: rx * 1.56, height: 2.6 * SKALA, rx: 1.2 * SKALA,
        fill: 'var(--messing)', stroke: linie, 'stroke-width': 1.4
      }));
      // Perle: kurzer Zylinder — Mantel + gewoelbte Deckflaeche
      g.appendChild(el('path', {
        d: 'M ' + (cx - rx) + ' ' + oben +
           ' L ' + (cx - rx) + ' ' + (oben + perleH) +
           ' A ' + rx + ' ' + ry + ' 0 0 0 ' + (cx + rx) + ' ' + (oben + perleH) +
           ' L ' + (cx + rx) + ' ' + oben + ' Z',
        fill: gedrueckt ? farbe : 'var(--loch-offen)',
        stroke: gedrueckt ? rand : linie, 'stroke-width': 2
      }));
      g.appendChild(el('ellipse', {
        cx: cx, cy: oben, rx: rx, ry: ry,
        fill: gedrueckt ? farbe : 'var(--loch-offen)',
        stroke: gedrueckt ? rand : linie, 'stroke-width': 2
      }));
      // Glanz auf dem Mantel
      g.appendChild(el('path', {
        d: 'M ' + (cx - rx + 1) + ' ' + oben +
           ' L ' + (cx - rx + 1) + ' ' + (oben + perleH - 1) +
           ' A ' + (rx - 1) + ' ' + (ry - 0.6) + ' 0 0 0 ' + (cx + rx - 1) + ' ' + (oben + perleH - 1) +
           ' L ' + (cx + rx - 1) + ' ' + oben + ' Z',
        fill: 'url(#' + gradId + ')'
      }));
    }


    /* ---- Naturton-Leiter ---------------------------------------- */
    /* Zeigt, der wievielte Ton auf diesem Griff gemeint ist. Ohne das
     * waere das Bild fuer c1, g1 und c2 voellig identisch.
     * Hoehere Stufe heisst festere Lippen. */
    if (ton.naturton) {
      var stufen = 4;                       // 2. bis 5. Naturton
      var bx = 300, by = 108, dx = 20;
      for (var n = 0; n < stufen; n++) {
        var dran = (n + 2) === ton.naturton;
        var hoehe = 14 + n * 14;
        g.appendChild(el('rect', {
          x: bx + n * dx, y: by - hoehe, width: 14, height: hoehe, rx: 3,
          fill: dran ? farbe : 'var(--loch-offen)',
          stroke: dran ? rand : linie, 'stroke-width': 3
        }));
      }
      g.appendChild(el('line', {
        x1: bx - 10, y1: by + 6, x2: bx + stufen * dx + 8, y2: by + 6,
        stroke: linie, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5
      }));
    }
    return svg;
  }

  root.Griff = { zeichne: zeichne, breite: W, hoehe: H };
})(typeof globalThis !== 'undefined' ? globalThis : this);
