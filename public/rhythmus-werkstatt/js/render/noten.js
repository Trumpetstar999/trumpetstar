/* noten.js — Notensystem als SVG (Band 2).
 *
 * Alle Masse rechnen in "Zwischenraum" (Z) als Einheit: ein Notenkopf
 * ist genau einen Zwischenraum hoch. Die fuenf Linien liegen bei
 * y = -2 -1 0 +1 +2, die mittlere Linie (y = 0) ist h1.
 *
 * Gegenueber Band 1 kann der Satz jetzt alles, was der zweite Band
 * braucht: Achtel und Sechzehntel mit Balken oder Faehnchen,
 * punktierte Noten, Halte- und Bindeboegen, Auftakt, 3/4-Takt,
 * Tonart- und Versetzungszeichen, Achtelpausen und
 * Wiederholungszeichen.
 *
 * Derselbe Code zeichnet in der App und — ueber buch/tools/renderer.js
 * — im Buch. Es gibt kein zweites Notenbild.
 *
 * Fuer den Druck darf nur vorkommen, was buch/tools/svg2pdf.js kennt:
 * line, rect, circle, ellipse, path (M L C Z), rotate und
 * translate+scale. Deshalb kommen Schluessel, Vorzeichen und
 * Taktziffern als fertige Pfade aus js/render/glyphen.js (Notenschrift
 * Leland, erzeugt von tools/mach-glyphen.py) und nicht als Schrift.
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attr) {
    var e = document.createElementNS(NS, name);
    for (var k in attr) { if (attr[k] !== null && attr[k] !== undefined) { e.setAttribute(k, attr[k]); } }
    return e;
  }
  function f(v) { return (Math.round(v * 1000) / 1000).toString(); }

  /* Notenzeichen aus der Notenschrift (glyphen.js). Der Schluessel
   * hat seinen Ursprung auf der g-Linie (y = +1) und ragt 4,45 Z nach
   * oben und 2,66 Z nach unten. */
  var G = root.Glyphen;
  var SK_OBEN = -G.schluessel.oben, SK_UNTEN = G.schluessel.unten;
  var SCHLUESSEL_PLATZ = 0.55 + G.schluessel.breite + 0.4;   // Rand + Zeichen + Luft
  function glyphe(g, name, x, y, sk) {
    g.appendChild(el('path', {
      d: G[name].d,
      transform: 'translate(' + f(x) + ',' + f(y) + ') scale(' + (sk || 1).toFixed(4) + ')',
      fill: 'var(--linie)'
    }));
  }
  function schluessel(g, sk) { glyphe(g, 'schluessel', 0.55, 1, sk); }

  var HAKEN_Y = -2.40;
  var SK_MIN = 0.85;

  /* Masse des Notenbildes (in Z). */
  var RX = 0.63, RY = 0.5;          // Notenkopf
  var STIEL = 3.0;                  // Notenhals
  var STIEL_MIN = 2.5;              // kuerzester Hals unter einem Balken
  var BALKEN = 0.45, BALKEN_ABSTAND = 0.75;
  var MIN_SLOT = 0.9;               // fester Platz je Note, unabhaengig von der Dauer
  var VZ_PLATZ = 1.1;               // Platz fuer ein Versetzungszeichen
  var PUNKT_PLATZ = 0.5;
  var STRICH_LUECKE = 0.62;
  var WDH_PLATZ = 0.7;              // Zusatz fuer ein Wiederholungszeichen
  var SCHLUSS_PLATZ = 0.6;
  var RAND_RECHTS = 0.9;

  /* Schwarzer Notensatz: ein Schalter fuer die App, im Buch immer an. */
  var EINFARBIG = true;
  function tonFarbe(ton) { return EINFARBIG ? 'var(--linie)' : ton.farbe; }
  function tonRand(ton) { return EINFARBIG ? 'var(--linie)' : ton.farbeRand; }

  function gewicht(n) { return Math.pow(n.dauer, 0.6); }
  function aufLinie(y) { return Math.abs(y - Math.round(y)) < 0.01; }

  /* ---------------------------------------------------------------- */
  /* Vorzeichen                                                        */
  /* ---------------------------------------------------------------- */

  /* Stufe → Stammton-Nummer: 0 h, 1 c, 2 d, 3 e, 4 f, 5 g, 6 a */
  function stamm(stufe) { return ((stufe % 7) + 7) % 7; }
  function tonartAlteration(vorzeichen, st) {
    if (vorzeichen < 0 && st === 0) { return -1; }   // F-Dur: b
    if (vorzeichen > 0 && st === 4) { return 1; }    // G-Dur: fis
    return 0;
  }

  /** Setzt n.vz (null | -1 | 0 | 1) fuer jede Note: welches
   *  Versetzungszeichen steht davor? Es gilt bis zum Taktstrich. */
  function versetzungen(melodie, toene) {
    melodie.takte.forEach(function (takt) {
      var stand = {};
      takt.forEach(function (n) {
        n.vz = null;
        if (n.pause) { return; }
        var ton = toene[n.tonId];
        var alt = ton.alteration || 0;
        var key = ton.stufe;
        var jetzt = (key in stand) ? stand[key] : tonartAlteration(melodie.vorzeichen, stamm(ton.stufe));
        if (alt !== jetzt && !n.fortsetzung) { n.vz = alt; }
        stand[key] = alt;
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Gruppen, Halsrichtung                                             */
  /* ---------------------------------------------------------------- */

  /* Achtel und Sechzehntel innerhalb EINES Schlags bekommen einen
   * gemeinsamen Balken. Ueber den Schlag hinaus wird nicht
   * verbalkt — dann sieht das Kind in jedem Balken genau einen
   * Schlag: »Ti-ti«. */
  function gruppieren(melodie, toene) {
    melodie.takte.forEach(function (takt) {
      var gruppe = [];
      function abschliessen() {
        if (gruppe.length >= 2) {
          var summe = 0;
          gruppe.forEach(function (n) { summe += -toene[n.tonId].stufe / 2; });
          var runter = (summe / gruppe.length) <= 0;
          gruppe.forEach(function (n, i) {
            n.gruppe = gruppe; n.gruppenIndex = i; n.runter = runter;
          });
        }
        gruppe = [];
      }
      var schlag = -1;
      takt.forEach(function (n) {
        n.gruppe = null;
        if (!n.pause) { n.runter = (-toene[n.tonId].stufe / 2) <= 0.001; }
        var kurz = !n.pause && n.wert >= 8;
        var s = Math.floor(n.schlagImTakt + 1e-6);
        if (!kurz || s !== schlag) { abschliessen(); }
        if (kurz) { gruppe.push(n); schlag = s; } else { schlag = -1; }
      });
      abschliessen();
    });
  }

  /* ---------------------------------------------------------------- */
  /* Breiten                                                           */
  /* ---------------------------------------------------------------- */

  function kopfBreite(o) {
    var b = o.mitSchluessel ? SCHLUESSEL_PLATZ : 0.6;
    if (o.vorzeichen) { b += o.vorzeichen < 0 ? 1.2 : 1.3; }
    if (o.taktartZeigen) { b += TAKTART_PLATZ; }
    return b + 0.35;
  }

  function zeilenMasse(noten, takteDerZeile, melodie) {
    var fest = 0, summe = 0;
    noten.forEach(function (n) {
      fest += MIN_SLOT + (n.vz !== null && n.vz !== undefined ? VZ_PLATZ : 0) + (n.punkt ? PUNKT_PLATZ : 0);
      summe += gewicht(n);
    });
    var striche = (takteDerZeile.length - 1) * STRICH_LUECKE + SCHLUSS_PLATZ;
    if (melodie.wiederholung) {
      takteDerZeile.forEach(function (t) {
        if (t === melodie.wiederholung[0] && t > 0) { striche += WDH_PLATZ; }
        if (t === melodie.wiederholung[1]) { striche += WDH_PLATZ; }
      });
    }
    return { fest: fest + striche + RAND_RECHTS, gewicht: summe };
  }

  /* ---------------------------------------------------------------- */
  /* Hauptfunktion                                                     */
  /* ---------------------------------------------------------------- */

  /**
   * svg  : <svg>-Element
   * o    : {
   *   toene, melodie (aus Melodie.aus) | einzelTon,
   *   breitePx, hoehePx, markerIndex (Anzeigeindex), haken (Anzeigeindizes),
   *   violinschluessel, taktstriche, notenAbstand, schluss,
   *   zeilen      [[taktIndex,...], ...]   ohne Angabe: Melodie.zeilen()
   *   taktartZeigen  in der Zeile mit Takt 0 (Standard: ja)
   * }
   * Liefert { z, positionen: [{index, x, y, tonId, klingendIndex}], zeilenY }
   */
  function zeichne(svg, o) {
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    if (o.einzelTon) { return zeichneEinzeln(svg, o); }
    if (!o.melodie) { return null; }

    var m = o.melodie, toene = o.toene;
    versetzungen(m, toene);
    gruppieren(m, toene);

    var zeilen = o.zeilen || root.Melodie.zeilen(m.takte.length, m.taktart, m.auftakt);
    var mitSchluessel = o.violinschluessel !== false;
    var abstand = o.notenAbstand || 1.54;

    /* Klingende Noten in Anzeige-Reihenfolge: daran haengen Silben
     * und Haekchen. Gehaltene Fortsetzungen zaehlen nicht. */
    var kIndex = {}, kz = 0;
    m.anzeige.forEach(function (n) { if (!n.pause && !n.fortsetzung) { kIndex[n.i] = kz++; } });

    /* ---- Zeilen vorbereiten --------------------------------------- */
    var plan = zeilen.map(function (takteDerZeile) {
      var noten = [];
      takteDerZeile.forEach(function (t) { m.takte[t].forEach(function (n) { noten.push(n); }); });
      var zeigtTaktart = o.taktartZeigen !== false && takteDerZeile[0] === 0;
      var kopf = kopfBreite({ mitSchluessel: mitSchluessel, vorzeichen: m.vorzeichen,
                              taktartZeigen: zeigtTaktart });
      var mz = zeilenMasse(noten, takteDerZeile, m);
      /* Senkrechter Bedarf */
      var yO = -2, yU = 2;
      noten.forEach(function (n) {
        if (n.pause) { return; }
        var y = -toene[n.tonId].stufe / 2;
        yO = Math.min(yO, y - 0.62); yU = Math.max(yU, y + 0.62);
        if (n.wert !== 1) {
          if (n.runter) { yU = Math.max(yU, y + STIEL + 0.15); }
          else { yO = Math.min(yO, y - STIEL - 0.15); }
        }
        if (n.halte || n.bogenAn || n.fortsetzung) {
          if (n.runter) { yO = Math.min(yO, y - 1.6); } else { yU = Math.max(yU, y + 1.6); }
        }
      });
      noten.forEach(function (n) {
        if (n.gruppe && n.gruppenIndex === 0) {
          var ys = n.gruppe.map(function (g) { return -toene[g.tonId].stufe / 2; });
          if (n.runter) { yU = Math.max(yU, Math.max.apply(null, ys) + STIEL + 0.6); }
          else { yO = Math.min(yO, Math.min.apply(null, ys) - STIEL - 0.6); }
        }
      });
      return { takte: takteDerZeile, noten: noten, kopf: kopf, zeigtTaktart: zeigtTaktart,
               fest: mz.fest, gewicht: mz.gewicht, yO: yO, yU: yU,
               natuerlich: kopf + mz.fest + mz.gewicht * abstand };
    });

    var yOben = -2, yUnten = 2;
    plan.forEach(function (p) { yOben = Math.min(yOben, p.yO); yUnten = Math.max(yUnten, p.yU); });
    if (o.haken !== false) { yOben = Math.min(yOben, HAKEN_Y - 0.36); }
    /* Platz ueber dem System fuer den Kanon-Einsatz. Das (kleine)
     * Atemzeichen passt in den Abstand zwischen den Systemen. */
    if (m.kanon && m.kanon.length) { yOben = Math.min(yOben, -4.45); }
    if (mitSchluessel) {
      yOben = Math.min(yOben, 1 - SK_OBEN * SK_MIN - 0.12);
      yUnten = Math.max(yUnten, 1 + SK_UNTEN * SK_MIN + 0.12);
    }
    yOben -= 0.18; yUnten += 0.18;
    var zeilenHoehe = yUnten - yOben;
    var zeilenLuft = 0.9;
    var gesamtHoehe = zeilenHoehe * plan.length + zeilenLuft * (plan.length - 1);

    var bedarfBreite = 0;
    plan.forEach(function (p) { bedarfBreite = Math.max(bedarfBreite, p.natuerlich); });
    var z = Math.min(o.breitePx / bedarfBreite, o.hoehePx / gesamtHoehe);
    var breiteZ = o.breitePx / z, hoeheZ = o.hoehePx / z;
    var inhaltMitte = yOben + gesamtHoehe / 2;
    var oben = inhaltMitte - hoeheZ / 2;
    svg.setAttribute('viewBox', '0 ' + f(oben) + ' ' + f(breiteZ) + ' ' + f(hoeheZ));
    svg.setAttribute('width', o.breitePx);
    svg.setAttribute('height', o.hoehePx);

    var positionen = [], zeilenY = [];

    plan.forEach(function (p, zi) {
      var versatz = zi * (zeilenHoehe + zeilenLuft);
      zeilenY.push(versatz);
      var zOben = (zi === 0) ? oben : yOben - 0.3;
      var zUnten = (zi === plan.length - 1) ? (oben + hoeheZ - versatz) : yUnten + 0.3;
      zeichneZeile(p, versatz, zi === plan.length - 1, zOben, zUnten);
    });

    /* ---- Eine Zeile ------------------------------------------------ */
    function zeichneZeile(p, versatz, istLetzte, obenClip, untenClip) {
      var g = el('g', { transform: versatz ? 'translate(0,' + f(versatz) + ')' : null });
      svg.appendChild(g);

      var linienEnde = breiteZ - 0.25;
      for (var L = -2; L <= 2; L++) {
        g.appendChild(el('line', {
          x1: 0.2, y1: L, x2: f(linienEnde), y2: L,
          stroke: 'var(--linie)', 'stroke-width': 0.085, 'stroke-linecap': 'butt'
        }));
      }

      var x = mitSchluessel ? 0.55 : 0.6;
      if (mitSchluessel) {
        var sk = Math.min(1, (1 - (obenClip + 0.12)) / SK_OBEN, ((untenClip - 0.12) - 1) / SK_UNTEN);
        if (!(sk > SK_MIN)) { sk = SK_MIN; }
        schluessel(g, sk);
        x = SCHLUESSEL_PLATZ;      // gleicher Platz wie in kopfBreite()
      }
      /* Tonart: das b sitzt auf der h-Linie, das Kreuz auf der f-Linie. */
      if (m.vorzeichen < 0) { glyphe(g, 'b', x + 0.05, 0); x += 1.2; }
      if (m.vorzeichen > 0) { glyphe(g, 'kreuz', x + 0.05, -2); x += 1.3; }
      if (p.zeigtTaktart) {
        zeichneZiffer(g, m.taktart[0], x, -1);
        zeichneZiffer(g, m.taktart[1], x, 1);
        x += TAKTART_PLATZ;
      }
      x += 0.35;

      var verfuegbar = breiteZ - x - p.fest;
      var proGewicht = verfuegbar / p.gewicht;

      var orte = {};          // Anzeigeindex → {x, y, hx, ...}
      var letzterTakt = p.takte[0];
      var erster = true;

      for (var i = 0; i < p.noten.length; i++) {
        var n = p.noten[i];
        if (n.takt !== letzterTakt) {
          /* Taktstrich */
          var wdhEnde = m.wiederholung && letzterTakt === m.wiederholung[1];
          var wdhAnfang = m.wiederholung && n.takt === m.wiederholung[0] && n.takt > 0;
          if (o.taktstriche !== false) {
            x += STRICH_LUECKE / 2 + (wdhEnde ? WDH_PLATZ : 0);
            taktstrich(g, x, wdhEnde ? 'wdhEnde' : (wdhAnfang ? 'wdhAnfang' : 'einfach'));
            x += STRICH_LUECKE / 2 + (wdhAnfang ? WDH_PLATZ : 0);
          }
          letzterTakt = n.takt;
        } else if (erster && m.wiederholung && n.takt === m.wiederholung[0] && n.takt > 0) {
          /* Wiederholung beginnt am Zeilenanfang */
          taktstrich(g, x - 0.15, 'wdhAnfang');
          x += WDH_PLATZ;
        }
        erster = false;

        var mitVz = n.vz !== null && n.vz !== undefined;
        var slot = MIN_SLOT + gewicht(n) * proGewicht;
        var start = x;
        x += mitVz ? VZ_PLATZ : 0;
        var mitte = x + slot / 2;
        /* Kanon: ueber dem ersten Schlag des Einsatztaktes die Nummer
         * der Gruppe, die dort beginnt — eingekreist. */
        if (m.kanon && n.schlagImTakt === 0 && m.kanon.indexOf(n.takt) >= 0) {
          zeichneEinsatz(g, mitte, m.kanon.indexOf(n.takt) + 2);
        }
        if (n.klatsch) {
          zeichneKlatsch(g, mitte, n.wert);
          positionen.push({ index: n.i, x: mitte, y: versatz, tonId: null, klingendIndex: -1 });
        } else if (n.pause) {
          zeichnePause(g, mitte, n.wert);
        } else {
          var ton = toene[n.tonId];
          var y = -ton.stufe / 2;
          hilfslinien(g, mitte, y);
          if (mitVz) { zeichneVz(g, mitte - RX - 0.62, y, n.vz); }
          zeichneKopf(g, mitte, y, n.wert, ton, kIndex[n.i]);
          if (n.punkt) {
            g.appendChild(el('circle', { cx: f(mitte + RX + 0.38), cy: f(aufLinie(y) ? y - 0.5 : y),
                                         r: 0.17, fill: 'var(--linie)' }));
          }
          orte[n.i] = { x: mitte, y: y, n: n,
                        hx: n.runter ? mitte - RX + 0.06 : mitte + RX - 0.06 };
          positionen.push({ index: n.i, x: mitte, y: y + versatz, tonId: n.tonId,
                            klingendIndex: n.fortsetzung ? -1 : kIndex[n.i] });
          if (o.haken && o.haken.indexOf(n.i) >= 0) { zeichneHaken(g, mitte, HAKEN_Y); }
        }
        x = start + (mitVz ? VZ_PLATZ : 0) + slot + (n.punkt ? PUNKT_PLATZ : 0);
        /* Atemzeichen: ein Komma ueber der Linie, am Ende des Notenplatzes. */
        if (n.atem) { glyphe(g, 'atem', x - G.atem.breite * 0.8 - 0.05, -2.15, 0.8); }
      }

      /* Haelse, Faehnchen, Balken */
      p.noten.forEach(function (n) {
        if (n.pause || n.wert === 1) { return; }
        var ort = orte[n.i];
        if (n.gruppe) {
          if (n.gruppenIndex === 0) { zeichneBalken(g, n.gruppe, orte, toene); }
          return;
        }
        var richtung = n.runter ? 1 : -1;
        var spitze = ort.y + richtung * STIEL;
        g.appendChild(el('line', {
          x1: f(ort.hx), y1: f(ort.y), x2: f(ort.hx), y2: f(spitze),
          stroke: 'var(--linie)', 'stroke-width': 0.13, 'stroke-linecap': 'round'
        }));
        if (n.wert >= 8) { zeichneFaehnchen(g, ort.hx, spitze, n.runter, n.wert >= 16 ? 2 : 1); }
      });

      /* Halte- und Bindeboegen */
      var kopfEnde = (mitSchluessel ? SCHLUESSEL_PLATZ : 0.6) + 0.3;
      p.noten.forEach(function (n, idx) {
        if (n.pause) { return; }
        var ort = orte[n.i];
        if (n.halte) {
          var naechste = m.anzeige[n.i + 1];
          var ziel = naechste && orte[naechste.i];
          if (ziel) { bogen(g, ort.x + 0.45, ziel.x - 0.45, ort.y, ziel.y, n.runter, 0.8); }
          else { bogen(g, ort.x + 0.45, linienEnde - 0.2, ort.y, ort.y, n.runter, 0.8); }
        }
        if (n.fortsetzung && idx === 0) {
          bogen(g, kopfEnde, ort.x - 0.45, ort.y, ort.y, n.runter, 0.8);
        }
        if (n.bogenAn) {
          for (var j = n.i + 1; j < m.anzeige.length; j++) {
            if (m.anzeige[j].bogenAus) {
              var ende = orte[m.anzeige[j].i];
              if (ende) { bogen(g, ort.x + 0.2, ende.x - 0.2, ort.y, ende.y, n.runter, 1.1); }
              break;
            }
          }
        }
      });

      /* Ende der Zeile */
      if (o.taktstriche !== false) {
        var letzterIndex = p.takte[p.takte.length - 1];
        var stueckEnde = letzterIndex === m.takte.length - 1;
        var wdh = m.wiederholung && letzterIndex === m.wiederholung[1];
        var art = wdh ? 'wdhEnde' : (stueckEnde && o.schluss !== false ? 'schluss' : 'einfach');
        taktstrich(g, linienEnde - (art === 'einfach' ? 0.0375 : 0.1), art, true);
      }
    }

    /* Marker */
    if (o.markerIndex >= 0) {
      for (var mi = 0; mi < positionen.length; mi++) {
        if (positionen[mi].index === o.markerIndex) {
          svg.appendChild(el('circle', {
            cx: f(positionen[mi].x), cy: f(positionen[mi].y), r: 0.95,
            fill: 'none', stroke: 'var(--marker)', 'stroke-width': 0.16,
            'class': 'marker-ring'
          }));
          break;
        }
      }
    }

    return { z: z, positionen: positionen, notenkopfPx: z, zeilenY: zeilenY,
             zeilenHoehe: zeilenHoehe, yOben: yOben };
  }

  /* ---------------------------------------------------------------- */
  /* Einzelner Ton (Level 1): ganze Note, ohne Takt                    */
  /* ---------------------------------------------------------------- */

  function zeichneEinzeln(svg, o) {
    var ton = o.toene[o.einzelTon];
    var y = -ton.stufe / 2;
    var yOben = Math.min(-2, y - 0.62, 1 - SK_OBEN * SK_MIN - 0.12) - 0.18;
    var yUnten = Math.max(2, y + 0.62, 1 + SK_UNTEN * SK_MIN + 0.12) + 0.18;
    var mitVz = (ton.alteration || 0) !== 0;
    var bedarf = SCHLUESSEL_PLATZ + (mitVz ? VZ_PLATZ : 0) + 1.45 + 0.6;
    var z = Math.min(o.breitePx / bedarf, o.hoehePx / (yUnten - yOben));
    var breiteZ = o.breitePx / z, hoeheZ = o.hoehePx / z;
    var oben = (yOben + yUnten) / 2 - hoeheZ / 2;
    svg.setAttribute('viewBox', '0 ' + f(oben) + ' ' + f(breiteZ) + ' ' + f(hoeheZ));
    svg.setAttribute('width', o.breitePx);
    svg.setAttribute('height', o.hoehePx);
    var g = el('g', {});
    svg.appendChild(g);
    for (var L = -2; L <= 2; L++) {
      g.appendChild(el('line', { x1: 0.2, y1: L, x2: f(breiteZ - 0.25), y2: L,
        stroke: 'var(--linie)', 'stroke-width': 0.085, 'stroke-linecap': 'butt' }));
    }
    var sk = Math.min(1, (1 - (oben + 0.12)) / SK_OBEN, ((oben + hoeheZ - 0.12) - 1) / SK_UNTEN);
    if (!(sk > SK_MIN)) { sk = SK_MIN; }
    schluessel(g, sk);
    var x0 = 0.55 + (SCHLUESSEL_PLATZ - 0.55) * sk;
    var mitte = x0 + (breiteZ - 0.6 - x0) / 2 + (mitVz ? VZ_PLATZ / 2 : 0);
    hilfslinien(g, mitte, y);
    if (mitVz) { zeichneVz(g, mitte - RX - 0.62, y, ton.alteration); }
    zeichneKopf(g, mitte, y, 1, ton, 0);
    return { z: z, positionen: [{ index: 0, x: mitte, y: y, tonId: o.einzelTon, klingendIndex: 0 }],
             notenkopfPx: z };
  }

  /* ---------------------------------------------------------------- */
  /* Bausteine                                                         */
  /* ---------------------------------------------------------------- */

  function zeichneKopf(g, cx, cy, wert, ton, klingendIndex) {
    var offen = (wert === 2 || wert === 1);
    g.appendChild(el('ellipse', {
      cx: f(cx), cy: f(cy), rx: RX, ry: RY,
      'data-note': klingendIndex == null ? null : klingendIndex,
      transform: 'rotate(-18 ' + f(cx) + ' ' + f(cy) + ')',
      fill: offen ? 'none' : tonFarbe(ton),
      stroke: tonRand(ton), 'stroke-width': 0.085
    }));
    if (offen) {
      g.appendChild(el('ellipse', {
        cx: f(cx), cy: f(cy), rx: RX - 0.115, ry: RY - 0.115,
        transform: 'rotate(-18 ' + f(cx) + ' ' + f(cy) + ')',
        fill: 'none', stroke: tonFarbe(ton), 'stroke-width': 0.20
      }));
    }
  }

  function hilfslinien(g, cx, cy) {
    for (var y = 3; y <= cy + 0.01; y++) {
      g.appendChild(el('line', { x1: f(cx - 0.95), y1: y, x2: f(cx + 0.95), y2: y,
        stroke: 'var(--linie)', 'stroke-width': 0.115, 'stroke-linecap': 'round' }));
    }
    for (var yo = -3; yo >= cy - 0.01; yo--) {
      g.appendChild(el('line', { x1: f(cx - 0.95), y1: yo, x2: f(cx + 0.95), y2: yo,
        stroke: 'var(--linie)', 'stroke-width': 0.115, 'stroke-linecap': 'round' }));
    }
  }

  function zeichneHaken(g, cx, cy) {
    g.appendChild(el('path', {
      d: 'M' + f(cx - 0.30) + ',' + f(cy + 0.02) + ' L' + f(cx - 0.08) + ',' + f(cy + 0.25) +
         ' L' + f(cx + 0.32) + ',' + f(cy - 0.26),
      fill: 'none', stroke: 'var(--haken)', 'stroke-width': 0.16,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'class': 'haken'
    }));
  }

  /* Faehnchen an einem einzelnen Achtel oder Sechzehntel. */
  function zeichneFaehnchen(g, hx, spitze, runter, anzahl) {
    for (var k = 0; k < anzahl; k++) {
      var r = runter ? -1 : 1;              // Richtung zum Kopf hin
      var y0 = spitze + r * k * 0.75;
      var d = 'M' + f(hx) + ',' + f(y0) +
              ' C' + f(hx + 0.12) + ',' + f(y0 + r * 0.9) + ' ' + f(hx + 1.15) + ',' + f(y0 + r * 1.15) +
              ' ' + f(hx + 0.78) + ',' + f(y0 + r * 2.3) +
              ' C' + f(hx + 0.98) + ',' + f(y0 + r * 1.45) + ' ' + f(hx + 0.35) + ',' + f(y0 + r * 1.15) +
              ' ' + f(hx) + ',' + f(y0 + r * 0.95) + ' Z';
      g.appendChild(el('path', { d: d, fill: 'var(--linie)', stroke: 'var(--linie)',
                                 'stroke-width': 0.04, 'stroke-linejoin': 'round' }));
    }
  }

  function zeichneBalken(g, gruppe, orte, toene) {
    var runter = gruppe[0].runter;
    var r = runter ? 1 : -1;               // Richtung vom Kopf zur Spitze
    var erste = orte[gruppe[0].i], letzte = orte[gruppe[gruppe.length - 1].i];
    var x1 = erste.hx, x2 = letzte.hx;
    var t1 = erste.y + r * STIEL, t2 = letzte.y + r * STIEL;
    var neigung = Math.max(-0.5, Math.min(0.5, t2 - t1));
    function spitzeBei(x) { return t1 + (x2 === x1 ? 0 : neigung * (x - x1) / (x2 - x1)); }
    /* Kein Hals darf kuerzer werden als STIEL_MIN — sonst wird der
     * ganze Balken verschoben, nicht einzelne Haelse verbogen. */
    var schub = 0;
    gruppe.forEach(function (n) {
      var o = orte[n.i];
      var laenge = (spitzeBei(o.hx) - o.y) * r;
      if (laenge < STIEL_MIN) { schub = Math.max(schub, STIEL_MIN - laenge); }
    });
    var a = t1 + r * schub;
    function y(x) { return a + (x2 === x1 ? 0 : neigung * (x - x1) / (x2 - x1)); }

    gruppe.forEach(function (n) {
      var o = orte[n.i];
      g.appendChild(el('line', { x1: f(o.hx), y1: f(o.y), x2: f(o.hx), y2: f(y(o.hx)),
        stroke: 'var(--linie)', 'stroke-width': 0.13, 'stroke-linecap': 'butt' }));
    });
    function band(xa, xb, ebene) {
      var off = -r * ebene * BALKEN_ABSTAND;
      var ya = y(xa) + off, yb = y(xb) + off;
      var d = 'M' + f(xa) + ',' + f(ya) + ' L' + f(xb) + ',' + f(yb) +
              ' L' + f(xb) + ',' + f(yb - r * BALKEN) + ' L' + f(xa) + ',' + f(ya - r * BALKEN) + ' Z';
      g.appendChild(el('path', { d: d, fill: 'var(--linie)' }));
    }
    band(x1 - 0.065, x2 + 0.065, 0);
    /* Zweiter Balken fuer Sechzehntel */
    for (var i = 0; i < gruppe.length; i++) {
      if (gruppe[i].wert < 16) { continue; }
      var hx = orte[gruppe[i].i].hx;
      var nachbar = (i + 1 < gruppe.length && gruppe[i + 1].wert >= 16) ? i + 1 : -1;
      if (nachbar >= 0) { band(hx - 0.065, orte[gruppe[nachbar].i].hx + 0.065, 1); i = nachbar - 1; continue; }
      if (i > 0 && gruppe[i - 1].wert >= 16) { continue; }
      /* Ein einzelnes Sechzehntel neben einem punktierten Achtel:
       * kurzer Stummel, zur Nachbarnote hin. */
      if (i > 0) { band(hx - 0.95, hx + 0.065, 1); } else { band(hx - 0.065, hx + 0.95, 1); }
    }
  }

  /* Halte- oder Bindebogen als gefuellte Sichel. */
  function bogen(g, xa, xb, ya, yb, oberhalb, hoehe) {
    var s = oberhalb ? -1 : 1;
    var y1 = ya + s * 0.62, y2 = yb + s * 0.62;
    var h = s * Math.min(hoehe, 0.35 + (xb - xa) * 0.08);
    var dx = (xb - xa) * 0.25;
    var d = 'M' + f(xa) + ',' + f(y1) +
            ' C' + f(xa + dx) + ',' + f(y1 + h) + ' ' + f(xb - dx) + ',' + f(y2 + h) + ' ' + f(xb) + ',' + f(y2) +
            ' C' + f(xb - dx) + ',' + f(y2 + h * 0.62) + ' ' + f(xa + dx) + ',' + f(y1 + h * 0.62) + ' ' + f(xa) + ',' + f(y1) + ' Z';
    g.appendChild(el('path', { d: d, fill: 'var(--linie)', stroke: 'var(--linie)', 'stroke-width': 0.03 }));
  }

  function taktstrich(g, x, art, amEnde) {
    function strich(xx, breite) {
      g.appendChild(el('line', { x1: f(xx), y1: -2, x2: f(xx), y2: 2,
        stroke: 'var(--linie)', 'stroke-width': breite }));
    }
    function punkte(xx) {
      g.appendChild(el('circle', { cx: f(xx), cy: -0.5, r: 0.2, fill: 'var(--linie)' }));
      g.appendChild(el('circle', { cx: f(xx), cy: 0.5, r: 0.2, fill: 'var(--linie)' }));
    }
    if (art === 'einfach') { strich(x, 0.075); return; }
    if (art === 'schluss') { strich(x - 0.36, 0.075); strich(x, 0.2); return; }
    if (art === 'wdhEnde') { punkte(x - 0.75); strich(x - 0.36, 0.075); strich(x, 0.2); return; }
    if (art === 'wdhAnfang') { strich(x, 0.2); strich(x + 0.36, 0.075); punkte(x + 0.75); }
  }

  /* ---- Vorzeichen und Taktziffern aus der Notenschrift ------------- */
  /* x ist die Mitte des Zeichens, y die Tonhoehe. */
  function zeichneVz(g, x, y, alt) {
    var name = alt < 0 ? 'b' : alt > 0 ? 'kreuz' : 'aufloesung';
    glyphe(g, name, x - G[name].breite / 2, y);
  }

  /* Ziffern stehen mittig uebereinander: die obere in den oberen zwei
   * Zwischenraeumen (Mitte y = -1), die untere in den unteren (y = +1). */
  var TAKTART_PLATZ = G.ziffer4.breite + 0.3;
  function zeichneZiffer(g, zahl, x, mitte) {
    var name = 'ziffer' + zahl;
    if (!G[name]) { return; }
    glyphe(g, name, x + (G.ziffer4.breite - G[name].breite) / 2, mitte);
  }

  /* ---- Klatschen: Kreuz-Notenkopf auf der Mittellinie, mit Hals ----- */
  function zeichneKlatsch(g, cx, wert) {
    var r = 0.42;
    [[-1, -1, 1, 1], [-1, 1, 1, -1]].forEach(function (d) {
      g.appendChild(el('line', { x1: f(cx + d[0] * r), y1: f(d[1] * r), x2: f(cx + d[2] * r), y2: f(d[3] * r),
        stroke: 'var(--linie)', 'stroke-width': 0.16, 'stroke-linecap': 'round' }));
    });
    if (wert >= 2) {
      g.appendChild(el('line', { x1: f(cx + r), y1: -0.3, x2: f(cx + r), y2: f(-STIEL),
        stroke: 'var(--linie)', 'stroke-width': 0.12 }));
    }
  }

  /* ---- Kanon-Einsatz: eingekreiste Gruppennummer ueber dem System ---- */
  function zeichneEinsatz(g, cx, nummer) {
    var cy = -3.55, r = 0.78, name = 'ziffer' + nummer;
    g.appendChild(el('circle', { cx: f(cx), cy: f(cy), r: r, fill: 'none',
                                 stroke: 'var(--linie)', 'stroke-width': 0.11 }));
    if (!G[name]) { return; }
    var sk = 0.55;
    g.appendChild(el('path', { d: G[name].d, fill: 'var(--linie)',
      transform: 'translate(' + f(cx - G[name].breite * sk / 2) + ',' + f(cy) + ') scale(' + sk + ')' }));
  }

  /* ---- Pausen ------------------------------------------------------- */
  function zeichnePause(g, cx, wert) {
    if (wert === 2 || wert === 1) {
      var breite = 0.86, hoehe = 0.42;
      var oben = (wert === 2) ? -hoehe : -1;
      g.appendChild(el('rect', { x: f(cx - breite / 2), y: f(oben), width: breite, height: hoehe,
                                 fill: 'var(--linie)' }));
      return;
    }
    if (wert === 4) {
      var d = 'M' + f(cx - 0.16) + ',-0.92 L' + f(cx + 0.18) + ',-0.30 ' +
              'L' + f(cx - 0.14) + ',0.16 L' + f(cx + 0.20) + ',0.72 ' +
              'C' + f(cx - 0.02) + ',0.52 ' + f(cx - 0.24) + ',0.66 ' + f(cx - 0.10) + ',0.96';
      g.appendChild(el('path', { d: d, fill: 'none', stroke: 'var(--linie)',
        'stroke-width': 0.19, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      return;
    }
    /* Achtel- und Sechzehntelpause: Punkt mit Schraegstrich */
    var stufen = wert >= 16 ? 2 : 1;
    for (var k = 0; k < stufen; k++) {
      var oy = -0.55 + k * 0.75, ox = cx - 0.22 - k * 0.2;
      g.appendChild(el('circle', { cx: f(ox), cy: f(oy), r: 0.2, fill: 'var(--linie)' }));
      g.appendChild(el('path', {
        d: 'M' + f(ox - 0.05) + ',' + f(oy + 0.1) + ' C' + f(ox + 0.2) + ',' + f(oy + 0.3) + ' ' +
           f(ox + 0.45) + ',' + f(oy + 0.15) + ' ' + f(cx + 0.38) + ',' + f(-0.65 + k * 0.75),
        fill: 'none', stroke: 'var(--linie)', 'stroke-width': 0.13, 'stroke-linecap': 'round' }));
    }
    g.appendChild(el('line', { x1: f(cx + 0.38), y1: -0.65, x2: f(cx - 0.05), y2: f(0.95 + (stufen - 1) * 0.6),
      stroke: 'var(--linie)', 'stroke-width': 0.13, 'stroke-linecap': 'round' }));
  }

  root.Noten = {
    zeichne: zeichne,
    einfarbig: function (an) { EINFARBIG = !!an; },
    istEinfarbig: function () { return EINFARBIG; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
