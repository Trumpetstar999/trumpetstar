/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/render/noten.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* noten.js — Notensystem als SVG.
 *
 * Alle Masse rechnen in "Zwischenraum" (Z) als Einheit: ein Notenkopf
 * ist genau einen Zwischenraum hoch. Die fuenf Linien liegen bei
 * y = -2 -1 0 +1 +2, die mittlere Linie (y = 0) ist h1. Ein Ton mit
 * der `stufe` s aus toene.json sitzt bei y = -s/2.
 *
 * Der Umfang reicht vom kleinen fis (dritte Hilfslinie unter dem
 * System) bis zum a2 (erste Hilfslinie darueber). Wieviel Platz eine
 * Zeile braucht, wird deshalb aus dem gerechnet, was tatsaechlich in
 * ihr steht — eine Uebung im System behaelt ihre grossen Notenkoepfe.
 *
 * Was gesetzt wird:
 *   Ganze, Halbe, Viertel, Achtel, Sechzehntel (Faehnchen oder Balken), Punkt
 *   Pausen in denselben Werten
 *   Vorzeichnung; Kreuz, Be und Aufloesungszeichen nach der Taktregel
 *   Taktart (auch 6/8), Taktstriche, Schlussstrich, Halte- und Bindeboegen
 *   auf Wunsch darunter: Zaehlzeiten und Notennamen
 *
 * Zwei Arten von Blatt:
 *   Uebungen  ein oder zwei Zeilen, die das Feld ausfuellen
 *   Lieder    so viele Zeilen, wie die Vorlage hat (melodie.zeilen); das
 *             Blatt ist dann hoeher als das Feld und wird gerollt
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attr) {
    var e = document.createElementNS(NS, name);
    for (var k in attr) { if (attr[k] !== null && attr[k] !== undefined) { e.setAttribute(k, attr[k]); } }
    return e;
  }

  /* Text im Notenbild.
   *
   * Die Zeichnung rechnet in Zwischenraeumen, ein Buchstabe waere also
   * knapp eine Einheit gross. So kleine Schriftgrade rechnen Browser
   * ungenau — die Buchstaben stehen dann ungleich weit auseinander.
   * Deshalb wird der Text hundertfach groesser gesetzt und mit dem
   * Faktor 0.01 zurueckgeholt. */
  function schrift(g, x, y, inhalt, groesse, attr) {
    var t = el('text', {
      transform: 'translate(' + x.toFixed(3) + ',' + y.toFixed(3) + ') scale(0.01)',
      'font-size': Math.round(groesse * 100),
      'text-anchor': 'middle'
    });
    for (var k in attr) { t.setAttribute(k, attr[k]); }
    t.textContent = inhalt;
    g.appendChild(t);
    return t;
  }

  var G = root.Glyphen;
  function schluesselPfad() { return G.schluessel.d; }
  var SCHLUESSEL = G.schluessel.d;
  /* Das Haekchen sitzt knapp ueber der obersten Linie — oder hoeher,
   * wenn in der Zeile Noten ueber dem System stehen. */
  var HAKEN_Y = -2.40;

  /* Kleinster erlaubter Massstab des Violinschluessels. Darunter
   * bliebe seine obere Schlaufe unter der obersten Notenlinie. */
  var SK_MIN = 0.85;
  var SK_RAND = 0.3;          // Luft zwischen Schluessel und Blattrand

  var KOPF_RX = 0.63, KOPF_RY = 0.5;
  /* Hilfslinien: so weit reichen sie vom Kopf aus nach jeder Seite, und
   * so viel Luft bleibt mindestens zwischen zweien nebeneinander. */
  var HILFSLINIE = 0.92, HILFS_LUECKE = 0.34;
  var HALS = 3.0;             // bewusst kuerzer als im Notensatz ueblich
  var HALS_ACHTEL = 3.0;      // das Faehnchen braucht etwas mehr
  var BALKEN_DICKE = 0.45;
  var BALKEN_NEIGUNG = 0.6;   // hoechstens so viel Gefaelle ueber eine Gruppe
  var VZ_PLATZ = 0.95;        // Raum, den ein Vorzeichen vor der Note belegt
  var TAKTART_PLATZ = 1.75;
  var VORZEICHNUNG_SCHRITT = 0.78, VORZEICHNUNG_RAND = 0.3;
  /* Unter dieser Kopfgroesse (px) lohnen zwei sichtbare Zeilen nicht
   * mehr — dann lieber eine Zeile, die man lesen kann. */
  var ZWEI_ZEILEN_AB = 15;
  /* Eine einzelne Zeile fuellt hoechstens diesen Anteil der Feldhoehe.
   * Zwei Takte mit fuenf Noten wuerden sonst so gross, wie das Feld
   * hoch ist — Noten wie auf einem Plakat. */
  var EINE_ZEILE_HOECHSTENS = 0.8;
  /* So viel Platz braucht eine Zaehlzeit unter den Noten, gemessen am
   * Gewicht einer Note (siehe platzBedarf). */
  var ZAEHL_PLATZ = 0.47;
  /* Die Note steht am ANFANG ihres Platzes, nicht in seiner Mitte: so
   * weit hinter dessen Beginn, wie die kuerzeste Note halb breit ist
   * (deren Gewicht ist 1.08). Der Raum, den eine lange Note bekommt,
   * liegt damit hinter ihr — dort, wo ihre Zeit vergeht. */
  var VORLAUF = 0.54;

  /* Wo die Zeichen der Vorzeichnung im Violinschluessel sitzen (y in
   * Zwischenraeumen), und welche Stammtoene sie betreffen (0 = c ... 6 = h). */
  var KREUZ_LAGE = [-2, -0.5, -2.5, -1, 0.5, -1.5, 0];
  var BE_LAGE = [0, -1.5, 0.5, -1, 1, -0.5, 1.5];
  var KREUZ_TOENE = [3, 0, 4, 1, 5, 2, 6];
  var BE_TOENE = [6, 2, 5, 1, 4, 0, 3];
  var SCHLUESSEL_PLATZ = G.schluessel.breite + 0.4;
  var STRICH_LUECKE = 0.62;
  var SCHLUSS_PLATZ = 0.55;

  /* Schwarzer oder farbiger Notensatz. Schwarz ist das Notenbild, wie
   * es ueberall gedruckt steht, und hier die Voreinstellung. Farbig
   * gibt jedem Stammton seine Farbe — wer mag, als Lesehilfe. */
  var EINFARBIG = true;
  function tonFarbe(ton) { return EINFARBIG ? 'var(--linie)' : ton.farbe; }
  function tonRand(ton) { return EINFARBIG ? 'var(--linie)' : ton.farbeRand; }

  /* ---------------------------------------------------------------- */
  /* Vorlauf: Vorzeichen, Haelse, Balken                               */
  /* ---------------------------------------------------------------- */

  /** Was die Vorzeichnung fuer jeden Stammton vorgibt: { 3: 1 } heisst
   *  "jedes f ist ein fis". fifths: Kreuze positiv, Bes negativ. */
  function vorzeichnung(fifths) {
    var aus = {}, i;
    for (i = 0; i < Math.min(7, fifths || 0); i++) { aus[KREUZ_TOENE[i]] = 1; }
    for (i = 0; i < Math.min(7, -(fifths || 0)); i++) { aus[BE_TOENE[i]] = -1; }
    return aus;
  }
  /** Stammton (0 = c ... 6 = h) zu einer Lage im System. */
  function stammton(stufe) { return (((stufe + 6) % 7) + 7) % 7; }

  /** Welche Note bekommt ein Zeichen davor — und welches?
   *
   *  Die Taktregel: ein Vorzeichen gilt bis zum Taktstrich fuer alle
   *  Noten auf derselben Linie. Gesetzt wird also nur, wo sich etwas
   *  AENDERT. Folgt im selben Takt auf ein fis ein f, steht davor ein
   *  Aufloesungszeichen; ein zweites fis bekommt nichts.
   *
   *  Mit Vorzeichnung gilt deren Vorgabe am Anfang jedes Takts: in
   *  F-Dur braucht das b kein Zeichen, ein h dagegen den Aufloeser.
   *
   *  Liefert je Note 0 (nichts), 1 (Kreuz), -1 (Be) oder 2 (Aufloeser). */
  function vorzeichenBestimmen(noten, toene, fifths) {
    var aus = new Array(noten.length);
    var vorgabe = vorzeichnung(fifths);
    var takt = null, stand = {};
    for (var i = 0; i < noten.length; i++) {
      var n = noten[i];
      aus[i] = 0;
      if (n.takt !== takt) { takt = n.takt; stand = {}; }
      if (n.pause) { continue; }
      var ton = toene[n.tonId];
      if (!ton) { continue; }
      var soll = ton.vorzeichen || 0;
      var gilt = stand[ton.stufe];
      if (gilt === undefined) { gilt = vorgabe[stammton(ton.stufe)] || 0; }
      /* Eine uebergebundene Note ist dieselbe Note, nur laenger: sie
       * bekommt kein Zeichen, auch nicht hinter dem Taktstrich. */
      if (soll !== gilt && !n.bogenEnde) { aus[i] = soll === 0 ? 2 : soll; }
      stand[ton.stufe] = soll;
    }
    return aus;
  }

  /** Die Halsenden einer Balkengruppe.
   *
   *  Der Balken ist eine Gerade vom ersten zum letzten Hals, hoechstens
   *  leicht geneigt, und so hoch gelegt, dass kein Hals kuerzer wird
   *  als ein einzelner Achtelhals.
   *
   *  xs  wo die Haelse stehen     ys  wo die Koepfe liegen
   *  Liefert zu jedem Hals das y seines Endes. */
  function balkenLinie(xs, ys, unten) {
    var n = xs.length;
    var richtung = unten ? 1 : -1;
    var steig = Math.max(-BALKEN_NEIGUNG, Math.min(BALKEN_NEIGUNG, ys[n - 1] - ys[0]));
    var breite = (xs[n - 1] - xs[0]) || 1;
    var e0 = unten ? -Infinity : Infinity, i;
    for (i = 0; i < n; i++) {
      var noetig = ys[i] + richtung * HALS_ACHTEL - steig * (xs[i] - xs[0]) / breite;
      e0 = unten ? Math.max(e0, noetig) : Math.min(e0, noetig);
    }
    var aus = [];
    for (i = 0; i < n; i++) { aus.push(e0 + steig * (xs[i] - xs[0]) / breite); }
    return aus;
  }

  /** Halsrichtung, Halsende, Faehnchen und Balkengruppen.
   *
   *  Halsrichtung wie im Notensatz: ab der Mittellinie aufwaerts geht
   *  der Hals nach UNTEN und sitzt LINKS am Kopf, darunter nach oben
   *  und rechts.
   *
   *  Was unter einen Balken gehoert:
   *    Lieder     sagen es selbst — jede Note traegt aus der Vorlage
   *               `balken`: 'a' Anfang, 'm' Mitte, 'e' Ende.
   *    Uebungen   zwei Achtel auf derselben Zaehlzeit. So liest man sie
   *               als "eins-und" und nicht als zwei einzelne Ereignisse.
   *
   *  In einer Gruppe zeigen alle Haelse in dieselbe Richtung; welche,
   *  entscheidet die Note, die am weitesten von der Mittellinie liegt.
   *  Die Halsenden hier sind fuer gleich weit auseinanderstehende
   *  Noten gerechnet — genug, um den Platzbedarf zu kennen. Beim
   *  Zeichnen werden sie mit den wirklichen Abstaenden nachgezogen.
   *
   *  Das Ergebnis traegt zusaetzlich `gruppen`: je Gruppe die Indizes. */
  function haelseBestimmen(noten, toene) {
    var aus = new Array(noten.length);
    var gruppen = [], i, n;
    function lage(k) {
      var t = toene[noten[k].tonId];
      return t ? -t.stufe / 2 : 0;
    }
    function klingt(k) { return k < noten.length && !noten[k].pause && toene[noten[k].tonId]; }

    var ausVorlage = noten.some(function (x) { return x.balken; });
    if (ausVorlage) {
      var offen = null;
      for (i = 0; i < noten.length; i++) {
        n = noten[i];
        if (!klingt(i) || !n.balken) { offen = null; continue; }
        if (n.balken === 'a') { offen = [i]; }
        else if (offen) {
          offen.push(i);
          if (n.balken === 'e') { if (offen.length > 1) { gruppen.push(offen); } offen = null; }
        }
      }
    } else {
      for (i = 0; i < noten.length - 1; i++) {
        n = noten[i];
        if (klingt(i) && n.wert === 8 && klingt(i + 1) && noten[i + 1].wert === 8 &&
            noten[i + 1].takt === n.takt &&
            Math.floor(n.schlagImTakt + 1e-6) === Math.floor(noten[i + 1].schlagImTakt + 1e-6)) {
          gruppen.push([i, i + 1]);
          i++;
        }
      }
    }

    gruppen.forEach(function (gr, gi) {
      var ys = gr.map(lage), xs = gr.map(function (_, k) { return k * 1.7; });
      var fern = ys[0];
      ys.forEach(function (y) { if (Math.abs(y) > Math.abs(fern)) { fern = y; } });
      var unten = fern <= 0.001;
      var enden = balkenLinie(xs, ys, unten);
      gr.forEach(function (idx, k) {
        aus[idx] = { unten: unten, ende: enden[k], balken: true, gruppe: gi };
        if (k > 0) { aus[idx].balkenVon = gr[0]; }
      });
    });

    for (i = 0; i < noten.length; i++) {
      n = noten[i];
      if (aus[i] || n.pause || n.wert === 1 || !toene[n.tonId]) { continue; }
      var y = lage(i);
      var nachUnten = y <= 0.001;
      var faehnchen = n.wert === 8 ? 1 : (n.wert === 16 ? 2 : 0);
      var laenge = faehnchen ? HALS_ACHTEL + (faehnchen - 1) * 0.5 : HALS;
      aus[i] = { unten: nachUnten, ende: y + (nachUnten ? laenge : -laenge),
                 fahne: faehnchen > 0, fahnen: faehnchen };
    }
    aus.gruppen = gruppen;
    return aus;
  }

  /** Breitengewicht einer Note: laengere Noten bekommen mehr Platz,
   *  aber nicht im selben Verhaeltnis — sonst stuende eine Ganze allein
   *  auf weiter Flur. Nach unten gibt es eine Grenze: auch eine Achtel
   *  braucht Platz fuer ihren Kopf, sonst schieben sich zwei Achtel
   *  ineinander. */
  function gewicht(n) { return Math.max(1.08, Math.pow(n.dauer, 0.55)); }

  /** Die Zaehlsilbe zu einer Stelle im Takt.
   *
   *  Gezaehlt wird, was im Nenner der Taktart steht: Viertel im 4/4,
   *  Achtel im 6/8. Dazwischen steht im Vierteltakt "+" auf der halben
   *  Zaehlzeit und "e" auf den Sechzehnteln ("1 e + e"). */
  function zaehlsilbe(schlagImTakt, nenner) {
    var einheit = nenner === 8 ? 0.5 : 1;
    var stelle = schlagImTakt / einheit;
    var ganz = Math.round(stelle);
    if (Math.abs(stelle - ganz) < 1e-6) { return String(ganz + 1); }
    if (Math.abs(stelle - Math.floor(stelle) - 0.5) < 1e-6) { return '+'; }
    return 'e';
  }

  /**
   * svg    : <svg>-Element
   * o      : {
   *   toene, melodie|einzelTon, breitePx, hoehePx, markerIndex, haken,
   *   violinschluessel, taktstriche, taktart, zaehlen, namen, abweichung
   * }
   *   taktart     true: die Taktart steht hinter dem Schluessel
   *   zaehlen     true: Zaehlzeiten unter den Noten
   *   namen       function (tonId) → Text: Notennamen unter den Noten
   *   abweichung  { klingendIndex: Schlaege zu frueh (-) / zu spaet (+) }
   *   haken       false: kein Platz fuer Haekchen (Lieder)
   *
   * Die Melodie darf mitbringen:
   *   zaehler, nenner   die Taktart (ohne Angabe 4/4)
   *   vorzeichnung      Kreuze (+) oder Bes (-) am Zeilenanfang
   *   zeilen            Taktnummern, mit denen eine neue Zeile beginnt.
   *                     Dann wird das Blatt so hoch, wie es sein muss,
   *                     und das Feld rollt.
   *   auftakt           Laenge des Auftakts — fuer die Taktzahlen
   *
   * Liefert { z, positionen: [{x,y,bis,index,tonId,zeile,pause}],   (bis: wo ihr Platz endet)
   *           zeilen: [{obenPx,hoehePx}], hoehePx }
   */
  function zeichne(svg, o) {
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    if (!SCHLUESSEL) { SCHLUESSEL = schluesselPfad(); }

    if (!o.melodie && !o.einzelTon) { return null; }
    var einzeln = !o.melodie;
    // Bei den Einzeltoenen gibt es keinen Rhythmus — deshalb die Ganze
    // Note: offener Kopf, kein Hals, nichts, was nach Dauer aussieht.
    var noten = einzeln
      ? [{ tonId: o.einzelTon, wert: 1, schlag: 0, schlagImTakt: 0, dauer: 4, takt: 0, pause: false }]
      : o.melodie.noten;
    var klingend = noten.filter(function (n) { return !n.pause; });
    var zaehler = (!einzeln && o.melodie.zaehler) || 4;
    var nenner = (!einzeln && o.melodie.nenner) || 4;
    var fifths = (!einzeln && o.melodie.vorzeichnung) || 0;
    var festeZeilen = (!einzeln && o.melodie.zeilen && o.melodie.zeilen.length) ? o.melodie.zeilen : null;
    var vorzeichnungPlatz = fifths ? Math.abs(fifths) * VORZEICHNUNG_SCHRITT + VORZEICHNUNG_RAND : 0;

    var mitTaktart = !einzeln && o.taktart === true;
    var mitZaehlen = !einzeln && !!o.zaehlen;
    var namen = (!einzeln && typeof o.namen === 'function') ? o.namen : null;

    var vz = vorzeichenBestimmen(noten, o.toene, fifths);
    var haelse = haelseBestimmen(noten, o.toene);

    /* Gezaehlt wird, was im Nenner steht: Viertel, im 6/8 Achtel. */
    var zaehlEinheit = nenner === 8 ? 0.5 : 1;
    /** Die Zaehlzeiten, die IN die Dauer einer Note fallen (ohne die,
     *  auf der sie beginnt) — als Nummern ab 0. */
    function stilleZaehlzeiten(n) {
      var aus = [];
      for (var b = Math.floor(n.schlagImTakt / zaehlEinheit + 1e-6) + 1;
           b * zaehlEinheit < n.schlagImTakt + n.dauer - 1e-6; b++) { aus.push(b); }
      return aus;
    }
    /* Wie viel Breite eine Note bekommt: nach ihrer Dauer — und nie
     * weniger, als ihre Zaehlzeiten nebeneinander brauchen. Das zweite
     * greift im 6/8, wo unter einer punktierten Viertel "1 2 3" steht.
     * Es gilt auch, wenn die Zaehlzeiten ausgeblendet sind: das Blatt
     * soll sich beim Umschalten nicht verschieben. */
    function platzBedarf(n) {
      return einzeln ? gewicht(n)
                     : Math.max(gewicht(n), (stilleZaehlzeiten(n).length + 1) * ZAEHL_PLATZ);
    }
    /** Hat die Note Hilfslinien? +1 unter dem System, -1 darueber. */
    function hilfsSeite(n) {
      if (!n || n.pause || !o.toene[n.tonId]) { return 0; }
      var lage = -o.toene[n.tonId].stufe / 2;
      return lage >= 3 - 0.01 ? 1 : (lage <= -3 + 0.01 ? -1 : 0);
    }

    /* Eine Zeile oder zwei?
     *
     * Mehr als vier Takte brechen immer um — acht oder zwoelf in einer
     * Zeile werden zum unlesbaren Wurm. Vier Takte duerfen umbrechen,
     * wenn die Noten dadurch groesser werden: vier Takte voller Achtel
     * sind auf einem breiten, hohen Bildschirm in zwei Zeilen besser
     * zu lesen, auf einem flachen Telefon in einer. Entschieden wird
     * weiter unten, wenn feststeht, wie hoch eine Zeile ist. Ist
     * notenAbstand von aussen vorgegeben, bleibt es bei einer Zeile. */
    function aufteilen(zeilen) {
      if (einzeln) { return []; }
      if (festeZeilen) {
        return festeZeilen.map(function (von, i) {
          return o.melodie.takte.slice(von, i + 1 < festeZeilen.length ? festeZeilen[i + 1] : undefined);
        });
      }
      if (zeilen < 2) { return [o.melodie.takte]; }
      var halb = Math.ceil(o.melodie.takte.length / 2);
      return [o.melodie.takte.slice(0, halb), o.melodie.takte.slice(halb)];
    }
    var taktzahl = einzeln ? 1 : o.melodie.takte.length;
    var moeglicheZeilen = (einzeln || o.notenAbstand || taktzahl < 4) ? [1]
                        : (taktzahl > 4 ? [2] : [1, 2]);

    var notenAbstand = o.notenAbstand || (einzeln ? 1.45 : 1.54);
    var mitSchluessel = o.violinschluessel !== false;
    var xStart = mitSchluessel ? 0.55 : 0.6;
    var randRechts = einzeln ? 0.6 : 0.9;

    /* ---- Wie viel Breite braucht die vollste Zeile? ---------------- */
    function zeilenBedarf(takte, erste) {
      var g = 0, v = 0;
      takte.forEach(function (t) {
        t.forEach(function (n) {
          g += platzBedarf(n);
          if (vz[noten.indexOf(n)]) { v += VZ_PLATZ; }
        });
      });
      return {
        gewicht: g,
        fest: xStart + (mitSchluessel ? SCHLUESSEL_PLATZ : 0) + randRechts + v + vorzeichnungPlatz +
              (erste && mitTaktart ? TAKTART_PLATZ : 0) +
              (takte.length - 1) * STRICH_LUECKE + SCHLUSS_PLATZ
      };
    }
    function breitenBedarf(zeilenTakte) {
      if (einzeln) {
        return xStart + SCHLUESSEL_PLATZ + randRechts + (vz[0] ? VZ_PLATZ : 0) + notenAbstand;
      }
      var breit = 0;
      zeilenTakte.forEach(function (zt, zi) {
        var b = zeilenBedarf(zt, zi === 0);
        breit = Math.max(breit, b.fest + b.gewicht * notenAbstand);
      });
      return breit;
    }

    /* ---- Wie weit reicht der Inhalt nach oben und unten? ----------
     * Immer mindestens das ganze System (-2 bis +2). notenOben und
     * notenUnten halten fest, wo wirklich etwas gezeichnet ist — daran
     * richten sich Haekchen und die Textzeilen aus. */
    var yOben = -2, yUnten = 2;
    var notenOben = -2, notenUnten = 2;
    for (var yi = 0; yi < noten.length; yi++) {
      var nY = noten[yi];
      if (nY.pause) { continue; }
      var tonY = o.toene[nY.tonId];
      if (!tonY) { continue; }
      var y0 = -tonY.stufe / 2;
      var o1 = y0 - 0.62, u1 = y0 + 0.62;               // halber Kopf plus Rand
      if (haelse[yi]) {
        if (haelse[yi].unten) { u1 = Math.max(u1, haelse[yi].ende + 0.1); }
        else { o1 = Math.min(o1, haelse[yi].ende - 0.1); }
      }
      if (vz[yi] === -1) { o1 = Math.min(o1, y0 - 1.6); }
      else if (vz[yi]) { o1 = Math.min(o1, y0 - 1.05); u1 = Math.max(u1, y0 + 1.05); }
      notenOben = Math.min(notenOben, o1);
      notenUnten = Math.max(notenUnten, u1);
    }
    yOben = notenOben; yUnten = notenUnten;

    if (fifths > 0) { notenOben = Math.min(notenOben, KREUZ_LAGE[Math.min(fifths, 7) - 1 > 1 ? 2 : 0] - 1.1); }
    yOben = Math.min(yOben, notenOben);

    var hakenY = Math.min(HAKEN_Y, notenOben - 0.42);
    if (!einzeln && o.haken !== false) { yOben = Math.min(yOben, hakenY - 0.36); }   // Platz fuers Haekchen
    /* Boegen haengen unter (oder ueber) den Koepfen. */
    if (noten.some(function (x) { return x.bogenStart || x.bindeStart; })) {
      notenUnten += 0.55; yUnten = notenUnten;
    }

    /* Textzeilen unter dem System: erst die Zaehlzeiten, dann die Namen. */
    var zeileY = Math.max(2.75, notenUnten + 0.35);
    var zaehlY = 0, namenY = 0;
    if (mitZaehlen) { zeileY += 1.0; zaehlY = zeileY; }
    if (namen) { zeileY += 1.05; namenY = zeileY; }
    if (mitZaehlen || namen) { yUnten = Math.max(yUnten, zeileY + 0.25); }

    yOben -= 0.18; yUnten += 0.18;                                // Luft am Rand

    /* Der Violinschluessel braucht seinen Platz.
     *
     * Sein Pfad reicht von y = -3.22 bis +3.06, die Einrollung sitzt
     * auf der g-Linie (y = +1). Bei Massstab sk liegt sein oberer
     * Punkt bei 1 - (-G.schluessel.oben) sk, sein unterer bei 1 + G.schluessel.unten sk. Damit die
     * obere Schlaufe IMMER ueber die oberste Notenlinie (y = -2)
     * hinausragt, darf sk nie unter 0.71 fallen; die Untergrenze liegt
     * mit Reserve bei SK_MIN. */
    if (mitSchluessel) {
      yOben = Math.min(yOben, 1 - (-G.schluessel.oben) * SK_MIN - SK_RAND);
      yUnten = Math.max(yUnten, 1 + G.schluessel.unten * SK_MIN + SK_RAND);
    }

    /* Lieder: ueber jedem Zeilenanfang steht die Taktzahl. Sie braucht
     * ihren Platz in der Zeile selbst — sonst schneidet der Rand des
     * Felds sie ab, sobald die Zeile oben steht. */
    if (festeZeilen) { yOben = Math.min(yOben, -3.3); }

    /* Der Abstand zwischen zwei Zeilen, in Zwischenraum-Einheiten. */
    var zeilenLuft = 0.9;
    var zeilenHoehe = yUnten - yOben;

    var z = 0, zeilenzahl = 1, zeilenTakte = [], gesamtHoehe = zeilenHoehe;
    var breiteZ, hoeheZ, oben;
    if (festeZeilen) {
      /* Lieder: die Zeilen stehen fest, das Blatt wird so hoch wie
       * noetig. Die Groesse richtet sich nach der vollsten Zeile — und
       * danach, dass moeglichst ZWEI Zeilen ins Feld passen: wer spielt,
       * liest voraus, und am Zeilenende muss die naechste schon zu sehen
       * sein. Wird der Notenkopf dabei zu klein (Telefon), gilt eine. */
      zeilenTakte = aufteilen(0);
      zeilenzahl = zeilenTakte.length;
      var zBreit = o.breitePx / breitenBedarf(zeilenTakte);
      var zZwei = o.hoehePx / (2 * zeilenHoehe + zeilenLuft);
      var zweiImFeld = zZwei >= ZWEI_ZEILEN_AB;
      z = zweiImFeld ? Math.min(zBreit, zZwei) : Math.min(zBreit, o.hoehePx / zeilenHoehe);
      /* Bestimmt die Breite die Groesse, bliebe im Feld Platz uebrig —
       * und beim Rollen stuende oben ein abgeschnittener Rest der
       * vorigen Zeile. Deshalb wird der Abstand so weit gedehnt, dass
       * die sichtbaren Zeilen das Feld genau fuellen: jede Zeile kann
       * dann sauber oben stehen, auch die vorletzte. */
      zeilenLuft = Math.max(zeilenLuft, o.hoehePx / z - (zweiImFeld ? 2 : 1) * zeilenHoehe);
      gesamtHoehe = zeilenHoehe * zeilenzahl + zeilenLuft * (zeilenzahl - 1);
      breiteZ = o.breitePx / z; hoeheZ = gesamtHoehe; oben = yOben;
      svg.setAttribute('viewBox', '0 ' + oben + ' ' + breiteZ + ' ' + hoeheZ);
      svg.setAttribute('width', o.breitePx);
      svg.setAttribute('height', Math.ceil(gesamtHoehe * z));
    } else {
      /* Uebungen: die Aufteilung, bei der der Notenkopf am groessten wird. */
      moeglicheZeilen.forEach(function (anzahl) {
        var takte = aufteilen(anzahl);
        var hoehe = zeilenHoehe * anzahl + zeilenLuft * (anzahl - 1);
        var zHier = Math.min(o.breitePx / breitenBedarf(takte), o.hoehePx / hoehe);
        if (anzahl === 1 && !einzeln) {
          zHier = Math.min(zHier, o.hoehePx * EINE_ZEILE_HOECHSTENS / hoehe);
        }
        /* Zwei Zeilen muessen sich lohnen: ein Umbruch fuer ein paar
         * Prozent mehr Groesse zerreisst nur die Phrase. */
        if (zHier > z * (anzahl > 1 ? 1.2 : 1)) {
          z = zHier; zeilenzahl = anzahl; zeilenTakte = takte; gesamtHoehe = hoehe;
        }
      });
      breiteZ = o.breitePx / z; hoeheZ = o.hoehePx / z;
      /* Der Ausschnitt wird um die Mitte des Inhalts gelegt, nicht um
       * die Mittellinie — sonst rutschte eine Zeile mit tiefen Toenen
       * aus dem Bild. */
      oben = yOben + gesamtHoehe / 2 - hoeheZ / 2;
      svg.setAttribute('viewBox', '0 ' + oben + ' ' + breiteZ + ' ' + hoeheZ);
      svg.setAttribute('width', o.breitePx);
      svg.setAttribute('height', o.hoehePx);
    }

    var positionen = [];
    var platz = {};                         // Notenindex → { x, y, zeile } — fuer Balken und Boegen

    /* ---- Eine Zeile zeichnen -------------------------------------- */
    function zeichneZeile(zeilenNoten, versatz, istErste, istLetzte, obenClip, untenClip, zeilenNr) {
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

      var x = xStart;
      if (mitSchluessel) {
        /* So gross wie moeglich, aber nie ueber den Rand der eigenen
         * Zeile hinaus. */
        var sk = Math.min(1,
                          (1 - (obenClip + SK_RAND)) / (-G.schluessel.oben),
                          ((untenClip - SK_RAND) - 1) / G.schluessel.unten);
        if (!(sk > SK_MIN)) { sk = SK_MIN; }
        g.appendChild(el('path', {
          d: SCHLUESSEL,
          transform: 'translate(' + x + ',1) scale(' + sk.toFixed(4) + ')',
          fill: 'var(--linie)', 'class': 'rhythm-clef'
        }));
        x += SCHLUESSEL_PLATZ * sk;
      }

      /* Die Vorzeichnung steht in JEDER Zeile hinter dem Schluessel. */
      if (fifths) {
        for (var vi = 0; vi < Math.min(7, Math.abs(fifths)); vi++) {
          zeichneVorzeichen(g, x + 0.3 + vi * VORZEICHNUNG_SCHRITT,
                            fifths > 0 ? KREUZ_LAGE[vi] : BE_LAGE[vi], fifths > 0 ? 1 : -1, 'vorzeichnung');
        }
        x += vorzeichnungPlatz;
      }

      /* Taktzahl am Zeilenanfang — ab der zweiten Zeile. Der Auftakt
       * zaehlt nicht mit: Takt 1 ist der erste volle. */
      if (festeZeilen && !istErste && zeilenNoten.length) {
        schrift(g, 0.3, -2.5, String(zeilenNoten[0].takt + (o.melodie.auftakt ? 0 : 1)), 0.72, {
          fill: 'var(--linie-zart)', 'text-anchor': 'start', 'class': 'taktzahl'
        });
      }

      /* Die Taktart steht nur am Anfang des Stuecks, nicht in jeder
       * Zeile — wie gedruckt. Der Zaehler fuellt die oberen zwei
       * Zwischenraeume und steht auf der Mittellinie, der Nenner fuellt
       * die unteren zwei und steht auf der untersten.
       *
       * Die Schrift muss Ziffern haben, die alle gleich hoch sind und
       * auf der Grundlinie stehen. Georgia hat das nicht: ihre 3, 4, 5,
       * 7 und 9 haengen unter die Linie (Mediaevalziffern) — die
       * Taktart rutschte damit sichtbar aus dem System. Times hat
       * Ziffern in Versalhoehe: 0,66 der Schriftgroesse. */
      if (mitTaktart && istErste) {
        [zaehler, nenner].forEach(function (value, index) {
          var glyph = G['ziffer' + value];
          if (!glyph) { return; }
          g.appendChild(el('path', { d: glyph.d,
            transform: 'translate(' + (x + (G.ziffer4.breite - glyph.breite) / 2) + ',' + (index ? 1 : -1) + ')',
            fill: 'var(--linie)', 'class': 'taktart' }));
        });
        x += TAKTART_PLATZ;
      }

      /* Noten setzen: Abstand nach Dauer. Jede Zeile verteilt ihre
       * Noten auf die volle Breite — so enden beide Zeilen buendig. */
      var gew = 0, vzBreite = 0, ti;
      for (ti = 0; ti < zeilenNoten.length; ti++) {
        gew += platzBedarf(zeilenNoten[ti]);
        if (vz[noten.indexOf(zeilenNoten[ti])]) { vzBreite += VZ_PLATZ; }
      }
      var zeilenStriche = einzeln ? 0 :
        ((zeilenNoten.length ? (zeilenNoten[zeilenNoten.length - 1].takt - zeilenNoten[0].takt) : 0)
         * STRICH_LUECKE + SCHLUSS_PLATZ);
      var verfuegbar = breiteZ - x - randRechts - zeilenStriche - vzBreite;
      var proGewicht = einzeln ? 0 : verfuegbar / gew;

      var ersterTakt = zeilenNoten.length ? zeilenNoten[0].takt : 0;
      var letzterTakt = ersterTakt - 1;
      var mitten = [];                      // wo jede Note steht, fuer die Zaehlzeiten

      /* Haelse und Balken einer vollstaendig gesetzten Gruppe. */
      function zeichneBalkengruppe(gz, gr) {
        var unten = haelse[gr[0]].unten;
        var xs = gr.map(function (k) { return platz[k].x + (unten ? -KOPF_RX + 0.06 : KOPF_RX - 0.06); });
        var ys = gr.map(function (k) { return platz[k].y; });
        var enden = balkenLinie(xs, ys, unten);
        var zuKopf = unten ? -1 : 1;                       // vom Balken zum Kopf hin
        gr.forEach(function (k, j) {
          haelse[k].ende = enden[j];
          gz.appendChild(el('line', {
            x1: xs[j], y1: ys[j], x2: xs[j], y2: enden[j],
            stroke: 'var(--linie)', 'stroke-width': 0.13, 'stroke-linecap': 'butt'
          }));
        });
        function stueck(xa, ya, xb, yb, klasse) {
          gz.appendChild(el('path', {
            d: 'M' + xa + ',' + ya + ' L' + xb + ',' + yb +
               ' L' + xb + ',' + (yb + zuKopf * BALKEN_DICKE) + ' L' + xa + ',' + (ya + zuKopf * BALKEN_DICKE) + ' Z',
            fill: 'var(--linie)', 'class': klasse
          }));
        }
        var letztes = gr.length - 1;
        stueck(xs[0] - 0.065, enden[0], xs[letztes] + 0.065, enden[letztes], 'balken');
        /* Sechzehntel bekommen einen zweiten Balken darunter: zwischen
         * zwei Sechzehnteln durchgezogen, an einer einzelnen als kurzer
         * Stummel zur Nachbarnote hin. */
        var ab = zuKopf * (BALKEN_DICKE + 0.2);
        function linie(xx) {
          return enden[0] + (enden[letztes] - enden[0]) * (xx - xs[0]) / ((xs[letztes] - xs[0]) || 1);
        }
        gr.forEach(function (k, j) {
          if (noten[k].wert !== 16) { return; }
          var naechste16 = j < letztes && noten[gr[j + 1]].wert === 16;
          var vorige16 = j > 0 && noten[gr[j - 1]].wert === 16;
          if (naechste16) {
            stueck(xs[j] - 0.065, enden[j] + ab, xs[j + 1] + 0.065, enden[j + 1] + ab, 'balken zweit');
          } else if (!vorige16) {
            var xa = j > 0 ? xs[j] - 0.72 : xs[j] - 0.065;
            var xb = j > 0 ? xs[j] + 0.065 : xs[j] + 0.72;
            stueck(xa, linie(xa) + ab, xb, linie(xb) + ab, 'balken zweit');
          }
        });
      }

      for (var i = 0; i < zeilenNoten.length; i++) {
        var n = zeilenNoten[i];
        var gi = noten.indexOf(n);

        if (!einzeln && o.taktstriche !== false && n.takt !== letzterTakt) {
          if (n.takt > ersterTakt) {
            x += STRICH_LUECKE / 2;
            g.appendChild(el('line', {
              x1: x, y1: -2, x2: x, y2: 2,
              stroke: 'var(--linie)', 'stroke-width': 0.075
            }));
            x += STRICH_LUECKE / 2;
          }
          letzterTakt = n.takt;
        }

        if (vz[gi] && !einzeln) { x += VZ_PLATZ; }
        var breiteSlot = einzeln ? 0 : platzBedarf(n) * proGewicht;
        /* Wo die Zeit der Note beginnt — dort steht sie, und dort steht
         * ihre Zaehlzeit. Nur die Pause ueber einen ganzen Takt steht
         * in dessen Mitte, wie gedruckt. */
        var anfang = x + VORLAUF * proGewicht;
        // Der Einzelton steht mittig in dem Raum, der NACH dem
        // Violinschluessel uebrig bleibt.
        var mitte = einzeln ? (x + (breiteZ - randRechts - x) / 2 + (vz[gi] ? VZ_PLATZ / 2 : 0))
                  : ((n.pause && n.wert === 1) ? x + breiteSlot / 2 : anfang);

        if (n.pause) {
          zeichnePause(g, mitte, n.wert);
          positionen.push({ index: gi, x: mitte, y: versatz, tonId: null, bis: x + breiteSlot,
                            klingendIndex: -1, zeile: zeilenNr, pause: true });
        } else {
          var ton = o.toene[n.tonId];
          var y = -ton.stufe / 2;
          var ki = klingend.indexOf(n);
          /* Stehen zwei Noten mit Hilfslinien nebeneinander, duerfen
           * ihre Linien nicht zu EINER zusammenwachsen — sonst sieht es
           * aus wie eine sechste Notenlinie. Sie werden so weit
           * gekuerzt, dass dazwischen eine Luecke bleibt. Der Abstand
           * zur Nachbarin ist mindestens der Platz der linken von
           * beiden. */
          var hilfsLang = HILFSLINIE;
          var seite = hilfsSeite(n);
          if (seite && !einzeln) {
            if (hilfsSeite(noten[gi + 1]) === seite && i + 1 < zeilenNoten.length) {
              hilfsLang = Math.min(hilfsLang, breiteSlot / 2 - HILFS_LUECKE / 2);
            }
            if (i > 0 && hilfsSeite(noten[gi - 1]) === seite) {
              hilfsLang = Math.min(hilfsLang, platzBedarf(noten[gi - 1]) * proGewicht / 2 - HILFS_LUECKE / 2);
            }
            hilfsLang = Math.max(hilfsLang, KOPF_RX + 0.09);
          }
          hilfslinien(g, mitte, y, hilfsLang);
          if (vz[gi]) { zeichneVorzeichen(g, mitte - KOPF_RX - 0.5, y, vz[gi]); }
          var h = haelse[gi];
          zeichneNote(g, mitte, y, n.wert, ton, ki, h);
          platz[gi] = { x: mitte, y: y, zeile: zeilenNr };
          if (n.punkt) {
            /* Der Punkt sitzt im Zwischenraum. Liegt die Note auf einer
             * Linie, rutscht er in den Zwischenraum darueber — auf der
             * Linie waere er nicht zu sehen. */
            var aufLinie = Math.abs(ton.stufe % 2) === 0;
            g.appendChild(el('circle', {
              cx: mitte + KOPF_RX + 0.42, cy: y - (aufLinie ? 0.5 : 0), r: 0.15,
              fill: 'var(--linie)'
            }));
          }
          /* Ist die Balkengruppe vollstaendig gesetzt, bekommt sie ihre
           * Haelse und ihren Balken — erst jetzt stehen die wirklichen
           * Abstaende fest. */
          if (h && h.balken) {
            var gr = haelse.gruppen[h.gruppe];
            if (gr[gr.length - 1] === gi) { zeichneBalkengruppe(g, gr); }
          }
          /* Position absolut speichern (mit Zeilenversatz), damit der
           * Marker sie direkt verwenden kann. */
          positionen.push({ index: gi, x: mitte, y: y + versatz, tonId: n.tonId, bis: x + breiteSlot,
                            klingendIndex: ki, zeile: zeilenNr, pause: false });
          if (o.haken && o.haken.indexOf(ki) >= 0) {
            zeichneHaken(g, mitte, hakenY, o.abweichung ? o.abweichung[ki] : null);
          }
          if (namen) {
            schrift(g, mitte, namenY, namen(n.tonId), 0.86, {
              fill: 'var(--linie-zart)', 'class': 'notenname'
            });
          }
        }

        mitten.push({ n: n, x: einzeln ? mitte : anfang, breite: breiteSlot });
        x += breiteSlot;
      }

      /* ---- Halteboegen und Bindeboegen ----------------------------
       * Der Bogen haengt auf der Seite des Kopfes, auf der kein Hals
       * steht. Reicht er ueber das Zeilenende, wird er dort offen
       * gelassen und in der naechsten Zeile wieder aufgenommen. */
      function bogen(xa, ya, xb, yb, seite, klasse) {
        var tiefe = Math.min(1.0, 0.45 + (xb - xa) * 0.09);
        g.appendChild(el('path', {
          d: 'M' + xa.toFixed(3) + ',' + ya.toFixed(3) +
             ' Q' + ((xa + xb) / 2).toFixed(3) + ',' + ((ya + yb) / 2 + seite * tiefe * 1.5).toFixed(3) +
             ' ' + xb.toFixed(3) + ',' + yb.toFixed(3),
          fill: 'none', stroke: 'var(--linie)', 'stroke-width': 0.12,
          'stroke-linecap': 'round', 'class': klasse
        }));
      }
      function seiteVon(k) { return (haelse[k] && haelse[k].unten) ? -1 : 1; }
      var zeilenEnde = breiteZ - randRechts + 0.2;
      for (var bi = 0; bi < zeilenNoten.length; bi++) {
        var nb = zeilenNoten[bi], kb = noten.indexOf(nb);
        if (nb.pause || !platz[kb]) { continue; }
        var pa = platz[kb], sb = seiteVon(kb);
        ['bogen', 'binde'].forEach(function (art) {
          if (nb[art + 'Start']) {
            /* Wo endet er? Beim Haltebogen an der naechsten klingenden
             * Note, beim Bindebogen an der naechsten mit bindeEnde. */
            var ziel = -1;
            for (var q = kb + 1; q < noten.length; q++) {
              if (noten[q].pause) { continue; }
              if (art === 'bogen' || noten[q].bindeEnde) { ziel = q; break; }
            }
            if (ziel >= 0 && platz[ziel] && platz[ziel].zeile === zeilenNr) {
              bogen(pa.x + 0.5, pa.y + sb * 0.72, platz[ziel].x - 0.5, platz[ziel].y + sb * 0.72, sb, art);
            } else {
              bogen(pa.x + 0.5, pa.y + sb * 0.72, zeilenEnde, pa.y + sb * 0.72, sb, art + ' offen');
            }
          }
          if (nb[art + 'Ende']) {
            /* Kommt der Bogen aus der vorigen Zeile, beginnt er hier neu. */
            var von = -1;
            for (var q2 = kb - 1; q2 >= 0; q2--) {
              if (noten[q2].pause) { continue; }
              if (art === 'bogen' || noten[q2].bindeStart) { von = q2; break; }
            }
            if (von >= 0 && platz[von] && platz[von].zeile !== zeilenNr) {
              bogen(pa.x - 1.7, pa.y + sb * 0.72, pa.x - 0.5, pa.y + sb * 0.72, sb, art + ' offen');
            }
          }
        });
      }

      if (mitZaehlen) {
        /* Die Silbe unter der Note ist die, auf der sie beginnt. Dazu
         * blass alle Zaehlzeiten, die IN ihre Dauer fallen — so steht
         * unter einer Halben "1 2" und man sieht, dass sie zwei
         * Schlaege traegt. Pausen werden mitgezaehlt, ebenfalls blass.
         *
         * Die stillen Zaehlzeiten teilen den Platz IHRER Note
         * gleichmaessig: unter einer Ganzen stehen 1 2 3 4 in gleichen
         * Abstaenden, unter einer punktierten Viertel steht die stille
         * Zaehlzeit mittig zwischen ihr und der folgenden Achtel. Weil
         * jede Note am Anfang ihres Platzes steht, bleibt alles im
         * eigenen Takt — nichts rutscht unter den Taktstrich. */
        for (var mi2 = 0; mi2 < mitten.length; mi2++) {
          var m = mitten[mi2], nz = m.n;
          /* Eine uebergebundene Note wird nicht neu angestossen: ihre
           * Zaehlzeit steht blass, wie ein stiller Schlag. */
          var still = nz.pause || nz.bogenEnde;
          schrift(g, m.x, zaehlY, zaehlsilbe(nz.schlagImTakt, nenner), still ? 0.8 : 0.92, {
            fill: still ? 'var(--linie-zart)' : 'var(--linie)',
            'font-weight': still ? 400 : 700, 'class': 'zaehlzeit' + (still ? ' still' : '')
          });
          /* Bis wohin der Platz reicht: bis zur naechsten Note desselben
           * Takts (ein Vorzeichen davor zaehlt mit) — bei der letzten
           * des Takts bis ans Ende ihres eigenen Platzes. */
          var folgt = mitten[mi2 + 1];
          var weite = (folgt && folgt.n.takt === nz.takt) ? folgt.x - m.x : m.breite;
          var innen = stilleZaehlzeiten(nz);
          for (var b = 0; b < innen.length; b++) {
            schrift(g, m.x + (b + 1) / (innen.length + 1) * weite, zaehlY,
                    String(innen[b] + 1), 0.8, { fill: 'var(--linie-zart)', 'class': 'zaehlzeit still' });
          }
        }
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

    var zeilenMasse = [];
    if (einzeln) {
      zeichneZeile(noten, 0, true, true, oben, oben + hoeheZ, 0);
    } else {
      for (var zi = 0; zi < zeilenTakte.length; zi++) {
        var zn = [];
        zeilenTakte[zi].forEach(function (t) { t.forEach(function (n3) { zn.push(n3); }); });
        var versatz = zi * (zeilenHoehe + zeilenLuft);
        /* Der Schluessel jeder Zeile darf bis an die Zeilengrenzen. */
        var zOben = festeZeilen ? yOben : ((zi === 0) ? oben : yOben - 0.3);
        var zUnten = festeZeilen ? yUnten
                   : ((zi === zeilenTakte.length - 1) ? (oben + hoeheZ - versatz) : yUnten + 0.3);
        zeichneZeile(zn, versatz, zi === 0, zi === zeilenTakte.length - 1, zOben, zUnten, zi);
        zeilenMasse.push({ obenPx: (versatz + yOben - oben) * z, hoehePx: zeilenHoehe * z });
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

    return { z: z, positionen: positionen, notenkopfPx: z, zeilen: zeilenMasse,
             hoehePx: festeZeilen ? Math.ceil(gesamtHoehe * z) : o.hoehePx };
  }

  /** Setzt den Marker-Ring auf eine Position aus `positionen` — ohne
   *  das Blatt neu zu zeichnen. Bei einem ganzen Lied waere das bei
   *  jeder Note zu viel. Ohne Position verschwindet der Ring. */
  function setzeMarker(svg, position) {
    var ring = svg.querySelector('.marker-ring');
    if (!position) {
      if (ring) { ring.parentNode.removeChild(ring); }
      return;
    }
    if (!ring) {
      ring = el('circle', { r: 0.95, fill: 'none', stroke: 'var(--marker)',
                            'stroke-width': 0.16, 'class': 'marker-ring' });
      svg.appendChild(ring);
    }
    ring.setAttribute('cx', position.x);
    ring.setAttribute('cy', position.y);
  }

  /** Zeichnet Kopf, Hals und Faehnchen. Noten einer Balkengruppe
   *  bekommen hier nur den Kopf — Hals und Balken folgen, wenn die
   *  ganze Gruppe steht. */
  function zeichneNote(g, cx, cy, wert, ton, klingendIndex, hals) {
    var offen = (wert === 2 || wert === 1);
    var rx = KOPF_RX, ry = KOPF_RY;

    if (hals && !hals.balken) {
      var hx = hals.unten ? cx - rx + 0.06 : cx + rx - 0.06;
      g.appendChild(el('line', {
        x1: hx, y1: cy, x2: hx, y2: hals.ende,
        stroke: 'var(--linie)', 'stroke-width': 0.13, 'stroke-linecap': 'round'
      }));
      /* Das Faehnchen haengt immer rechts am Hals und schwingt zum Kopf
       * zurueck. Die Sechzehntel traegt zwei. */
      var r = hals.unten ? -1 : 1;
      for (var f = 0; f < (hals.fahnen || 0); f++) {
        g.appendChild(el('path', {
          d: 'M' + hx + ',' + (hals.ende + f * 0.6 * r) +
             ' c0.10,' + (0.62 * r) + ' 0.95,' + (0.86 * r) + ' 0.72,' + (1.95 * r),
          fill: 'none', stroke: 'var(--linie)', 'stroke-width': 0.17,
          'stroke-linecap': 'round', 'class': 'fahne'
        }));
      }
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
       * Notensatz aussieht. */
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

  /* Kreuz, Be, Aufloesungszeichen — gezeichnet, nicht gesetzt: auf
   * eine Musikschrift im Geraet ist kein Verlass. */
  function zeichneVorzeichen(g, ax, cy, art, zusatzKlasse) {
    var name = art === 1 ? 'kreuz' : art === -1 ? 'b' : 'aufloesung';
    g.appendChild(el('path', { d: G[name].d,
      transform: 'translate(' + (ax - G[name].breite / 2) + ',' + cy + ')',
      fill: 'var(--linie)', 'class': zusatzKlasse || 'vz' }));
  }

  /* Hilfslinien fuer Noten ausserhalb des Systems: c1 traegt eine, das
   * kleine fis haengt an der dritten; a2 sitzt auf der ersten oben. */
  /** halb: wie weit die Linie von der Mitte des Kopfes nach jeder
   *  Seite reicht. Stumpfe Enden — runde reichten ueber ihre Laenge
   *  hinaus und schloessen die Luecke zur Nachbarin wieder. */
  function hilfslinien(g, cx, cy, halb) {
    halb = halb || HILFSLINIE;
    for (var y = 3; y <= cy + 0.01; y++) {
      g.appendChild(el('line', {
        x1: cx - halb, y1: y, x2: cx + halb, y2: y,
        stroke: 'var(--linie)', 'stroke-width': 0.115, 'stroke-linecap': 'butt', 'class': 'hilfslinie'
      }));
    }
    for (var yo = -3; yo >= cy - 0.01; yo--) {
      g.appendChild(el('line', {
        x1: cx - halb, y1: yo, x2: cx + halb, y2: yo,
        stroke: 'var(--linie)', 'stroke-width': 0.115, 'stroke-linecap': 'butt', 'class': 'hilfslinie'
      }));
    }
  }

  /* Kleines gruenes Haekchen ueber der Note: diese hier sass.
   *
   * `abweichung` ist der Abstand zum Schlag in Schlaegen. Liegt die
   * Note deutlich daneben, bekommt das Haekchen einen kleinen Winkel
   * zur Seite: links davon heisst zu frueh, rechts zu spaet. Getroffen
   * ist sie trotzdem — aber so sieht man, wohin es zieht. */
  var DANEBEN_AB = 0.12;
  function zeichneHaken(g, cx, cy, abweichung) {
    g.appendChild(el('path', {
      d: 'M' + (cx - 0.30) + ',' + (cy + 0.02) +
         ' L' + (cx - 0.08) + ',' + (cy + 0.25) +
         ' L' + (cx + 0.32) + ',' + (cy - 0.26),
      fill: 'none', stroke: 'var(--haken)', 'stroke-width': 0.16,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'class': 'haken'
    }));
    if (typeof abweichung !== 'number' || Math.abs(abweichung) < DANEBEN_AB) { return; }
    var s = abweichung < 0 ? -1 : 1;
    var wx = cx + s * 0.62;
    g.appendChild(el('path', {
      d: 'M' + wx + ',' + (cy - 0.24) + ' L' + (wx + s * 0.24) + ',' + cy + ' L' + wx + ',' + (cy + 0.24),
      fill: 'none', stroke: 'var(--daneben)', 'stroke-width': 0.14,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'class': abweichung < 0 ? 'zeit frueh' : 'zeit spaet'
    }));
  }

  /* Pausen sehen verschieden aus, je nachdem wie lang sie dauern. Die
   * Balken sitzen dort, wo sie im Notensatz sitzen:
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
        fill: 'var(--linie)', 'class': 'pause'
      }));
      return;
    }
    if (wert === 8) {
      /* Achtelpause: ein Punkt, von dem ein Haar nach rechts schwingt,
       * und ein schraeger Strich nach unten. */
      g.appendChild(el('circle', { cx: cx - 0.26, cy: -0.52, r: 0.2, fill: 'var(--linie)', 'class': 'pause' }));
      g.appendChild(el('path', {
        d: 'M' + (cx - 0.24) + ',-0.40 Q' + (cx + 0.12) + ',-0.26 ' + (cx + 0.36) + ',-0.66' +
           ' L' + (cx - 0.04) + ',0.98',
        fill: 'none', stroke: 'var(--linie)', 'stroke-width': 0.13,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
      return;
    }
    /* Viertelpause: der uebliche Haken. */
    var d = 'M' + (cx - 0.16) + ',-0.92 L' + (cx + 0.18) + ',-0.30 ' +
            'L' + (cx - 0.14) + ',0.16 L' + (cx + 0.20) + ',0.72 ' +
            'C' + (cx - 0.02) + ',0.52 ' + (cx - 0.24) + ',0.66 ' + (cx - 0.10) + ',0.96';
    g.appendChild(el('path', {
      d: d, fill: 'none', stroke: 'var(--linie)',
      'stroke-width': 0.19, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'class': 'pause'
    }));
  }

  root.Noten = {
    zeichne: zeichne, schluesselPfad: schluesselPfad,
    vorzeichenBestimmen: vorzeichenBestimmen,
    haelseBestimmen: haelseBestimmen,
    balkenLinie: balkenLinie,
    zaehlsilbe: zaehlsilbe,
    setzeMarker: setzeMarker,
    einfarbig: function (an) { EINFARBIG = true; },
    istEinfarbig: function () { return EINFARBIG; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
