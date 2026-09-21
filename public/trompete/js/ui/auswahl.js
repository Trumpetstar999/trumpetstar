/* auswahl.js — die Level-Auswahl.
 *
 * Drei grosse Bilder, kein Text, keine Zahl, keine Ueberschrift.
 * Oben auf jeder Karte eine Reihe farbiger Punkte: die Toene, die
 * darin vorkommen. Alle drei sind jederzeit anwaehlbar.
 */
(function (root) {
  'use strict';

  function Auswahl(k) {
    this.k = k;
    this.wurzel = document.getElementById('auswahl');
    this.karten = [].slice.call(this.wurzel.querySelectorAll('.karte'));
    var selbst = this;
    this.karten.forEach(function (karte) {
      // ueber tippBinden, damit ein aufliegender Handballen nichts ausloest
      selbst.k.tippBinden(karte, function () {
        selbst.k.levelStarten(karte.getAttribute('data-level'));
      });
    });
  }

  Auswahl.prototype.aufbauen = function () {
    /* Die Karten kommen jedes Mal neu herein, auch beim Rueckweg vom
     * Ueben. Eine CSS-Animation laeuft nur beim ersten Mal von selbst;
     * damit sie wieder anlaeuft, muss die Klasse ab und der Browser
     * dazwischen einmal rechnen (offsetWidth). */
    var reihe = this.wurzel.querySelector('.karten');
    if (reihe) {
      reihe.classList.remove('kommen');
      void reihe.offsetWidth;
      reihe.classList.add('kommen');
    }

    var zuletzt = this.k.fortschritt.letztesLevel();
    var selbst = this;

    this.karten.forEach(function (karte) {
      var level = karte.getAttribute('data-level');
      /* Die Buch-Karte zeigt den Umschlag und sonst nichts: sie hat
       * keinen Tonvorrat, den man vorhersagen koennte — im Buch steht,
       * was im Buch steht. Ohne data/buch.json steht sie gar nicht da;
       * eine Karte, die ins Leere fuehrt, ist schlimmer als keine. */
      if (level === 'buch') {
        karte.hidden = !selbst.k.buch;
        karte.classList.toggle('zuletzt', zuletzt === level);
        return;
      }
      /* Jede Karte zeigt den Vorrat IHRES Bereichs: Level 1 hat einen
       * eigenen, Level 2 und 3 teilen sich den zweiten. Die Punktreihe
       * oben auf der Karte sagt damit vorher, was einen erwartet. */
      var vorrat = selbst.k.fortschritt.vorrat(level);

      /* Punktreihe: so sieht sie, was sie erwartet.
       *
       * Hier steht der Vorrat selbst und nichts Aufgefuelltes. Frueher
       * bekamen die Rhythmus-Karten bei nur einem Ton zwei Punkte
       * angezeigt, damit das Beispielbild bunter aussieht — die Uebung
       * enthielt dann aber trotzdem nur den einen. Seit Level 2 seinen
       * eigenen Fortschritt hat, faengt jedes Kind dort mit einem Ton
       * an; aus einer Kleinigkeit am Rand waere damit die Regel
       * geworden. Die Punkte muessen sagen, was wirklich kommt. */
      var reihe = karte.querySelector('.karte-punkte');
      reihe.innerHTML = '';
      vorrat.forEach(function (id) {
        var i = document.createElement('i');
        i.style.backgroundColor = selbst.k.tonById(id).farbe;
        reihe.appendChild(i);
      });

      /* Beispielbild: eine Note, zwei Takte, vier Takte */
      var svg = karte.querySelector('.karte-noten');
      var kasten = karte.querySelector('.karte-bild');
      var b = kasten.clientWidth || 240, h = kasten.clientHeight || 200;
      if (level === '1') {
        root.Noten.zeichne(svg, {
          toene: selbst.k.tonKarte, einzelTon: vorrat[0],
          breitePx: b, hoehePx: h, markerIndex: -1
        });
      } else {
        var m = root.Generator.erzeuge({
          toene: selbst.k.toene, vorratIds: vorrat, stufe: level, seed: 20250821
        });
        if (m) {
          root.Noten.zeichne(svg, {
            toene: selbst.k.tonKarte, melodie: m,
            breitePx: b, hoehePx: h, markerIndex: -1,
            violinschluessel: false, taktstriche: true
          });
        }
      }

      karte.classList.toggle('zuletzt', zuletzt === level);
    });
  };

  root.Auswahl = Auswahl;
})(typeof globalThis !== 'undefined' ? globalThis : this);
