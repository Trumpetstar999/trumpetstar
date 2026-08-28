/* eltern.js — der einzige Ort in der App, an dem Text stehen darf.
 *
 * Erreichbar ueber genau eine versteckte Geste: zwei Sekunden mit zwei
 * Fingern in die obere rechte Bildschirmecke druecken. Das ist die
 * einzige Stelle, an der die App mehr als einen einfachen Fingertipp
 * verlangt.
 */
(function (root) {
  'use strict';

  var ECKE = 0.22;      // Anteil der Bildschirmbreite/-hoehe
  var DAUER = 2000;

  function Eltern(k) {
    this.k = k;
    this.wurzel = document.getElementById('eltern');
    this.uhr = null;
    this.offen = false;
    this.mikroUhr = null;
    this._geste();
    this._knoepfe();
  }

  Eltern.prototype._geste = function () {
    var selbst = this;
    function inEcke(t) {
      return t.clientX > root.innerWidth * (1 - ECKE) && t.clientY < root.innerHeight * ECKE;
    }
    document.addEventListener('touchstart', function (e) {
      if (selbst.offen) { return; }
      if (e.touches.length !== 2) { selbst._abbrechen(); return; }
      if (!inEcke(e.touches[0]) || !inEcke(e.touches[1])) { selbst._abbrechen(); return; }
      selbst.uhr = setTimeout(function () { selbst.oeffnen(); }, DAUER);
    }, { passive: true });
    document.addEventListener('touchend', function () { selbst._abbrechen(); }, { passive: true });
    document.addEventListener('touchcancel', function () { selbst._abbrechen(); }, { passive: true });

    // Am Rechner: dieselbe Ecke mit gedrueckter Alt-Taste
    document.addEventListener('mousedown', function (e) {
      if (selbst.offen || !e.altKey) { return; }
      if (!inEcke(e)) { return; }
      selbst.uhr = setTimeout(function () { selbst.oeffnen(); }, DAUER);
    });
    document.addEventListener('mouseup', function () { selbst._abbrechen(); });
  };

  Eltern.prototype._abbrechen = function () {
    if (this.uhr) { clearTimeout(this.uhr); this.uhr = null; }
  };

  Eltern.prototype._knoepfe = function () {
    var selbst = this;

    /* Der sichtbare Weg fuer die Eltern: das Zahnrad auf dem
     * Auswahlbildschirm. Die versteckte Geste bleibt daneben bestehen. */
    var zahnrad = document.getElementById('elternknopf');
    if (zahnrad) { this.k.tippBinden(zahnrad, function () { selbst.oeffnen(); }); }

    var automatik = document.getElementById('eltern-automatik');
    if (automatik) {
      automatik.addEventListener('click', function () {
        selbst.k.fortschritt.automatik();
        selbst._fuellen();
      });
    }
    var reihe = document.getElementById('eltern-stimmung');
    [].slice.call(reihe.querySelectorAll('button')).forEach(function (b) {
      b.addEventListener('click', function () {
        selbst.k.fortschritt.setzeStimmung(b.getAttribute('data-art'));
        selbst.k.stimmungAnwenden();
        selbst._stimmungZeigen();
      });
    });
    var start = document.getElementById('eltern-startton');
    if (start) {
      [].slice.call(start.querySelectorAll('button')).forEach(function (b) {
        b.addEventListener('click', function () {
          selbst.k.fortschritt.setzeStartton(b.getAttribute('data-start'));
          selbst._fuellen();
        });
      });
    }

    this._klangprobe();

    document.getElementById('eltern-zu').addEventListener('click', function () { selbst.schliessen(); });
    document.getElementById('eltern-reset').addEventListener('click', function () {
      selbst.k.fortschritt.zuruecksetzen();
      selbst._fuellen();
    });
  };

  /** Klangprobe: alle Trompetentoene einzeln zum Anhoeren. */
  Eltern.prototype._klangprobe = function () {
    var selbst = this;
    var wahl = document.getElementById('eltern-klang-ton');
    var knopf = document.getElementById('eltern-klang-hoeren');
    if (!wahl || !knopf) { return; }

    var toene = this.k.toene || [];
    wahl.innerHTML = '';
    toene.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      var tier = (t.tierName || '').split('/')[0].trim();
      o.textContent = t.id + (tier ? ' — ' + tier : '');
      wahl.appendChild(o);
    });

    function hoeren() {
      var motor = selbst.k.motor;
      if (!motor) { return; }
      var spielen = function () { motor.spieleTon(wahl.value, { dauer: 1.6 }); };
      if (motor.aufwecken) {
        var p = motor.aufwecken();
        if (p && p.then) { p.then(spielen, spielen); } else { spielen(); }
      } else {
        spielen();
      }
    }

    knopf.addEventListener('click', hoeren);
    wahl.addEventListener('change', hoeren);
  };


  Eltern.prototype.oeffnen = function () {
    this._abbrechen();
    this.offen = true;
    this.k.bildschirm('eltern');
    this._fuellen();
    var selbst = this;
    this.mikroUhr = setInterval(function () { selbst._mikro(); }, 120);
  };

  Eltern.prototype.schliessen = function () {
    this.offen = false;
    if (this.mikroUhr) { clearInterval(this.mikroUhr); this.mikroUhr = null; }
    this.k.bildschirm('auswahl');
  };

  Eltern.prototype._stimmungZeigen = function () {
    var jetzt = this.k.fortschritt.stimmung();
    var reihe = document.getElementById('eltern-stimmung');
    [].slice.call(reihe.querySelectorAll('button')).forEach(function (b) {
      b.className = (b.getAttribute('data-art') === jetzt) ? 'an' : '';
    });
  };

  Eltern.prototype._starttonZeigen = function () {
    var jetzt = this.k.fortschritt.startton();
    var reihe = document.getElementById('eltern-startton');
    if (!reihe) { return; }
    [].slice.call(reihe.querySelectorAll('button')).forEach(function (b) {
      b.className = (b.getAttribute('data-start') === jetzt) ? 'an' : '';
    });
  };


  Eltern.prototype._fuellen = function () {
    var selbst = this;
    this._stimmungZeigen();
    this._starttonZeigen();

    var koerper = document.querySelector('#eltern-quoten tbody');
    koerper.innerHTML = '';
    this.k.fortschritt.bericht().forEach(function (z) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="tonpunkt" style="background:' + z.farbe + '"></span></td>' +
        '<td>' + z.id + (z.imVorrat ? '' : ' (noch nicht dabei)') + '</td>' +
        '<td class="zahl">' + (z.quote === null ? '–' : Math.round(z.quote * 100) + ' %') + '</td>' +
        '<td class="zahl">' + z.treffer + ' / ' + z.versuche + '</td>' +
        '<td class="zahl">' + (z.sitzt ? 'sitzt' : '') + '</td>';
      koerper.appendChild(tr);
    });

    this._tonumfang();
  };

  /** Tonumfang: jeder Ton ein eigener Schalter. */
  Eltern.prototype._tonumfang = function () {
    var selbst = this;
    var reihe = document.getElementById('eltern-vorrat');
    reihe.innerHTML = '';
    var vorrat = this.k.fortschritt.vorrat();

    this.k.fortschritt.reihenfolge().forEach(function (t) {

      var drin = vorrat.indexOf(t.id) >= 0;
      var b = document.createElement('button');
      b.className = drin ? 'an' : '';
      b.setAttribute('data-ton', t.id);
      b.innerHTML =
        '<span class="punktchen" style="background:' + t.farbe + '"></span>' +
        '<span>' + t.id + '</span>' +
        '<span class="zustand">' + (drin ? 'dabei' : 'aus') + '</span>';
      // Der letzte verbliebene Ton bleibt an: ohne Ton gibt es nichts zu ueben.
      if (drin && vorrat.length === 1) { b.disabled = true; }
      b.addEventListener('click', function () {
        selbst.k.fortschritt.tonUmschalten(t.id);
        selbst._fuellen();
      });
      reihe.appendChild(b);
    });

    var automatik = document.getElementById('eltern-automatik');
    var hand = this.k.fortschritt.handbetrieb();
    if (automatik) { automatik.disabled = !hand; }
    var hinweis = document.getElementById('eltern-vorrat-hinweis');
    if (hinweis) {
      hinweis.textContent = hand
        ? 'Von Hand gewählt: ' + vorrat.join(', ') +
          '. Die App schaltet zurzeit keine Töne selbst dazu.'
        : 'Automatisch: die App nimmt einen neuen Ton dazu, sobald der letzte sitzt. '
          + 'Zurzeit ' + vorrat.join(', ') + '.';
    }
  };

  /** Live-Ansicht des Mikrofons, um Kalibrierungsprobleme zu finden. */
  Eltern.prototype._mikro = function () {
    var t = this.k.tracker;
    var frames = t.frames();
    var f = frames[frames.length - 1];
    var setz = function (id, wert) { document.getElementById(id).textContent = wert; };
    document.getElementById('mikro-weg').textContent = this.k.motor.weg || '–';
    if (!f) { return; }

    var k = f.freq ? t.naechsterTon(f.freq) : null;
    setz('mikro-ton', (f.above && k && f.clarity >= this.k.erkennung.clarityMin)
      ? (k.tonId + (k.oktave ? ' (überblasen)' : '')) : '–');
    setz('mikro-hz', f.freq ? f.freq.toFixed(1) + ' Hz' : '–');
    setz('mikro-cent', (f.above && k && f.clarity >= this.k.erkennung.clarityMin)
      ? (k.cents >= 0 ? '+' : '') + k.cents.toFixed(0) + ' Cent' : '–');
    setz('mikro-db', f.db.toFixed(1) + ' dB');
    setz('mikro-gate', f.gateDb != null ? f.gateDb.toFixed(1) + ' dB' : '–');

    var anteil = Math.max(0, Math.min(1, (f.db + 70) / 70));
    var balken = document.querySelector('#mikro-balken i');
    balken.style.width = (anteil * 100) + '%';
    balken.style.background = f.above ? '#6BBF3A' : '#C8BBA4';
  };

  root.Eltern = Eltern;
})(typeof globalThis !== 'undefined' ? globalThis : this);
