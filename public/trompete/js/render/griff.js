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
  var BILD = '/trompete/img/trompete-flach.png';

  /* Die flache Zeichnung ist 640 x 264 gross. Sie wird auf 250
   * Einheiten Breite gelegt; alle Ventilmasse ergeben sich aus dem
   * Bild, damit Knoepfe und Zeichnung zusammenbleiben. */
  var BILD_X = 26, BILD_Y = 26, BILD_W = 250, BILD_H = 250 * 264 / 640;
  var S_ = BILD_W / 640;                 // Bild-Pixel -> SVG-Einheiten
  function bx_(x) { return BILD_X + x * S_; }
  function by_(y) { return BILD_Y + y * S_; }
  var SKALA = 0.85;                      // Massstab der gezeichneten Knoepfe
  var VENTIL_X = [bx_(234), bx_(275.5), bx_(317)];
  var CASING_OBEN = by_(90);     // Oberkante der Ventilzuege im Bild
  var VENTIL_OBEN = by_(38);     // Knopf nicht gedrueckt
  var VENTIL_UNTEN = by_(62);    // Knopf gedrueckt: sichtbar tiefer
  var VENTIL_R = 6.5;




  /* Welches Instrument gezeichnet wird. Das Horn in F hat dieselben
   * Noten, aber andere Griffe (und Drehventile statt Pumpventile). */
  var instrument = 'trompete';
  function setzeInstrument(art) { instrument = (art === 'horn') ? 'horn' : 'trompete'; }

  /* ---- Naturton-Leiter -------------------------------------------- */
  /* Zeigt, der wievielte Ton auf diesem Griff gemeint ist. Ohne das
   * waere das Bild fuer c1, g1 und c2 voellig identisch.
   * Hoehere Stufe heisst festere Lippen. */
  function leiter(g, naturton, von, bis, farbe, rand, linie) {
    if (!naturton) { return; }
    var stufen = bis - von + 1;
    var dx = stufen > 4 ? 15 : 20;
    var breite = stufen > 4 ? 11 : 14;
    var bx = 300, by = 108;
    for (var n = 0; n < stufen; n++) {
      var dran = (n + von) === naturton;
      var hoehe = 12 + n * (stufen > 4 ? 10 : 14);
      g.appendChild(el('rect', {
        x: bx + n * dx, y: by - hoehe, width: breite, height: hoehe, rx: 3,
        fill: dran ? farbe : 'var(--loch-offen)',
        stroke: dran ? rand : linie, 'stroke-width': 3
      }));
    }
    g.appendChild(el('line', {
      x1: bx - 10, y1: by + 6, x2: bx + stufen * dx + 8, y2: by + 6,
      stroke: linie, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5
    }));
  }

  function zeichne(svg, ton, opt) {
    opt = opt || {};
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var farbe = ton.farbe, rand = ton.farbeRand;
    var linie = 'var(--griff-linie)';
    var g = el('g', {});
    svg.appendChild(g);

    if (instrument === 'horn') {
      var gh = ton.griffHorn || ton.griff;
      /* Das Horn wird gezeichnet, nicht fotografiert — deshalb wird es
       * hier auf die Groesse der Trompetenzeichnung heruntergerechnet,
       * damit es das Bild nicht erschlaegt. */
      var gHorn = el('g', { transform: 'translate(26 28) scale(0.6)' });
      g.appendChild(gHorn);
      zeichneHorn(gHorn, gh.ventile || [0, 0, 0], farbe, rand, linie);
      leiter(g, gh.naturton || ton.naturton, 4, 9, farbe, rand, linie);
      return svg;
    }


    /* ---- Die Trompete als fertige Zeichnung --------------------- */
    var bild = el('image', {
      x: BILD_X, y: BILD_Y, width: BILD_W, height: BILD_H,
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

    leiter(g, ton.naturton, 2, 5, farbe, rand, linie);
    return svg;
  }

  /* ---- Horn in F -------------------------------------------------- */
  /* Gezeichnet statt fotografiert: das runde Rohr, der grosse Becher
   * rechts und die drei Drehventil-Hebel, die mit der LINKEN Hand
   * gedrueckt werden. Gedrueckte Hebel kippen sichtbar nach unten und
   * bekommen die Farbe des Tons — genau wie bei der Trompete. */
  function zeichneHorn(g, ventile, farbe, rand, linie) {
    var messing = 'var(--messing)';
    var cx = 118, cy = 80;

    // Becher: breiter Trichter nach rechts
    g.appendChild(el('path', {
      d: 'M 168 62 C 196 60 214 52 226 40 L 232 118 C 216 108 194 100 168 98 Z',
      fill: messing, stroke: linie, 'stroke-width': 3
    }));
    // Rundes Rohr (zwei Windungen)
    g.appendChild(el('circle', {
      cx: cx, cy: cy, r: 42, fill: 'none', stroke: messing, 'stroke-width': 11
    }));
    g.appendChild(el('circle', {
      cx: cx, cy: cy, r: 42, fill: 'none', stroke: linie, 'stroke-width': 1.2, opacity: 0.5
    }));
    g.appendChild(el('circle', {
      cx: cx + 3, cy: cy + 2, r: 27, fill: 'none', stroke: messing, 'stroke-width': 8
    }));
    g.appendChild(el('circle', {
      cx: cx + 3, cy: cy + 2, r: 27, fill: 'none', stroke: linie, 'stroke-width': 1.2, opacity: 0.4
    }));
    // Mundrohr mit Mundstueck links oben
    g.appendChild(el('path', {
      d: 'M ' + (cx - 36) + ' ' + (cy - 22) + ' C 62 40 52 32 40 30',
      fill: 'none', stroke: messing, 'stroke-width': 8, 'stroke-linecap': 'round'
    }));
    g.appendChild(el('ellipse', {
      cx: 36, cy: 29, rx: 7, ry: 5.5,
      fill: messing, stroke: linie, 'stroke-width': 2
    }));

    // Drei Drehventil-Hebel
    var HX = [86, 112, 138];
    for (var i = 0; i < 3; i++) {
      var gedrueckt = ventile[i] === 1;
      var y = gedrueckt ? 130 : 122;
      // Drehventilgehaeuse
      g.appendChild(el('circle', {
        cx: HX[i], cy: 104, r: 8,
        fill: messing, stroke: linie, 'stroke-width': 2
      }));
      // Hebelarm
      g.appendChild(el('line', {
        x1: HX[i], y1: 104, x2: HX[i], y2: y,
        stroke: messing, 'stroke-width': 4, 'stroke-linecap': 'round'
      }));
      // Fingerplatte
      g.appendChild(el('rect', {
        x: HX[i] - 10, y: y, width: 20, height: 9, rx: 4.5,
        fill: gedrueckt ? farbe : 'var(--loch-offen)',
        stroke: gedrueckt ? rand : linie, 'stroke-width': 2.5
      }));
    }
  }

  root.Griff = { zeichne: zeichne, setzeInstrument: setzeInstrument, breite: W, hoehe: H };
})(typeof globalThis !== 'undefined' ? globalThis : this);

