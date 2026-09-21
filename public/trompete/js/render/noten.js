/* noten.js — Notensystem als SVG.
 *
 * Alle Masse rechnen in "Zwischenraum" (Z) als Einheit: ein Notenkopf
 * ist genau einen Zwischenraum hoch. Die fuenf Linien liegen bei
 * y = -2 -1 0 +1 +2, die mittlere Linie (y = 0) ist h1.
 *
 * Nur drei Linien werden je gebraucht: g1 sitzt auf y=+1, h1 auf 0,
 * d2 auf -1. a1 und c2 liegen in den Zwischenraeumen dazwischen. In
 * Level 1 wird deshalb auf diese drei Linien herangezoomt — die
 * aeusseren beiden laufen aus dem Bild, sind aber gezeichnet.
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attr) {
    var e = document.createElementNS(NS, name);
    for (var k in attr) { if (attr[k] !== null && attr[k] !== undefined) { e.setAttribute(k, attr[k]); } }
    return e;
  }

  /* Violinschluessel — ein einziger durchgehender Strich.
   *
   * Der Weg ist als Punktfolge in Notenlinien-Einheiten beschrieben und
   * wird zu einer weichen Kurve geglaettet. Der Mittelpunkt der
   * Einrollung sitzt dadurch garantiert exakt auf der g-Linie (y = +1) —
   * genau das macht den Schluessel ja aus.
   *
   * Reihenfolge des Strichs: unterer Haken → Hals nach oben → obere
   * Schnecke → grosser Bogen links herunter → um die g-Linie herum →
   * nach innen eingerollt.
   */
  var SCHLUESSEL_PUNKTE = [
    [-0.40, 2.94], [-0.06, 3.06], [0.26, 2.86],
    [0.40, 2.30], [0.42, 1.60], [0.36, 0.70],
    [0.22, -0.30], [0.06, -1.30], [-0.04, -2.20],
    [-0.05, -2.85], [0.10, -3.22], [0.36, -3.20],
    [0.52, -2.92], [0.50, -2.50], [0.32, -2.04],
    [0.02, -1.52], [-0.32, -0.94], [-0.66, -0.28],
    [-0.90, 0.42], [-0.96, 1.10], [-0.78, 1.68],
    [-0.42, 2.02], [0.06, 2.06], [0.52, 1.86],
    [0.82, 1.48], [0.88, 1.04], [0.72, 0.66],
    [0.38, 0.48], [0.06, 0.60], [-0.10, 0.88],
    [-0.06, 1.16], [0.14, 1.28], [0.32, 1.18]
  ];

  /** Punktfolge → weiche Kurve (Catmull-Rom, in Bezier uebersetzt). */
  function weichePfad(punkte) {
    var d = ['M' + punkte[0][0].toFixed(3) + ',' + punkte[0][1].toFixed(3)];
    for (var i = 0; i < punkte.length - 1; i++) {
      var p0 = punkte[Math.max(0, i - 1)];
      var p1 = punkte[i];
      var p2 = punkte[i + 1];
      var p3 = punkte[Math.min(punkte.length - 1, i + 2)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d.push('C' + c1x.toFixed(3) + ',' + c1y.toFixed(3) +
             ' ' + c2x.toFixed(3) + ',' + c2y.toFixed(3) +
             ' ' + p2[0].toFixed(3) + ',' + p2[1].toFixed(3));
    }
    return d.join(' ');
  }

  function schluesselPfad() { return weichePfad(SCHLUESSEL_PUNKTE); }

  var SCHLUESSEL = null;
  var HAKEN_Y = -2.40;

  /* Kleinster erlaubter Massstab des Violinschluessels. Darunter
   * bliebe seine obere Schlaufe unter der obersten Notenlinie. */
  var SK_MIN = 0.85;

  /* Schwarzer Notensatz.
   *
   * Die bunten Koepfe sind die Bruecke zwischen Griffbild, Tier und
   * Ton — fuer den Anfang genau richtig. Irgendwann muss das Kind aber
   * Noten lesen, wie sie ueberall sonst gedruckt sind: alle schwarz.
   * Dieser Schalter macht daraus ein normales Notenbild, ohne dass
   * sich sonst irgendetwas aendert. Er gilt fuer die App; das Buch
   * setzt ihn nie und bleibt bunt. */
  var EINFARBIG = false;
  function tonFarbe(ton) { return EINFARBIG ? 'var(--linie)' : ton.farbe; }
  function tonRand(ton) { return EINFARBIG ? 'var(--linie)' : ton.farbeRand; }

  /* ---------------------------------------------------------------- */

  /** Ermittelt die groesstmoegliche Zwischenraum-Groesse Z (in px). */
  function masse(opt) {
    var schluesselBreite = opt.violinschluessel ? 2.45 : 0.4;
    // Bei der einzelnen Note aus Level 1 darf es rechts enger zugehen —
    // dort zaehlt jeder Millimeter fuer den Notenkopf.
    var rand = opt.einzeln ? 0.6 : 0.9;
    /* Waagrechter Bedarf in Z. Die Notenabstaende sind proportional zur
     * Dauer — deshalb wird hier mit der Summe der Dauergewichte
     * gerechnet und nicht mit der blossen Anzahl. Sonst bekommt die
     * kuerzeste Note weniger Platz als ihr Kopf breit ist, und der
     * naechste Taktstrich schneidet sie an. */
    var bedarfBreite = schluesselBreite + rand + opt.strichPlatz +
                       opt.gewichtSumme * opt.notenAbstand;
    /* Senkrechter Bedarf in Z.
     *
     * Das System selbst spannt vier Zwischenraeume. Wieviel darueber
     * und darunter dazukommt, haengt davon ab, was tatsaechlich in der
     * Zeile steht: h1 bis d2 bleiben im System, c1 haengt eine ganze
     * Hilfslinie darunter. Deshalb wird der Bedarf aus den Noten
     * gerechnet und nicht pauschal gesetzt — eine Uebung ohne tiefe
     * Toene behaelt so ihre grossen Notenkoepfe.
     *
     * Der Violinschluessel geht ueber das System hinaus. Er wird NICHT
     * eingerechnet — sonst wuerde ein optionales Zeichen die
     * Notenkoepfe kleiner machen, und die sind das eigentlich
     * Wichtige. Er wird stattdessen so weit verkleinert, dass er in
     * die uebrige Hoehe passt. */
    var bedarfHoehe = (opt.yUnten - opt.yOben);

    var zBreite = opt.breitePx / bedarfBreite;
    var zHoehe = opt.hoehePx / bedarfHoehe;
    return Math.min(zBreite, zHoehe);
  }

  /**
   * svg    : <svg>-Element
   * o      : {
   *   toene, melodie|einzelTon, breitePx, hoehePx, markerIndex,
   *   violinschluessel, taktstriche, zoom
   * }
   * Liefert { z, positionen: [{x,y,index,tonId}] }
   */
  function zeichne(svg, o) {
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    if (!SCHLUESSEL) { SCHLUESSEL = schluesselPfad(); }

    if (!o.melodie && !o.einzelTon) { return null; }
    var einzeln = !o.melodie;
    // In Level 1 gibt es keinen Rhythmus — deshalb die Ganze Note:
    // offener Kopf, kein Hals, nichts, was nach Dauer aussieht.
    var noten = einzeln
      ? [{ tonId: o.einzelTon, wert: 1, schlag: 0, dauer: 4, takt: 0, pause: false }]
      : o.melodie.noten;
    var klingend = noten.filter(function (n) { return !n.pause; });

    /* Lange Lieder brechen in zwei Zeilen um — wie im Buch. Vier Takte
     * passen in eine Zeile; ein ganzes Lied mit acht oder zwoelf
     * Takten wird sonst zum unlesbaren Wurm. Der Buchsatz zerlegt
     * selbst in Systeme und gibt notenAbstand vor — dort bleibt es
     * bei einer Zeile je Aufruf. */
    var zeilenzahl = (!einzeln && !o.notenAbstand && o.melodie.takte.length > 4) ? 2 : 1;
    var zeilenTakte = [];
    if (zeilenzahl === 2) {
      var halb = Math.ceil(o.melodie.takte.length / 2);
      zeilenTakte = [o.melodie.takte.slice(0, halb), o.melodie.takte.slice(halb)];
    } else if (!einzeln) {
      zeilenTakte = [o.melodie.takte];
    }

    // Immer das ganze System: fuenf Linien und der Violinschluessel,
    // auch bei einem einzelnen Ton. So sieht das Kind von Anfang an
    // dasselbe Bild wie in richtigen Noten.
    // Mindestbreite je Dauereinheit; ein Notenkopf ist 1.26 breit.
    /* Der Notenabstand darf von aussen vorgegeben werden. Die App
     * tut das nie — sie laesst jede Zeile so breit werden, wie sie
     * wird. Der Buchsatz braucht es: dort muessen alle Systeme einer
     * Seite gleich breit sein, sonst franst die Seite rechts aus. */
    var notenAbstand = o.notenAbstand || (einzeln ? 1.45 : 1.54);
    var mitSchluessel = o.violinschluessel !== false;
    var strichLuecke = 0.62;
    var schlussPlatz = 0.55;                 // fuer den Schlussstrich
    var randRechts = einzeln ? 0.6 : 0.9;    // muss zu `rand` in masse() passen

    /* Gewicht und Taktzahl der VOLLSTEN Zeile bestimmen die Groesse. */
    function zeilenGewicht(takte) {
      var g2 = 0;
      takte.forEach(function (t) {
        t.forEach(function (n2) { g2 += Math.pow(n2.dauer, 0.55); });
      });
      return g2;
    }
    var maxGewicht = 0, maxTakte = 1;
    zeilenTakte.forEach(function (zt) {
      maxGewicht = Math.max(maxGewicht, zeilenGewicht(zt));
      maxTakte = Math.max(maxTakte, zt.length);
    });
    var strichPlatz = einzeln ? 0 : (maxTakte - 1) * strichLuecke + schlussPlatz;

    /* Wie weit reicht der Inhalt einer Zeile nach oben und unten?
     * Immer mindestens das ganze System (-2 bis +2). */
    var yOben = -2, yUnten = 2;
    for (var yi = 0; yi < noten.length; yi++) {
      var nY = noten[yi];
      if (nY.pause) { continue; }
      var tonY = o.toene[nY.tonId];
      if (!tonY) { continue; }
      var y0 = -tonY.stufe / 2;
      yOben = Math.min(yOben, y0 - 0.62);          // halber Kopf plus Rand
      yUnten = Math.max(yUnten, y0 + 0.62);
      if (nY.wert !== 1) {                          // Notenhals
        yOben = Math.min(yOben, y0 - (y0 <= 0.001 ? 0 : 2.6));
        yUnten = Math.max(yUnten, y0 + (y0 <= 0.001 ? 2.6 : 0));
      }
    }
    if (!einzeln) { yOben = Math.min(yOben, HAKEN_Y - 0.36); }   // Platz fuers Haekchen
    yOben -= 0.18; yUnten += 0.18;                                // Luft am Rand

    /* Der Violinschluessel braucht seinen Platz.
     *
     * Sein Pfad reicht von y = -3.22 bis +3.06, die Einrollung sitzt
     * auf der g-Linie (y = +1). Bei Massstab sk liegt sein oberer
     * Punkt bei 1 - 4.22 sk, sein unterer bei 1 + 2.06 sk. Damit die obere Schlaufe IMMER ueber die
     * oberste Notenlinie (y = -2) hinausragt, darf sk nie unter 0.71
     * fallen; wir setzen die Untergrenze mit Reserve auf SK_MIN.
     *
     * Der so gebrauchte Raum wird hier in die Zeilenhoehe eingerechnet
     * — sonst waere der Schluessel zwar gross genug, aber angeschnitten. */
    if (mitSchluessel) {
      yOben = Math.min(yOben, 1 - 4.22 * SK_MIN - 0.12);
      yUnten = Math.max(yUnten, 1 + 2.06 * SK_MIN + 0.12);
    }

    /* Der Abstand zwischen zwei Zeilen, in Zwischenraum-Einheiten. */
    var zeilenLuft = 0.9;
    var zeilenHoehe = yUnten - yOben;

    var z = masse({
      einzeln: einzeln,
      gewichtSumme: einzeln ? 1 : maxGewicht,
      notenAbstand: notenAbstand,
      violinschluessel: mitSchluessel,
      strichPlatz: strichPlatz,
      yOben: yOben,
      yUnten: yOben + zeilenHoehe * zeilenzahl + zeilenLuft * (zeilenzahl - 1),
      breitePx: o.breitePx, hoehePx: o.hoehePx
    });

    var breiteZ = o.breitePx / z, hoeheZ = o.hoehePx / z;
    var gesamtHoehe = zeilenHoehe * zeilenzahl + zeilenLuft * (zeilenzahl - 1);
    /* Der Ausschnitt wird um die Mitte des Inhalts gelegt, nicht um die
     * Mittellinie — sonst rutschte eine Zeile mit tiefen Toenen aus dem
     * Bild. */
    var inhaltMitte = yOben + gesamtHoehe / 2;
    var oben = inhaltMitte - hoeheZ / 2, links = 0;
    svg.setAttribute('viewBox', links + ' ' + oben + ' ' + breiteZ + ' ' + hoeheZ);
    svg.setAttribute('width', o.breitePx);
    svg.setAttribute('height', o.hoehePx);

    var positionen = [];

    /* ---- Eine Zeile zeichnen -------------------------------------- */
    function zeichneZeile(zeilenNoten, versatz, istLetzte, obenClip, untenClip) {
      var g = el('g', { transform: versatz ? 'translate(0,' + versatz.toFixed(4) + ')' : null });
      svg.appendChild(g);

      /* Notenlinien — enden BUENDIG am letzten Taktstrich. Runde
       * Linienenden ragten darueber hinaus; deshalb stumpfe Enden. */
      var linienEnde = breiteZ - 0.25;
      var linienStaerke = 0.085;   /* schlank wie im Notensatz */
      for (var L = -2; L <= 2; L++) {
        g.appendChild(el('line', {
          x1: 0.2, y1: L, x2: linienEnde, y2: L,
          stroke: 'var(--linie)', 'stroke-width': linienStaerke, 'stroke-linecap': 'butt'
        }));
      }

      var x = mitSchluessel ? 0.55 : 0.6;
      if (mitSchluessel) {
        /* So gross wie moeglich, aber nie ueber den Rand der eigenen
         * Zeile hinaus. Der Schluesselpfad reicht von y = -3.22 bis
         * +3.06, die Einrollung sitzt auf y = +1. */
        var sk = Math.min(1,
                          (1 - (obenClip + 0.12)) / 4.22,
                          ((untenClip - 0.12) - 1) / 2.06);
        /* Nie kleiner als SK_MIN — sonst verschwindet die obere
         * Schlaufe zwischen den Notenlinien und der Schluessel sieht
         * aus wie ein Kringel. */
        if (!(sk > SK_MIN)) { sk = SK_MIN; }
        g.appendChild(el('path', {
          d: SCHLUESSEL,
          transform: 'translate(' + (x + 1.05 * sk) + ',' + (1 - sk) + ') scale(' + sk.toFixed(4) + ')',
          fill: 'none', stroke: 'var(--linie)',
          'stroke-width': (0.155 / sk).toFixed(4),
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
        x += 2.45 * sk;
      }

      /* Noten setzen: Abstand proportional zur Dauer. Jede Zeile
       * verteilt ihre Noten auf die volle Breite — so enden beide
       * Zeilen eines Liedes buendig rechts. */
      var gewicht = 0, ti;
      for (ti = 0; ti < zeilenNoten.length; ti++) {
        gewicht += Math.pow(zeilenNoten[ti].dauer, 0.55);
      }
      var zeilenStriche = einzeln ? 0 :
        ((zeilenNoten.length ? (zeilenNoten[zeilenNoten.length - 1].takt - zeilenNoten[0].takt) : 0)
         * strichLuecke + schlussPlatz);
      var verfuegbar = breiteZ - x - randRechts - zeilenStriche;
      var proGewicht = einzeln ? 0 : verfuegbar / gewicht;

      var ersterTakt = zeilenNoten.length ? zeilenNoten[0].takt : 0;
      var letzterTakt = ersterTakt - 1;

      for (var i = 0; i < zeilenNoten.length; i++) {
        var n = zeilenNoten[i];

        if (!einzeln && o.taktstriche !== false && n.takt !== letzterTakt) {
          if (n.takt > ersterTakt) {
            x += strichLuecke / 2;
            g.appendChild(el('line', {
              x1: x, y1: -2, x2: x, y2: 2,
              stroke: 'var(--linie)', 'stroke-width': 0.075
            }));
            x += strichLuecke / 2;
          }
          letzterTakt = n.takt;
        }

        var breiteSlot = einzeln ? 0 : Math.pow(n.dauer, 0.55) * proGewicht;
        // Die einzelne Note aus Level 1 steht mittig in dem Raum, der
        // NACH dem Violinschluessel uebrig bleibt.
        var mitte = einzeln ? (x + (breiteZ - randRechts - x) / 2)
                            : x + breiteSlot / 2;

        if (n.pause) {
          zeichnePause(g, mitte, n.wert);
        } else {
          var ton = o.toene[n.tonId];
          var y = -ton.stufe / 2;
          var ki = klingend.indexOf(n);
          hilfslinien(g, mitte, y);
          zeichneNote(g, mitte, y, n.wert, ton, einzeln, ki);
          /* Position absolut speichern (mit Zeilenversatz), damit der
           * Marker und der Buchsatz sie direkt verwenden koennen. */
          positionen.push({ index: noten.indexOf(n), x: mitte, y: y + versatz,
                            tonId: n.tonId, klingendIndex: ki });
          if (o.haken && o.haken.indexOf(ki) >= 0) { zeichneHaken(g, mitte, HAKEN_Y); }
        }
        x += breiteSlot;
      }

      /* Am Ende der Zeile: Schlussstrich nur, wenn das Stueck hier
       * wirklich endet — sonst ein einfacher Taktstrich. */
      if (!einzeln && o.taktstriche !== false) {
        var schluss = istLetzte && o.schluss !== false;
        if (!schluss) {
          g.appendChild(el('line', {
            x1: linienEnde - 0.0375, y1: -2, x2: linienEnde - 0.0375, y2: 2,
            stroke: 'var(--linie)', 'stroke-width': 0.075
          }));
        } else {
          var dick = 0.2;
          var xDick = linienEnde - dick / 2;
          g.appendChild(el('line', {
            x1: xDick - 0.26, y1: -2, x2: xDick - 0.26, y2: 2,
            stroke: 'var(--linie)', 'stroke-width': 0.075
          }));
          g.appendChild(el('line', {
            x1: xDick, y1: -2, x2: xDick, y2: 2,
            stroke: 'var(--linie)', 'stroke-width': dick
          }));
        }
      }
    }

    if (einzeln) {
      zeichneZeile(noten, 0, true, oben, oben + hoeheZ);
    } else {
      for (var zi = 0; zi < zeilenTakte.length; zi++) {
        var zn = [];
        zeilenTakte[zi].forEach(function (t) { t.forEach(function (n3) { zn.push(n3); }); });
        var versatz = zi * (zeilenHoehe + zeilenLuft);
        /* Der Schluessel jeder Zeile darf bis an die Zeilengrenzen. */
        var zOben = (zi === 0) ? oben : yOben - 0.3;
        var zUnten = (zi === zeilenTakte.length - 1) ? (oben + hoeheZ - versatz) : yUnten + 0.3;
        zeichneZeile(zn, versatz, zi === zeilenTakte.length - 1, zOben, zUnten);
      }
    }

    /* Marker: ein weicher Ring um die Note, auf der wir gerade stehen.
     * positionen tragen absolute Koordinaten — eine Zeichnung im
     * Wurzel-SVG genuegt. */
    if (o.markerIndex >= 0) {
      for (var mi = 0; mi < positionen.length; mi++) {
        if (positionen[mi].index === o.markerIndex) {
          svg.appendChild(el('circle', {
            cx: positionen[mi].x, cy: positionen[mi].y, r: 0.95,
            fill: 'none', stroke: 'var(--marker)', 'stroke-width': 0.16,
            'class': 'marker-ring'
          }));
          break;
        }
      }
    }

    return { z: z, positionen: positionen, notenkopfPx: z };
  }

  function zeichneNote(g, cx, cy, wert, ton, gross, klingendIndex) {
    var offen = (wert === 2 || wert === 1);
    var rx = 0.63, ry = 0.5;

    if (wert !== 1) {
      /* Halsrichtung wie im Notensatz: ab der Mittellinie aufwaerts
       * geht der Hals nach UNTEN und sitzt LINKS am Kopf, darunter
       * nach oben und rechts. h1 liegt auf der Mittellinie und bekommt
       * deshalb einen Hals nach unten links.
       *
       * Die Laenge ist bewusst kuerzer als im Notensatz ueblich
       * (2.5 statt 3.5 Zwischenraeume): so bleibt mehr Platz fuer
       * grosse Notenkoepfe, und das Bild wirkt ruhiger. */
      var nachUnten = cy <= 0.001;
      var hx = nachUnten ? cx - rx + 0.06 : cx + rx - 0.06;
      var hy1 = cy, hy2 = cy + (nachUnten ? 2.5 : -2.5);
      g.appendChild(el('line', {
        x1: hx, y1: hy1, x2: hx, y2: hy2,
        stroke: 'var(--linie)', 'stroke-width': 0.13, 'stroke-linecap': 'round'
      }));
    }

    // Der aeussere Kopf traegt seinen Index, damit die Rueckmeldung
    // genau diese eine Note zum Leuchten bringen kann. Offene Koepfe
    // bestehen aus zwei Ellipsen — Zaehlen allein reichte nicht.
    g.appendChild(el('ellipse', {
      cx: cx, cy: cy, rx: rx, ry: ry,
      'data-note': klingendIndex == null ? null : klingendIndex,
      transform: 'rotate(-18 ' + cx + ' ' + cy + ')',
      /* Halbe und ganze Noten bleiben INNEN offen — dann laeuft die
       * Notenlinie sichtbar durch den Kopf, so wie es im gedruckten
       * Notensatz aussieht. Eine papierfarbene Fuellung wuerde die
       * Linie ausradieren, und eine Note auf der Linie saehe aus, als
       * schwebte sie daneben. */
      fill: offen ? 'none' : tonFarbe(ton),
      stroke: tonRand(ton),
      'stroke-width': 0.085
    }));
    if (offen) {
      // Bei offenen Koepfen traegt der Ring die Farbe des Tons
      g.appendChild(el('ellipse', {
        cx: cx, cy: cy, rx: rx - 0.115, ry: ry - 0.115,
        transform: 'rotate(-18 ' + cx + ' ' + cy + ')',
        fill: 'none', stroke: tonFarbe(ton), 'stroke-width': 0.20
      }));
    }
  }

  /* Hilfslinien fuer Noten ausserhalb des Systems. Im Umfang c1..d2
   * betrifft das genau c1: er sitzt eine ganze Linie unter dem System. */
  function hilfslinien(g, cx, cy) {
    for (var y = 3; y <= cy + 0.01; y++) {
      g.appendChild(el('line', {
        x1: cx - 0.95, y1: y, x2: cx + 0.95, y2: y,
        stroke: 'var(--linie)', 'stroke-width': 0.115, 'stroke-linecap': 'round'
      }));
    }
    for (var yo = -3; yo >= cy - 0.01; yo--) {
      g.appendChild(el('line', {
        x1: cx - 0.95, y1: yo, x2: cx + 0.95, y2: yo,
        stroke: 'var(--linie)', 'stroke-width': 0.115, 'stroke-linecap': 'round'
      }));
    }
  }

  /* Kleines gruenes Haekchen ueber der Note: diese hier sass.
   * Es sitzt knapp ueber der obersten Notenlinie (y = -2) und bleibt
   * mit seiner ganzen Hoehe innerhalb der Zeichenflaeche — dafuer
   * sorgt randOben. */
  function zeichneHaken(g, cx, cy) {
    g.appendChild(el('path', {
      d: 'M' + (cx - 0.30) + ',' + (cy + 0.02) +
         ' L' + (cx - 0.08) + ',' + (cy + 0.25) +
         ' L' + (cx + 0.32) + ',' + (cy - 0.26),
      fill: 'none', stroke: 'var(--haken)', 'stroke-width': 0.16,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'class': 'haken'
    }));
  }

  /* Viertelpause */
  /* Pausen sehen verschieden aus, je nachdem wie lang sie dauern —
   * sonst lernt das Kind, dass ein Zeichen alles Moegliche heissen
   * kann. Die Balken sitzen dort, wo sie im Notensatz sitzen:
   *
   *   Halbe Pause  liegt OBEN AUF der Mittellinie (y = 0)
   *   Ganze Pause  haengt UNTER der vierten Linie (y = -1)
   *
   * Genau daran unterscheidet man die beiden im Druck.
   */
  function zeichnePause(g, cx, wert) {
    if (wert === 2 || wert === 1) {
      var breite = 0.86, hoehe = 0.42;
      var oben = (wert === 2) ? -hoehe : -1;
      g.appendChild(el('rect', {
        x: cx - breite / 2, y: oben, width: breite, height: hoehe,
        fill: 'var(--linie)'
      }));
      return;
    }
    /* Viertelpause: der uebliche Haken. */
    var d = 'M' + (cx - 0.16) + ',-0.92 L' + (cx + 0.18) + ',-0.30 ' +
            'L' + (cx - 0.14) + ',0.16 L' + (cx + 0.20) + ',0.72 ' +
            'C' + (cx - 0.02) + ',0.52 ' + (cx - 0.24) + ',0.66 ' + (cx - 0.10) + ',0.96';
    g.appendChild(el('path', {
      d: d, fill: 'none', stroke: 'var(--linie)',
      'stroke-width': 0.19, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
  }

  root.Noten = {
    zeichne: zeichne, schluesselPfad: schluesselPfad,
    einfarbig: function (an) { EINFARBIG = !!an; },
    istEinfarbig: function () { return EINFARBIG; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
