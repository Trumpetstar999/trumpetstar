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
    var strenge = document.getElementById('eltern-schwierigkeit');
    if (strenge) {
      [].slice.call(strenge.querySelectorAll('button')).forEach(function (b) {
        b.addEventListener('click', function () {
          selbst.k.fortschritt.setzeSchwierigkeit(b.getAttribute('data-art'));
          selbst.k.schwierigkeitAnwenden();
          selbst._strengeZeigen();
        });
      });
    }
    /* Instrument: Trompete in B, Horn in F, Horn in Es, Tenorhorn.
     *
     * Danach laedt die App neu. Daran haengen die klingenden Frequenzen
     * aller Toene, der Hoerbereich der Erkennung, der Klang und das
     * Griffbild — ein halber Wechsel waere schlimmer als ein kurzer
     * Neustart. Der Fortschritt liegt im Speicher des Geraets. */
    var instrumentreihe = document.getElementById('eltern-instrument');
    if (instrumentreihe) {
      [].slice.call(instrumentreihe.querySelectorAll('button')).forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-instrument');
          if (id === root.Instrument.id()) { return; }
          root.Instrument.setzen(id);
          root.location.reload();
        });
      });
    }

    var farbreihe = document.getElementById('eltern-notenfarbe');
    if (farbreihe) {
      [].slice.call(farbreihe.querySelectorAll('button')).forEach(function (b) {
        b.addEventListener('click', function () {
          selbst.k.fortschritt.setzeNotenfarbe(b.getAttribute('data-art'));
          selbst.k.notenfarbeAnwenden();
          selbst._notenfarbeZeigen();
        });
      });
    }
    var buchreihe = document.getElementById('eltern-buchnotenfarbe');
    if (buchreihe) {
      [].slice.call(buchreihe.querySelectorAll('button')).forEach(function (b) {
        b.addEventListener('click', function () {
          selbst.k.fortschritt.setzeBuchNotenfarbe(b.getAttribute('data-art'));
          selbst._notenfarbeZeigen();
        });
      });
    }
    /* Die drei Flaggen. Sie schalten nur den Elternbereich um — das
     * Kind sieht in dieser App ohnehin keinen einzigen Satz. */
    var sprachreihe = document.getElementById('sprachwahl');
    if (sprachreihe) {
      [].slice.call(sprachreihe.querySelectorAll('button')).forEach(function (b) {
        b.addEventListener('click', function () {
          selbst.k.fortschritt.setzeSprache(b.getAttribute('data-sprache'));
          root.Sprachen.setzen(selbst.k.fortschritt.sprache());
          selbst._fuellen();          // Tabelle und Hinweise neu schreiben
        });
      });
    }

    document.getElementById('eltern-zu').addEventListener('click', function () { selbst.schliessen(); });
    document.getElementById('eltern-reset').addEventListener('click', function () {
      selbst.k.fortschritt.zuruecksetzen();
      selbst._fuellen();
    });
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
    /* Neu aufbauen: auf den Karten stehen Noten, und die koennen sich
     * gerade in der Farbe geaendert haben. */
    if (this.k.auswahl) { this.k.auswahl.aufbauen(); }
  };

  Eltern.prototype._strengeZeigen = function () {
    var jetzt = this.k.fortschritt.schwierigkeit();
    var reihe = document.getElementById('eltern-schwierigkeit');
    if (!reihe) { return; }
    [].slice.call(reihe.querySelectorAll('button')).forEach(function (b) {
      b.className = (b.getAttribute('data-art') === jetzt) ? 'an' : '';
    });
  };

  Eltern.prototype._instrumentZeigen = function () {
    var jetzt = root.Instrument.id();
    var reihe = document.getElementById('eltern-instrument');
    if (!reihe) { return; }
    [].slice.call(reihe.querySelectorAll('button')).forEach(function (b) {
      var an = b.getAttribute('data-instrument') === jetzt;
      b.className = an ? 'an' : '';
      b.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
  };

  Eltern.prototype._notenfarbeZeigen = function () {
    var f = this.k.fortschritt;
    [['eltern-notenfarbe', f.notenfarbe()], ['eltern-buchnotenfarbe', f.buchNotenfarbe()]].forEach(function (paar) {
      var reihe = document.getElementById(paar[0]);
      if (!reihe) { return; }
      [].slice.call(reihe.querySelectorAll('button')).forEach(function (b) {
        b.className = (b.getAttribute('data-art') === paar[1]) ? 'an' : '';
      });
    });
  };

  Eltern.prototype._spracheZeigen = function () {
    var jetzt = root.Sprachen.jetzt();
    var reihe = document.getElementById('sprachwahl');
    if (!reihe) { return; }
    [].slice.call(reihe.querySelectorAll('button')).forEach(function (b) {
      var an = b.getAttribute('data-sprache') === jetzt;
      b.className = an ? 'an' : '';
      b.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
  };

  Eltern.prototype._fuellen = function () {
    var selbst = this;
    this._spracheZeigen();
    this._strengeZeigen();
    this._notenfarbeZeigen();
    var koerper = document.querySelector('#eltern-quoten tbody');
    koerper.innerHTML = '';
    this.k.fortschritt.bericht().forEach(function (z) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="tonpunkt" style="background:' + z.farbe + '"></span></td>' +
        '<td>' + root.Sprachen.ton(z.id) +
          (z.imVorrat ? '' : ' ' + root.Sprachen.t('tab.nichtDabei', '(noch nicht dabei)')) + '</td>' +
        '<td class="zahl">' + (z.quote === null ? '–' : Math.round(z.quote * 100) + ' %') + '</td>' +
        '<td class="zahl">' + z.treffer + ' / ' + z.versuche + '</td>' +
        '<td class="zahl">' + (z.sitzt ? root.Sprachen.t('tab.sitzt', 'sitzt') : '') + '</td>';
      koerper.appendChild(tr);
    });

    this._tonumfang();
  };

  /** Tonumfang: jeder Ton ein eigener Schalter. */
  Eltern.prototype._tonumfang = function () {
    var selbst = this;
    var reihe = document.getElementById('eltern-vorrat');
    reihe.innerHTML = '';
    var vorrat = this.k.fortschritt.vorratGesamt();

    this.k.toene.slice().sort(function (a, b) {
      return a.freischaltReihenfolge - b.freischaltReihenfolge;
    }).forEach(function (t) {
      var drin = vorrat.indexOf(t.id) >= 0;
      var b = document.createElement('button');
      b.className = drin ? 'an' : '';
      b.setAttribute('data-ton', t.id);
      b.innerHTML =
        '<span class="punktchen" style="background:' + t.farbe + '"></span>' +
        '<span>' + root.Sprachen.ton(t.id) + '</span>' +
        '<span class="zustand">' +
          (drin ? root.Sprachen.t('ton.dabei', 'dabei') : root.Sprachen.t('ton.aus', 'aus')) +
        '</span>';
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
      var liste = vorrat.map(function (id) { return root.Sprachen.ton(id); }).join(', ');
      hinweis.textContent = (hand
        ? root.Sprachen.t('vorrat.hand',
            'Von Hand gewählt: {liste}. Die App schaltet zurzeit keine Töne selbst dazu.')
        : root.Sprachen.t('vorrat.auto',
            'Automatisch: die App nimmt einen neuen Ton dazu, sobald der letzte sitzt. '
            + 'Zurzeit {liste}.')
      ).replace('{liste}', liste);
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
      ? (root.Sprachen.ton(k.tonId) +
         (k.oktave ? ' ' + root.Sprachen.t('mikro.naturton', '(anderer Naturton)') : '')) : '–');
    setz('mikro-hz', f.freq ? f.freq.toFixed(1) + ' Hz' : '–');
    setz('mikro-cent', (f.above && k && f.clarity >= this.k.erkennung.clarityMin)
      ? (k.cents >= 0 ? '+' : '') + k.cents.toFixed(0) + ' ' +
        root.Sprachen.t('einheit.cent', 'Cent') : '–');
    setz('mikro-db', f.db.toFixed(1) + ' dB');
    setz('mikro-gate', f.gateDb != null ? f.gateDb.toFixed(1) + ' dB' : '–');

    var anteil = Math.max(0, Math.min(1, (f.db + 70) / 70));
    var balken = document.querySelector('#mikro-balken i');
    balken.style.width = (anteil * 100) + '%';
    balken.style.background = f.above ? '#6BBF3A' : '#C8BBA4';
  };

  root.Eltern = Eltern;
})(typeof globalThis !== 'undefined' ? globalThis : this);
