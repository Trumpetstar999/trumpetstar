/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/ui/einstellungen.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* einstellungen.js — Tonmaterial, Notenbild, Strenge, Stimmgeraet,
 * Trefferquoten und ein paar Dinge, die man wissen sollte.
 *
 * Erreichbar von der Uebersicht: ueber "Einstellungen" und ueber die
 * Anzeige des Tonmaterials daneben.
 */
(function (root) {
  'use strict';

  var T = function (s, u, w) { return root.Sprachen.t(s, u, w); };

  /* Tonarten als Tonvorrat — notiert, wie alles in dieser App. Die
   * Namen sind die deutschen Tonnamen ohne Oktave; gewaehlt wird damit
   * aus der Tabelle genau die Schreibweise, die zur Tonart gehoert:
   * in A-Dur das gis, in Es-Dur das as. */
  var TONARTEN = [
    { id: 'C',  name: 'C-Dur / a-Moll',    toene: ['c', 'd', 'e', 'f', 'g', 'a', 'h'] },
    { id: 'G',  name: 'G-Dur / e-Moll',    toene: ['g', 'a', 'h', 'c', 'd', 'e', 'fis'] },
    { id: 'D',  name: 'D-Dur / h-Moll',    toene: ['d', 'e', 'fis', 'g', 'a', 'h', 'cis'] },
    { id: 'A',  name: 'A-Dur / fis-Moll',  toene: ['a', 'h', 'cis', 'd', 'e', 'fis', 'gis'] },
    { id: 'F',  name: 'F-Dur / d-Moll',    toene: ['f', 'g', 'a', 'b', 'c', 'd', 'e'] },
    { id: 'B',  name: 'B-Dur / g-Moll',    toene: ['b', 'c', 'd', 'es', 'f', 'g', 'a'] },
    { id: 'Es', name: 'Es-Dur / c-Moll',   toene: ['es', 'f', 'g', 'as', 'b', 'c', 'd'] },
    { id: 'As', name: 'As-Dur / f-Moll',   toene: ['as', 'b', 'c', 'des', 'es', 'f', 'g'] },
    { id: 'kreuz', name: 'Chromatisch (Kreuze)',
      toene: ['c', 'cis', 'd', 'dis', 'e', 'f', 'fis', 'g', 'gis', 'a', 'ais', 'h'] },
    { id: 'be', name: 'Chromatisch (Bes)',
      toene: ['c', 'des', 'd', 'es', 'e', 'f', 'ges', 'g', 'as', 'a', 'b', 'h'] }
  ];
  var OKTAVEN = ['Kleine Oktave', 'Eingestrichene Oktave', 'Zweigestrichene Oktave'];

  function Einstellungen(k) {
    this.k = k;
    this.wurzel = document.getElementById('einstellungen');
    this.offen = false;
    this.mikroUhr = null;
    this.resetUhr = null;
    this._knoepfe();
  }

  /** Die Toene einer Tonart zwischen zwei Tonhoehen (notiert, MIDI). */
  Einstellungen.prototype.tonartToene = function (tonartId, vonMidi, bisMidi) {
    var art = TONARTEN.filter(function (t) { return t.id === tonartId; })[0] || TONARTEN[0];
    var tief = Math.min(vonMidi, bisMidi), hoch = Math.max(vonMidi, bisMidi);
    return this.k.toene.filter(function (t) {
      return t.notiertMidi >= tief && t.notiertMidi <= hoch && art.toene.indexOf(t.name) >= 0;
    }).map(function (t) { return t.id; });
  };

  Einstellungen.prototype._knoepfe = function () {
    var selbst = this, k = this.k;

    function reihe(id, merkmal, aktion) {
      [].slice.call(document.getElementById(id).querySelectorAll('button')).forEach(function (b) {
        b.addEventListener('click', function () { aktion(b.getAttribute(merkmal)); selbst._fuellen(); });
      });
    }
    reihe('wahl-strenge', 'data-art', function (art) {
      k.fortschritt.setzeSchwierigkeit(art);
      k.schwierigkeitAnwenden();
    });
    reihe('wahl-notenfarbe', 'data-art', function (art) {
      k.fortschritt.setzeNotenfarbe(art);
      k.notenfarbeAnwenden();
    });
    reihe('wahl-hilfen', 'data-hilfe', function (name) {
      k.fortschritt.setzeHilfe(name, !k.fortschritt.hilfe(name));
    });
    reihe('sprachwahl', 'data-sprache', function (code) {
      k.fortschritt.setzeSprache(code);
      root.Sprachen.setzen(k.fortschritt.sprache());
      selbst._auswahllisten();          // Tonnamen und Tonarten heissen jetzt anders
    });

    document.getElementById('material-setzen').addEventListener('click', function () {
      var ids = selbst.tonartToene(
        document.getElementById('material-tonart').value,
        parseInt(document.getElementById('material-von').value, 10),
        parseInt(document.getElementById('material-bis').value, 10));
      if (ids.length) { k.fortschritt.setzeVorrat(ids); }
      selbst._fuellen();
    });
    document.getElementById('material-automatik').addEventListener('click', function () {
      k.fortschritt.automatik();
      selbst._fuellen();
    });

    /* Zuruecksetzen braucht zwei Tipps: der erste fragt nach. */
    var reset = document.getElementById('zuruecksetzen');
    reset.addEventListener('click', function () {
      if (!reset.classList.contains('sicher')) {
        reset.classList.add('sicher');
        reset.textContent = T('statistik.sicher', 'Wirklich alles zurücksetzen?');
        selbst.resetUhr = setTimeout(function () { selbst._resetRuhe(); }, 4000);
        return;
      }
      k.fortschritt.zuruecksetzen();
      k.schwierigkeitAnwenden();
      k.notenfarbeAnwenden();
      selbst._resetRuhe();
      selbst._auswahllisten();
      selbst._fuellen();
    });

    document.getElementById('einstellungen-zu').addEventListener('click', function () { selbst.schliessen(); });
  };

  Einstellungen.prototype._resetRuhe = function () {
    var reset = document.getElementById('zuruecksetzen');
    if (this.resetUhr) { clearTimeout(this.resetUhr); this.resetUhr = null; }
    reset.classList.remove('sicher');
    reset.textContent = T('statistik.reset', 'Fortschritt zurücksetzen');
  };

  Einstellungen.prototype.oeffnen = function () {
    this.offen = true;
    this.k.bildschirm('einstellungen');
    this.wurzel.scrollTop = 0;
    this._auswahllisten();
    this._fuellen();
    var selbst = this;
    this.mikroUhr = setInterval(function () { selbst._mikro(); }, 120);
  };

  Einstellungen.prototype.schliessen = function () {
    this.offen = false;
    if (this.mikroUhr) { clearInterval(this.mikroUhr); this.mikroUhr = null; }
    this._resetRuhe();
    this.k.bildschirm('auswahl');
    /* Neu aufbauen: auf den Karten stehen Noten und Tonmaterial, und
     * beides kann sich gerade geaendert haben. */
    this.k.auswahl.aufbauen();
  };

  Einstellungen.prototype._an = function (id, merkmal, pruefung) {
    [].slice.call(document.getElementById(id).querySelectorAll('button')).forEach(function (b) {
      var an = pruefung(b.getAttribute(merkmal));
      b.classList.toggle('an', an);
      b.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
  };

  /** Tonart, von, bis — die drei Auswahllisten ueber dem Tonmaterial. */
  Einstellungen.prototype._auswahllisten = function () {
    var k = this.k;
    var tonart = document.getElementById('material-tonart');
    var gewaehlt = tonart.value || 'C';
    tonart.innerHTML = '';
    TONARTEN.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      o.textContent = T('tonart.' + t.id, t.name);
      if (t.id === gewaehlt) { o.selected = true; }
      tonart.appendChild(o);
    });

    /* von/bis: eine Zeile je TONHOEHE. Wie sie geschrieben wird,
     * entscheidet die Tonart. */
    var hoehen = root.Tracker.hoehen(k.toene);     // die Tabelle steigt nach Tonhoehe an
    var vorrat = k.nachHoehe(k.fortschritt.vorratGesamt()).map(k.tonById);
    [['material-von', vorrat[0].notiertMidi],
     ['material-bis', Math.max(vorrat[vorrat.length - 1].notiertMidi, vorrat[0].notiertMidi + 7)]
    ].forEach(function (paar) {
      var feld = document.getElementById(paar[0]);
      var vorher = feld.value ? parseInt(feld.value, 10) : paar[1];
      feld.innerHTML = '';
      hoehen.forEach(function (t) {
        var o = document.createElement('option');
        o.value = String(t.notiertMidi);
        var zwilling = k.toene.filter(function (x) { return x.wie === t.id; })[0];
        o.textContent = root.Sprachen.ton(t.id) + (zwilling ? ' / ' + root.Sprachen.ton(zwilling.id) : '');
        if (t.notiertMidi === vorher) { o.selected = true; }
        feld.appendChild(o);
      });
    });
  };

  Einstellungen.prototype._fuellen = function () {
    var k = this.k;
    this._an('sprachwahl', 'data-sprache', function (c) { return c === root.Sprachen.jetzt(); });
    this._an('wahl-strenge', 'data-art', function (a) { return a === k.fortschritt.schwierigkeit(); });
    this._an('wahl-notenfarbe', 'data-art', function (a) { return a === k.fortschritt.notenfarbe(); });
    this._an('wahl-hilfen', 'data-hilfe', function (n) { return k.fortschritt.hilfe(n); });
    this._tonmaterial();
    this._statistik();
  };

  /** Tonmaterial: jeder Ton ein eigener Schalter, nach Lage gruppiert. */
  Einstellungen.prototype._tonmaterial = function () {
    var selbst = this, k = this.k;
    var feld = document.getElementById('material-toene');
    feld.innerHTML = '';
    var vorrat = k.fortschritt.vorratGesamt();
    var alle = k.nachHoehe(k.toene.map(function (t) { return t.id; })).map(k.tonById);

    [0, 1, 2].forEach(function (oktave) {
      var gruppe = document.createElement('div');
      gruppe.className = 'tongruppe';
      var kopf = document.createElement('div');
      kopf.className = 'tongruppe-name';
      kopf.textContent = T('oktave.' + oktave, OKTAVEN[oktave]);
      var reihe = document.createElement('div');
      reihe.className = 'tonwahl';
      gruppe.appendChild(kopf);
      gruppe.appendChild(reihe);

      alle.filter(function (t) { return t.oktave === oktave; }).forEach(function (t) {
        var drin = vorrat.indexOf(t.id) >= 0;
        var b = document.createElement('button');
        b.className = (drin ? 'an' : '') + (t.vorzeichen ? ' vz' : '') + (t.wie ? ' zwilling' : '');
        b.setAttribute('data-ton', t.id);
        b.setAttribute('aria-pressed', drin ? 'true' : 'false');
        b.textContent = root.Sprachen.ton(t.id);
        // Der letzte verbliebene Ton bleibt an: ohne Ton gibt es nichts zu ueben.
        if (drin && vorrat.length === 1) { b.disabled = true; }
        b.addEventListener('click', function () {
          k.fortschritt.tonUmschalten(t.id);
          selbst._fuellen();
        });
        reihe.appendChild(b);
      });
      feld.appendChild(gruppe);
    });

    var hand = k.fortschritt.handbetrieb();
    document.getElementById('material-automatik').disabled = !hand;
    var liste = k.nachHoehe(vorrat).map(root.Sprachen.ton).join(', ');
    document.getElementById('material-stand').textContent = hand
      ? T('material.hand', 'Von Hand gewählt: {liste}.', { liste: liste })
      : T('material.auto',
          'Automatisch: Ein neuer Ton kommt dazu, sobald die bisherigen sitzen. Zurzeit {liste}.',
          { liste: liste });
  };

  /** Trefferquoten — nur fuer Toene, die dabei sind oder schon versucht wurden. */
  Einstellungen.prototype._statistik = function () {
    var k = this.k;
    var koerper = document.querySelector('#statistik tbody');
    koerper.innerHTML = '';
    var lage = {};
    k.toene.forEach(function (t) { lage[t.id] = t.notiertMidi * 10 + (t.wie ? 1 : 0); });
    var zeilen = k.fortschritt.bericht().filter(function (z) { return z.imVorrat || z.versuche > 0; })
      .sort(function (a, b) { return lage[a.id] - lage[b.id]; });
    var versuche = 0;
    zeilen.forEach(function (z) {
      versuche += z.versuche;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + root.Sprachen.ton(z.id) +
          (z.imVorrat ? '' : ' <small>' + T('tab.nichtDabei', '(nicht im Tonmaterial)') + '</small>') + '</td>' +
        '<td class="balkenzelle"><span class="quotenbalken"><i style="width:' +
          (z.quote === null ? 0 : Math.round(z.quote * 100)) + '%"></i></span></td>' +
        '<td class="zahl">' + (z.quote === null ? '–' : Math.round(z.quote * 100) + ' %') + '</td>' +
        '<td class="zahl">' + z.treffer + ' / ' + z.versuche + '</td>' +
        '<td class="zahl">' + (z.sitzt ? T('tab.sitzt', 'sitzt') : '') + '</td>';
      koerper.appendChild(tr);
    });
    document.getElementById('statistik-leer').hidden = versuche > 0;
  };

  /** Stimmgeraet und Mikrofon: was die App gerade hoert. */
  Einstellungen.prototype._mikro = function () {
    var k = this.k, t = k.tracker;
    var f = t.letzterFrame();
    var setz = function (id, wert) { document.getElementById(id).textContent = wert; };
    setz('mikro-weg', k.motor.weg || '–');
    var latenz = k.fortschritt.latenz();
    setz('mikro-latenz', typeof latenz === 'number'
      ? Math.round(latenz * 1000) + ' ms' : T('mikro.latenz.leer', 'noch nicht gemessen'));
    if (!f) { return; }

    var klar = f.above && f.freq > 0 && f.clarity >= k.erkennung.clarityMin;
    var h = klar ? t.naechsteHoehe(f.freq) : null;
    setz('mikro-ton', h ? root.Sprachen.ton(h.tonId) : '–');
    setz('mikro-cent', h ? (h.cents >= 0 ? '+' : '') + h.cents.toFixed(0) + ' ' +
                           T('einheit.cent', 'Cent') : '–');
    setz('mikro-hz', f.freq ? f.freq.toFixed(1) + ' Hz' : '–');
    setz('mikro-db', f.db.toFixed(1) + ' dB');
    setz('mikro-gate', f.gateDb != null ? f.gateDb.toFixed(1) + ' dB' : '–');

    var anteil = Math.max(0, Math.min(1, (f.db + 70) / 70));
    var balken = document.querySelector('#mikro-balken i');
    balken.style.width = (anteil * 100) + '%';
    balken.classList.toggle('an', !!f.above);
  };

  Einstellungen.TONARTEN = TONARTEN;
  root.Einstellungen = Einstellungen;
})(typeof globalThis !== 'undefined' ? globalThis : this);
