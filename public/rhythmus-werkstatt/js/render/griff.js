/* griff.js — Griffbild einer B-Trompete.
 *
 * Gezeichnet werden hier nur die drei VENTILE. Die Trompete selbst
 * liegt als Hintergrundbild hinter dem SVG (siehe `.trompetenbild` in
 * css/stil.css) — beide benutzen dasselbe Seitenverhaeltnis 1774:887
 * und werden mittig eingepasst, dadurch sitzen die Ventile genau auf
 * ihren Buechsen.
 *
 * Warum der Umweg ueber CSS und nicht ein <image> im SVG: eine externe
 * Bildreferenz INNERHALB eines SVG ist die einzige Art von Verweis, die
 * je nach Umgebung anders behandelt wird — beim Oeffnen ueber file://,
 * in aelteren WebKit-Fassungen, beim Ausdrucken. Ein CSS-Hintergrund
 * wird ueberall gleich geladen, so wie jedes andere Bild der App auch.
 *
 * Ein gedruecktes Ventil tut drei Dinge auf einmal: es FAEHRT sichtbar
 * herunter, es steht danach tiefer, und es ist in der Farbe des Tons
 * gefuellt. Ein offenes bleibt oben und leer. Dieselbe Regel wie beim
 * geschlossenen Griffloch der Blockfloete — nur dass hier drei Knoepfe
 * statt acht Loecher zu lesen sind, und dass sie sich bewegen.
 *
 * Damit die Bewegung ueberhaupt zu sehen ist, wird beim zweiten und
 * jedem weiteren Aufruf NICHT neu gezeichnet: die drei Ventile bleiben
 * stehen und bekommen nur eine andere Stellung. Ein neu aufgebautes SVG
 * haette keinen Zustand, von dem aus es sich bewegen koennte — es waere
 * einfach sofort da, so wie vorher.
 *
 * Bewegt wird die ganze Ventilgruppe mit einem CSS-transform, nicht
 * durch Verschieben der Rechtecke: transform ist die eine Eigenschaft,
 * die jeder Browser fluessig und ohne Neuberechnung des Layouts
 * animiert. Was dabei unten aus der Buechse herausragen wuerde, schneidet
 * ein clipPath weg — deshalb darf der Schaft ruhig zu lang gezeichnet
 * sein und muss beim Druecken nicht kuerzer werden.
 *
 * Links steht das erste Ventil, also der Zeigefinger, dann Mittel-,
 * dann Ringfinger. Das Mundstueck zeigt nach links, der Becher nach
 * rechts — dieselbe Ansicht, die das Kind von seinem eigenen
 * Instrument hat, wenn es daran hinuntersieht.
 *
 * Anders als bei der Blockfloete gehoert zu einem Griff nicht genau ein
 * Ton: c1, g1 und c2 werden alle drei offen gegriffen und nur durch die
 * Lippenspannung unterschieden. Das Griffbild allein genuegt also nicht
 * — es steht immer neben dem Notenkopf, und der sagt, wie hoch.
 *
 * Zeichnung und Ventilkoordinaten stammen aus dem Paket
 * "Trompetenventile — Webapp-Integration"; das Bezugssystem 1774 x 887
 * ist von dort uebernommen, damit Bild und Ventile zusammenpassen.
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
   * lesen sein, wenn die Trompete nur ein schmales Band bekommt. */
  var KNOPF_B = 116, KNOPF_H = 50, KNOPF_R = 22;
  var KNOPF_Y = 158;                 // Oberkante, Ventil offen
  var SCHAFT_B = 26;
  var SCHAFT_Y = 202;                // knapp unter der Knopfkante
  var SCHAFT_BIS = 340;              // absichtlich zu lang — wird beschnitten
  var WEG = 96;                      // so weit faehrt das Ventil herunter

  /* Unterkante des Sichtfelds: die Unterkante des gedrueckten Knopfes,
   * plus die halbe Strichbreite — sonst schneidet der Rand die untere
   * Rundung des Knopfes ab und er sitzt flach auf der Buechse statt
   * darin. Was tiefer liegt, ist im Instrument und wird weggeschnitten;
   * der Schaftstummel, der dabei uebrig bleibt, ist vier Einheiten
   * lang und liegt hinter dem Knopf. */
  var SICHT_BIS = KNOPF_Y + WEG + KNOPF_H + 5;

  /* Jedes SVG braucht seinen eigenen clipPath — es koennen mehrere auf
   * der Seite stehen (das Griffbild und die beiden Modus-Knoepfe). */
  var zaehler = 0;

  /* Schwarzes Griffbild — dieselbe Einstellung wie beim Notensatz.
   * Ein gedruecktes Ventil wird dann schwarz statt bunt, ein offenes
   * bleibt weiss. Genau so steht es in jeder gedruckten Grifftabelle. */
  var EINFARBIG = false;

  /** Baut die drei Ventile EINMAL auf und merkt sie sich am SVG. */
  function aufbauen(svg) {
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var id = 'ventilsicht-' + (++zaehler);
    var defs = el('defs', {});
    var clip = el('clipPath', { id: id });
    clip.appendChild(el('rect', { x: 0, y: 0, width: W, height: SICHT_BIS }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    var aussen = el('g', { 'clip-path': 'url(#' + id + ')' });
    svg.appendChild(aussen);

    var teile = [];
    for (var i = 0; i < 3; i++) {
      var mx = VENTIL_X[i];
      var g = el('g', { 'class': 'ventil' });

      var schaft = el('rect', {
        x: mx - SCHAFT_B / 2, y: SCHAFT_Y,
        width: SCHAFT_B, height: SCHAFT_BIS - SCHAFT_Y, rx: 8,
        fill: 'var(--ventil-schaft)', 'stroke-width': 5
      });
      var knopf = el('rect', {
        'class': 'ventil-knopf',
        x: mx - KNOPF_B / 2, y: KNOPF_Y,
        width: KNOPF_B, height: KNOPF_H, rx: KNOPF_R
      });
      g.appendChild(schaft);
      g.appendChild(knopf);
      aussen.appendChild(g);
      teile.push({ gruppe: g, schaft: schaft, knopf: knopf });
    }
    svg.__ventile = teile;
    return teile;
  }

  /** Zeichnet die drei Ventile in ein SVG.
   *
   *  ton  ein Ton aus toene.json — oder, fuer ein Bild ohne bestimmten
   *       Ton (etwa die Modus-Knoepfe in der Leiste), `Griff.offen`.
   */
  function zeichne(svg, ton, opt) {
    opt = opt || {};
    var ventile = (ton && ton.griff && ton.griff.ventile) || [0, 0, 0];
    var teile = svg.__ventile;
    /* Nur beim ersten Mal aufbauen. Danach bleiben die Ventile stehen
     * und aendern bloss ihre Stellung — sonst gaebe es nichts, was sich
     * bewegen koennte. */
    if (!teile || teile.length !== 3 || !svg.firstChild) { teile = aufbauen(svg); }

    var farbe = EINFARBIG ? 'var(--linie)' : (ton && ton.farbe) || 'var(--linie)';
    var rand = EINFARBIG ? 'var(--linie)' : (ton && ton.farbeRand) || 'var(--linie)';
    var linie = 'var(--griff-linie)';

    for (var i = 0; i < 3; i++) {
      var gedrueckt = ventile[i] === 1;
      var t = teile[i];
      t.gruppe.setAttribute('class', 'ventil' + (gedrueckt ? ' gedrueckt' : ''));
      t.schaft.setAttribute('stroke', linie);
      t.knopf.setAttribute('fill', gedrueckt ? farbe : 'var(--loch-offen)');
      t.knopf.setAttribute('stroke', gedrueckt ? rand : linie);
      t.knopf.setAttribute('stroke-width', gedrueckt ? 6 : 5);
    }
    return svg;
  }

  /** Ein Ton ohne Ton: alle Ventile offen. Fuer die Modus-Knoepfe in
   *  der Leiste, die keine Griffe zeigen, sondern nur sagen, um welches
   *  Instrument es geht. */
  var OFFEN = { griff: { ventile: [0, 0, 0] } };

  root.Griff = {
    zeichne: zeichne, breite: W, hoehe: H, offen: OFFEN, weg: WEG,
    einfarbig: function (an) { EINFARBIG = !!an; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
