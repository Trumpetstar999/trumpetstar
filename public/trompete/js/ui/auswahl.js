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
    var vorrat = this.k.fortschritt.vorrat();
    var zuletzt = this.k.fortschritt.letztesLevel();
    var selbst = this;

    this.karten.forEach(function (karte) {
      var level = karte.getAttribute('data-level');
      var toene = level === '1' ? vorrat
        : (vorrat.length >= 2 ? vorrat : selbst.k.einfachsteToene(2));

      /* Punktreihe: so sieht sie, was sie erwartet */
      var reihe = karte.querySelector('.karte-punkte');
      reihe.innerHTML = '';
      toene.forEach(function (id) {
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
          toene: selbst.k.tonKarte, einzelTon: toene[0],
          breitePx: b, hoehePx: h, markerIndex: -1
        });
      } else {
        var m = root.Generator.erzeuge({
          toene: selbst.k.toene, vorratIds: toene, stufe: level, seed: 20250821
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
