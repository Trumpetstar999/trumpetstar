/* griff.js — Griffbild des gewaehlten Instruments.
 *
 * Drei Bilder, ein Bezugssystem (1774 x 887):
 *
 *   trompete    die gezeichnete Trompete liegt als CSS-Hintergrund
 *               hinter dem SVG (`.trompetenbild` in css/stil.css),
 *               gezeichnet werden nur die drei Perinet-Ventile.
 *   tenorhorn   dasselbe Ventilwerk, aber der Koerper wird hier
 *               gezeichnet: ein Tenorhorn liegt nicht flach wie eine
 *               Trompete, sein Becher zeigt nach oben.
 *   horn        drei Drehventil-HEBEL statt Perinet-Knoepfe, dazu das
 *               gewundene Rohr und der grosse Becher.
 *
 * Die GRIFFE sind bei allen drei Bildern dieselben — drei Ventile
 * senken die Naturtonreihe immer um dieselben Schritte. Nur das Bild
 * wechselt, damit das Kind sein eigenes Instrument wiedererkennt.
 *
 * Warum der Umweg ueber CSS und nicht ein <image> im SVG: eine externe
 * Bildreferenz INNERHALB eines SVG ist die einzige Art von Verweis, die
 * je nach Umgebung anders behandelt wird — beim Oeffnen ueber file://,
 * in aelteren WebKit-Fassungen, beim Ausdrucken. Ein CSS-Hintergrund
 * wird ueberall gleich geladen, so wie jedes andere Bild der App auch.
 *
 * Ein gedruecktes Ventil tut drei Dinge auf einmal: es FAEHRT sichtbar
 * herunter, es steht danach tiefer, und es ist in der Farbe des Tons
 * gefuellt. Ein offenes bleibt oben und leer.
 *
 * Damit die Bewegung ueberhaupt zu sehen ist, wird beim zweiten und
 * jedem weiteren Aufruf NICHT neu gezeichnet: die Ventile bleiben
 * stehen und bekommen nur eine andere Stellung. Bewegt wird die ganze
 * Ventilgruppe mit einem CSS-transform; was unten aus der Buechse
 * herausragen wuerde, schneidet ein clipPath weg.
 *
 * Links steht das erste Ventil, also der Zeigefinger, dann Mittel-,
 * dann Ringfinger — beim Horn der linken Hand, sonst der rechten.
 *
 * Anders als bei der Blockfloete gehoert zu einem Griff nicht genau ein
 * Ton: c1, g1 und c2 werden alle drei offen gegriffen und nur durch die
 * Lippenspannung unterschieden. Das Griffbild allein genuegt also nicht
 * — es steht immer neben dem Notenkopf, und der sagt, wie hoch.
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

  /* Bezugssystem der Zeichnung — dasselbe wie das der Bilddatei. */
  var W = 1774, H = 887;

  /* Mitten der drei Ventile, in ebendiesem Bezugssystem. */
  var VENTIL_X = [717, 828, 939];

  /* Der Knopf ist bewusst groesser gezeichnet als am echten Instrument:
   * er traegt die ganze Auskunft des Bildes und muss auch dann noch zu
   * lesen sein, wenn das Instrument nur ein schmales Band bekommt. */
  var KNOPF_B = 116, KNOPF_H = 50, KNOPF_R = 22;
  var KNOPF_Y = 158;                 // Oberkante, Ventil offen
  var SCHAFT_B = 26;
  var SCHAFT_Y = 202;                // knapp unter der Knopfkante
  var SCHAFT_BIS = 340;              // absichtlich zu lang — wird beschnitten
  var WEG = 96;                      // so weit faehrt das Ventil herunter

  /* Unterkante des Sichtfelds: die Unterkante des gedrueckten Knopfes,
   * plus die halbe Strichbreite — sonst schneidet der Rand die untere
   * Rundung des Knopfes ab. */
  var SICHT_BIS = KNOPF_Y + WEG + KNOPF_H + 5;

  /* Horn: die Hebel der drei Drehventile. Sie kippen nur ein kurzes
   * Stueck — ein Drehventil dreht sich, es faehrt nicht. */
  var HEBEL_Y = 250;                 // Drehventilgehaeuse
  var PLATTE_Y = 430;                // Fingerplatte, Hebel oben
  var HEBEL_WEG = 46;

  /* Jedes SVG braucht seinen eigenen clipPath — es koennen mehrere auf
   * der Seite stehen (das Griffbild und die beiden Modus-Knoepfe). */
  var zaehler = 0;

  /* Schwarzes Griffbild — dieselbe Einstellung wie beim Notensatz. */
  var EINFARBIG = false;

  /* Welches Bild gezeichnet wird: 'trompete', 'tenorhorn' oder 'horn'. */
  var ART = 'trompete';

  var MESSING = 'var(--messing, #D9A13B)';

  /* ------------------------------------------------------------------ */
  /* Instrumentenkoerper                                                 */
  /* ------------------------------------------------------------------ */

  /** Tenorhorn: Becher nach oben, Ventile oben auf dem Gehaeuseblock.
   *  Absichtlich schlicht gezeichnet — es soll erkennbar sein, nicht
   *  abgebildet. Die drei Buechsen liegen genau unter den Knoepfen. */
  function koerperTenorhorn(ziel, linie) {
    var g = el('g', {});
    // Becher: breiter Trichter nach oben rechts
    g.appendChild(el('path', {
      d: 'M 1090 780 C 1120 520 1210 360 1330 250 L 1700 470 '
       + 'C 1560 520 1420 620 1330 800 Z',
      fill: MESSING, stroke: linie, 'stroke-width': 10
    }));
    g.appendChild(el('ellipse', {
      cx: 1515, cy: 360, rx: 70, ry: 150, transform: 'rotate(28 1515 360)',
      fill: MESSING, stroke: linie, 'stroke-width': 10
    }));
    // Rohrbogen vom Ventilblock nach rechts in den Becher
    g.appendChild(el('path', {
      d: 'M 995 640 C 1030 760 1060 790 1110 790',
      fill: 'none', stroke: MESSING, 'stroke-width': 46, 'stroke-linecap': 'round'
    }));
    // Mundrohr mit Mundstueck links
    g.appendChild(el('path', {
      d: 'M 300 470 C 430 470 560 430 660 340',
      fill: 'none', stroke: MESSING, 'stroke-width': 34, 'stroke-linecap': 'round'
    }));
    g.appendChild(el('ellipse', {
      cx: 288, cy: 470, rx: 34, ry: 26, fill: MESSING, stroke: linie, 'stroke-width': 8
    }));
    // Die drei Ventilbuechsen
    for (var i = 0; i < 3; i++) {
      g.appendChild(el('rect', {
        x: VENTIL_X[i] - 54, y: 250, width: 108, height: 400, rx: 42,
        fill: MESSING, stroke: linie, 'stroke-width': 9
      }));
    }
    // Zug unter dem Block
    g.appendChild(el('path', {
      d: 'M 717 650 L 717 800 C 717 840 760 840 760 800 L 760 650',
      fill: 'none', stroke: MESSING, 'stroke-width': 26, 'stroke-linecap': 'round'
    }));
    ziel.appendChild(g);
  }

  /** Horn: das gewundene Rohr, der grosse Becher rechts und die drei
   *  Drehventilgehaeuse, auf denen die Hebel sitzen. */
  function koerperHorn(ziel, linie) {
    var g = el('g', {});
    var cx = 640, cy = 560;
    // Becher rechts
    g.appendChild(el('path', {
      d: 'M 1120 660 C 1180 520 1300 420 1430 380 L 1560 760 '
       + 'C 1430 770 1280 800 1180 850 Z',
      fill: MESSING, stroke: linie, 'stroke-width': 10
    }));
    g.appendChild(el('ellipse', {
      cx: 1500, cy: 570, rx: 66, ry: 200, transform: 'rotate(18 1500 570)',
      fill: MESSING, stroke: linie, 'stroke-width': 10
    }));
    // Zwei Windungen
    g.appendChild(el('circle', { cx: cx, cy: cy, r: 250, fill: 'none', stroke: MESSING, 'stroke-width': 40 }));
    g.appendChild(el('circle', { cx: cx, cy: cy, r: 250, fill: 'none', stroke: linie, 'stroke-width': 4, opacity: 0.45 }));
    g.appendChild(el('circle', { cx: cx + 22, cy: cy + 14, r: 168, fill: 'none', stroke: MESSING, 'stroke-width': 32 }));
    g.appendChild(el('circle', { cx: cx + 22, cy: cy + 14, r: 168, fill: 'none', stroke: linie, 'stroke-width': 4, opacity: 0.35 }));
    // Rohr von der Windung in den Becher
    g.appendChild(el('path', {
      d: 'M 880 640 C 980 700 1060 730 1140 760',
      fill: 'none', stroke: MESSING, 'stroke-width': 40, 'stroke-linecap': 'round'
    }));
    // Mundrohr mit Mundstueck links oben
    g.appendChild(el('path', {
      d: 'M 470 400 C 380 330 320 300 250 290',
      fill: 'none', stroke: MESSING, 'stroke-width': 28, 'stroke-linecap': 'round'
    }));
    g.appendChild(el('ellipse', {
      cx: 238, cy: 288, rx: 30, ry: 23, fill: MESSING, stroke: linie, 'stroke-width': 8
    }));
    // Drei Drehventilgehaeuse
    for (var i = 0; i < 3; i++) {
      g.appendChild(el('circle', {
        cx: VENTIL_X[i], cy: HEBEL_Y, r: 56,
        fill: MESSING, stroke: linie, 'stroke-width': 9
      }));
    }
    ziel.appendChild(g);
  }

  /* ------------------------------------------------------------------ */
  /* Ventile                                                             */
  /* ------------------------------------------------------------------ */

  /** Baut Koerper und Ventile EINMAL auf und merkt sie sich am SVG. */
  function aufbauen(svg) {
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var linie = 'var(--griff-linie)';
    var hebel = (ART === 'horn');

    if (ART === 'tenorhorn') { koerperTenorhorn(svg, linie); }
    else if (hebel) { koerperHorn(svg, linie); }

    var aussen;
    if (hebel) {
      // Hebel ragen nirgends heraus — kein Beschneiden notwendig.
      aussen = el('g', {});
    } else {
      var id = 'ventilsicht-' + (++zaehler);
      var defs = el('defs', {});
      var clip = el('clipPath', { id: id });
      clip.appendChild(el('rect', { x: 0, y: 0, width: W, height: SICHT_BIS }));
      defs.appendChild(clip);
      svg.appendChild(defs);
      aussen = el('g', { 'clip-path': 'url(#' + id + ')' });
    }
    svg.appendChild(aussen);

    var teile = [];
    for (var i = 0; i < 3; i++) {
      var mx = VENTIL_X[i];
      var g = el('g', { 'class': hebel ? 'ventil hebel' : 'ventil' });
      var schaft, knopf;

      if (hebel) {
        // Hebelarm vom Gehaeuse hinunter zur Fingerplatte
        schaft = el('rect', {
          x: mx - 9, y: HEBEL_Y, width: 18, height: PLATTE_Y - HEBEL_Y, rx: 9,
          fill: MESSING, 'stroke-width': 4
        });
        knopf = el('rect', {
          'class': 'ventil-knopf',
          x: mx - 48, y: PLATTE_Y, width: 96, height: 40, rx: 20
        });
      } else {
        schaft = el('rect', {
          x: mx - SCHAFT_B / 2, y: SCHAFT_Y,
          width: SCHAFT_B, height: SCHAFT_BIS - SCHAFT_Y, rx: 8,
          fill: 'var(--ventil-schaft)', 'stroke-width': 5
        });
        knopf = el('rect', {
          'class': 'ventil-knopf',
          x: mx - KNOPF_B / 2, y: KNOPF_Y,
          width: KNOPF_B, height: KNOPF_H, rx: KNOPF_R
        });
      }
      g.appendChild(schaft);
      g.appendChild(knopf);
      aussen.appendChild(g);
      teile.push({ gruppe: g, schaft: schaft, knopf: knopf });
    }
    svg.__ventile = teile;
    svg.__art = ART;
    return teile;
  }

  /** Zeichnet die drei Ventile in ein SVG.
   *
   *  ton  ein Ton aus toene.json — oder, fuer ein Bild ohne bestimmten
   *       Ton (etwa die Modus-Knoepfe in der Leiste), `Griff.offen`.
   */
  function zeichne(svg, ton) {
    var ventile = (ton && ton.griff && ton.griff.ventile) || [0, 0, 0];
    var teile = svg.__ventile;
    /* Nur beim ersten Mal aufbauen — und neu, wenn das Instrument
     * gewechselt hat. Danach bleiben die Ventile stehen und aendern
     * bloss ihre Stellung; sonst gaebe es nichts, was sich bewegen
     * koennte. */
    if (!teile || teile.length !== 3 || !svg.firstChild || svg.__art !== ART) {
      teile = aufbauen(svg);
    }

    var farbe = EINFARBIG ? 'var(--linie)' : (ton && ton.farbe) || 'var(--linie)';
    var rand = EINFARBIG ? 'var(--linie)' : (ton && ton.farbeRand) || 'var(--linie)';
    var linie = 'var(--griff-linie)';

    for (var i = 0; i < 3; i++) {
      var gedrueckt = ventile[i] === 1;
      var t = teile[i];
      t.gruppe.setAttribute('class',
        (ART === 'horn' ? 'ventil hebel' : 'ventil') + (gedrueckt ? ' gedrueckt' : ''));
      t.schaft.setAttribute('stroke', linie);
      t.knopf.setAttribute('fill', gedrueckt ? farbe : 'var(--loch-offen)');
      t.knopf.setAttribute('stroke', gedrueckt ? rand : linie);
      t.knopf.setAttribute('stroke-width', gedrueckt ? 6 : 5);
    }
    return svg;
  }

  /** Welches Instrument gezeichnet wird. Wird einmal beim Aufbauen der
   *  App gesetzt, aus der Wahl im Elternbereich. */
  function setzeArt(art) {
    ART = (art === 'horn' || art === 'tenorhorn') ? art : 'trompete';
    /* Nur die Trompete hat ein Hintergrundbild; bei den anderen zeichnet
     * dieses Modul den Koerper selbst. */
    [].slice.call(document.querySelectorAll('#griff, .modus-trompete')).forEach(function (svg) {
      if (ART === 'trompete') { svg.classList.add('trompetenbild'); }
      else { svg.classList.remove('trompetenbild'); }
    });
  }

  /** Ein Ton ohne Ton: alle Ventile offen. Fuer die Modus-Knoepfe in
   *  der Leiste, die keine Griffe zeigen, sondern nur sagen, um welches
   *  Instrument es geht. */
  var OFFEN = { griff: { ventile: [0, 0, 0] } };

  root.Griff = {
    zeichne: zeichne, breite: W, hoehe: H, offen: OFFEN, weg: WEG,
    setzeArt: setzeArt,
    art: function () { return ART; },
    einfarbig: function (an) { EINFARBIG = !!an; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
