/* buchstueck.js — aus einem Stueck des Buches wird ein Durchgang.
 *
 * Das Buch steht in data/buch.json so, wie es gedruckt ist: Takte,
 * Zeilen, Wiederholungszeichen. Geuebt wird aber etwas Zeitliches —
 * eine Folge von Noten auf dem Puls. Dieses Modul macht aus dem einen
 * das andere, und zwar genau so, wie Level 2 es schon kennt: Noten mit
 * `schlag` und `dauer`, dazu die Klicks.
 *
 * Zwei Arten von Durchgang:
 *
 *   eine Zeile    Die Takte einer gedruckten Zeile, von links nach
 *                 rechts. Wiederholungszeichen gelten hier nicht — das
 *                 Kind liest die Zeile, die es vor sich hat. Ganze
 *                 Pausentakte am Rand fallen weg; wer eine Zeile uebt,
 *                 soll nicht sieben Takte warten.
 *   das Lied      Alles, mit Wiederholungen und 1./2. Schluss, so wie
 *                 man es spielt.
 *
 * Jede Note behaelt ihren Platz im Buch (`ref`: "Takt:Note"). Daran
 * haengen Marker und Haekchen im Notenbild, gleichgueltig, wie oft ein
 * Takt durch eine Wiederholung erklingt.
 *
 * Laeuft ohne DOM, damit es unter node geprueft werden kann.
 */
(function (root, factory) {
  var B = factory();
  if (typeof module === 'object' && module.exports) { module.exports = B; }
  root.Buchstueck = B;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TICKS = 48;

  /** Die gedruckten Zeilen: [von, bis) je Zeile, als Taktindizes. */
  function zeilen(takte) {
    var aus = [];
    for (var i = 0; i < takte.length; i++) {
      if (i === 0 || takte[i].ze) { aus.push([i, i + 1]); } else { aus[aus.length - 1][1] = i + 1; }
    }
    return aus;
  }

  /** In welcher Zeile steht Takt i? */
  function zeileVon(zl, i) {
    for (var z = 0; z < zl.length; z++) { if (i >= zl[z][0] && i < zl[z][1]) { return z; } }
    return 0;
  }

  /** Die Taktart, die in jedem Takt gilt. */
  function taktarten(takte) {
    var ta = [4, 4];
    return takte.map(function (t) { if (t.ta) { ta = t.ta; } return ta; });
  }

  /** Viertelschlaege je Takt: 4/4 → 4, 3/4 → 3, 2/4 → 2. */
  function schlaegeJeTakt(ta) { return ta[0] * 4 / ta[1]; }

  function nurPause(takt) {
    return takt.n.every(function (n) { return !n.t; });
  }

  /* Wie viele Schlaege ein Takt beim Ueben dauert.
   *
   * Eine Mehrtaktpause zaehlt dabei als EIN Takt. Im Buch spielt in
   * diesen Takten die Band des Playbacks; in der App klickt nur das
   * Metronom, und sieben Takte Klicken sind fuer ein Kind eine halbe
   * Minute Warten. Im Notenbild steht die Pause trotzdem so, wie sie
   * gedruckt ist. */
  function taktDauer(takt, ta) {
    return takt.mr ? schlaegeJeTakt(ta) : takt.l / TICKS;
  }

  /* ---------------------------------------------------------------- */
  /* Wiederholungen                                                    */
  /* ---------------------------------------------------------------- */

  /** Die Reihenfolge, in der die Takte erklingen.
   *
   *  |: ... :|  wird einmal wiederholt, zurueck zum letzten |: oder
   *  an den Anfang des Abschnitts. Ein Takt unter einer Klammer "1."
   *  erklingt nur im ersten Durchgang, unter "2." nur im zweiten. */
  function spielfolge(takte) {
    var folge = [];
    var start = 0;                 // Beginn des Abschnitts, der wiederholt wird
    var durchgang = 1;
    var gesprungen = {};           // an diesem :| wurde schon zurueckgesprungen
    var i = 0, sicherung = 0;
    while (i < takte.length && sicherung++ < 10000) {
      var t = takte[i];
      if (t.li === '|:' && durchgang === 1) { start = i; }
      if (t.vs) {
        var nummern = t.vs.split(/[,.]/).filter(Boolean).map(Number);
        if (nummern.indexOf(durchgang) < 0) {
          // Diese Klammer gilt jetzt nicht: bis zu ihrem Ende ueberspringen.
          var j = i;
          while (j < takte.length - 1 && !takte[j].ve) { j++; }
          i = j + 1;
          continue;
        }
      }
      folge.push(i);
      if (t.re === ':|' && !gesprungen[i]) {
        gesprungen[i] = true;
        durchgang++;
        i = start;
        continue;
      }
      var klammerZuEnde = t.ve && durchgang > 1 && !(takte[i + 1] && takte[i + 1].vs);
      if (t.re === ':|' || klammerZuEnde) {
        // Abschnitt fertig: der naechste beginnt hinter diesem Takt.
        start = i + 1;
        durchgang = 1;
      }
      i++;
    }
    return folge;
  }

  /* ---------------------------------------------------------------- */
  /* Der Durchgang                                                     */
  /* ---------------------------------------------------------------- */

  /**
   * stueck  ein Eintrag aus data/buch.json
   * opt     { stimme: 0|1, zeile: Zahl oder null (= das ganze Lied),
   *           tonKarte: { id: ton }, fMinHz: untere Grenze der Erkennung }
   */
  function melodie(stueck, opt) {
    opt = opt || {};
    var stimme = Math.min(opt.stimme || 0, stueck.stimmen.length - 1);
    var takte = stueck.stimmen[stimme].takte;
    var zl = zeilen(takte);
    var ta = taktarten(takte);
    var ganz = opt.zeile === null || opt.zeile === undefined;

    var folge;
    if (ganz) {
      folge = spielfolge(takte);
    } else {
      var z = zl[Math.max(0, Math.min(zl.length - 1, opt.zeile))];
      folge = [];
      for (var i = z[0]; i < z[1]; i++) { folge.push(i); }
      // Ganze Pausentakte am Ende einer Zeile fallen weg.
      while (folge.length > 1 && nurPause(takte[folge[folge.length - 1]])) { folge.pop(); }
    }
    // Und am Anfang, beim Lied wie bei der Zeile: wer loslegt, soll nicht erst warten.
    while (folge.length > 1 && nurPause(takte[folge[0]])) { folge.shift(); }

    var andere = stueck.stimmen.length > 1 ? stueck.stimmen[1 - stimme].takte : null;
    var noten = baueNoten(takte, folge, zl, ta, opt);
    var begleitung = andere ? baueNoten(andere, folge, zl, ta, opt).filter(function (n) {
      return !n.pause && !n.fortsetzung;
    }) : null;

    var laengen = folge.map(function (b) { return taktDauer(takte[b], ta[b]); });
    var starts = [], s = 0;
    laengen.forEach(function (l) { starts.push(s); s += l; });
    var auftakte = folge.map(function (b) { return !!takte[b].au; });

    var erster = folge[0];

    var toene = {};
    noten.forEach(function (n) { if (n.tonId) { toene[n.tonId] = true; } });

    return {
      buch: true,
      stueckId: stueck.id,
      stimme: stimme,
      zeile: ganz ? null : opt.zeile,
      seed: 700000 + (parseInt(String(stueck.id).replace(/\D/g, ''), 10) || 0) * 100 + (ganz ? 99 : opt.zeile),
      stufe: '2b',
      istLied: true,
      noten: noten,
      begleitung: begleitung,
      schlaegeGesamt: s,
      zaehlzeiten: schlaegeJeTakt(ta[erster]),
      klicks: klicks(folge, laengen, starts, ta, auftakte),
      folge: folge,
      zeilen: zl,
      toene: Object.keys(toene)
    };
  }

  function baueNoten(takte, folge, zl, ta, opt) {
    var noten = [];
    var schlag = 0;
    var offenerBogen = null;           // Kopf eines Haltebogens
    folge.forEach(function (b, k) {
      var pos = 0;
      takte[b].n.forEach(function (n, i) {
        var dauer = n.d / TICKS;
        var note = {
          tonId: n.t || null,
          pause: !n.t,
          schlag: schlag + pos / TICKS,
          dauer: dauer,
          takt: k,
          ref: n.unsichtbar ? null : b + ':' + i,
          zeile: zeileVon(zl, b)
        };
        if (n.t) {
          var bg = n.bg || '';
          if (bg.indexOf('z') >= 0 && offenerBogen && offenerBogen.tonId === n.t) {
            // Die Fortsetzung eines Haltebogens erklingt nicht neu.
            note.fortsetzung = true;
            offenerBogen.klangDauer += dauer;
          } else {
            note.klangDauer = dauer;
          }
          offenerBogen = bg.indexOf('a') >= 0 ? (note.fortsetzung ? offenerBogen : note) : null;
          var ton = opt.tonKarte && opt.tonKarte[n.t];
          /* Was klingend unter dem Suchbereich der Erkennung liegt,
           * kann nicht gehoert werden. Solche Noten werden gezeigt und
           * vorgespielt, aber nicht bewertet. Gerechnet wird mit einem
           * Viertelton Spielraum: so weit reicht die Toleranz, wenn der
           * Halbton darunter auch vorkommt. Das betrifft nur das tiefe a
           * (klingend 196 Hz); das tiefe b liegt knapp darueber. */
          if (ton && opt.fMinHz && ton.frequenzHz * Math.pow(2, -50 / 1200) < opt.fMinHz) {
            note.ohneWertung = true;
          }
        } else {
          offenerBogen = null;
        }
        noten.push(note);
        pos += n.d;
      });
      schlag += taktDauer(takte[b], ta[b]);
    });
    return noten;
  }

  /* Die Klicks eines Durchgangs, relativ zum Beginn der ersten Note.
   *
   * Vorgezaehlt wird EIN Takt in der Taktart des Lieds: im 4/4-Takt vier
   * Schlaege, im 3/4-Takt drei. Beginnt das Lied mit einem Auftakt,
   * gehoert der Auftakt in diesen Vorzaehltakt hinein — genau die Dauer,
   * die ihm im Schlusstakt fehlt, fehlt auch dem Einzaehler. Ein
   * Viertelauftakt im 3/4-Takt: "eins, zwei", und auf "drei" setzt er
   * ein. Ein Achtelauftakt im 4/4-Takt: "eins, zwei, drei, vier", und
   * auf "und" kommt er.
   *
   * Zu kurz zum Mitfuehlen darf der Einzaehler nicht werden. Bleibt vor
   * einem Auftakt nur ein Klick (drei Viertel Auftakt im 4/4-Takt), kommt
   * ein ganzer Takt davor. Ohne Auftakt wird der Zweiertakt zweimal
   * gezaehlt: zwei Klicks allein tragen kein Tempo.
   *
   * Der letzte Klick des Einzaehlers ist das gruene GO. `punkt` ist die
   * Zaehlzeit im Takt, 0 ist die Eins — es gibt so viele Punkte, wie der
   * Takt Schlaege hat.
   *
   * `auftakte[k]` sagt, ob der k-te Takt der Folge ein Auftakt ist. Das
   * gilt nicht nur ganz am Anfang: springt eine Wiederholung an den
   * Anfang zurueck, kommt der Auftakt mitten im Lied wieder und ergaenzt
   * den verkuerzten Schlusstakt zu einem ganzen. Er wird dann vom
   * Taktende her gezaehlt — sonst stolpert das Metronom an genau der
   * Stelle, an der das Kind am meisten Halt braucht. */
  function klicks(folge, laengen, starts, ta, auftakte) {
    var aus = [];
    var n0 = schlaegeJeTakt(ta[folge[0]]);
    var auftakt = auftakte[0] ? laengen[0] : 0;
    var mindestens = auftakt ? 2 : 3;
    var rasterBeginn = auftakt ? auftakt - n0 : 0;     // wo der Auftakttakt beginnen wuerde
    var beginn = rasterBeginn - (auftakt ? 0 : n0);
    while (Math.ceil(-beginn - 1e-6) < mindestens) { beginn -= n0; }
    for (var t = beginn; t < -1e-6; t += 1) {
      var imTakt = ((Math.round((t - rasterBeginn) * 1000) / 1000) % n0 + n0) % n0;
      aus.push({ schlag: t, betont: Math.abs(imTakt) < 1e-6, punkt: Math.round(imTakt) % n0, vor: true });
    }
    if (aus.length) { aus[aus.length - 1].go = true; }

    folge.forEach(function (b, k) {
      var n = schlaegeJeTakt(ta[b]);
      var l = laengen[k];
      var versatz = auftakte[k] ? n - l : 0;          // ein Auftakt steht am Taktende
      /* Geklickt wird nur auf ganzen Zaehlzeiten. Ein Auftakt von einem
       * Achtel im 4/4-Takt liegt ganz zwischen zwei Schlaegen — dann
       * klickt es darin gar nicht. */
      var erster = Math.ceil(versatz - 1e-6) - versatz;
      for (var x = erster; x < l - 1e-6; x += 1) {
        var zz = Math.round(x + versatz) % n;
        aus.push({ schlag: starts[k] + x, betont: zz === 0, punkt: zz });
      }
    });
    return aus;
  }

  /** Die Toene, die in einer Stimme vorkommen. */
  function toeneDerStimme(stueck, stimme) {
    var t = {};
    stueck.stimmen[Math.min(stimme || 0, stueck.stimmen.length - 1)].takte.forEach(function (takt) {
      takt.n.forEach(function (n) { if (n.t) { t[n.t] = true; } });
    });
    return Object.keys(t);
  }

  return {
    melodie: melodie,
    zeilen: zeilen,
    zeileVon: zeileVon,
    spielfolge: spielfolge,
    taktarten: taktarten,
    nurPause: nurPause,
    toeneDerStimme: toeneDerStimme,
    TICKS: TICKS
  };
});
