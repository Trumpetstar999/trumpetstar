/* werkstatt.js — die Rhythmus-Werkstatt fuer B-Trompete.
 *
 * Baukasten: Bausteine (Ta, Ti-ti, Tim-ri, Ti-ki-ti-ki, Ta-o, Ta-i ti,
 * Ta-o-e, Ta-o-e-o, psst, sch-ti, Pau-se) zu hoechstens vier Takten
 * zusammenklicken. Ein Takt hat im 4/4-Takt genau vier Schlaege, im
 * 3/4-Takt drei; die Taktart wechselt nur bei leerer Werkstatt.
 *
 *   Anhoeren        ein Takt Einzaehler, dann klatscht die App den
 *                   Rhythmus oder spielt ihn auf der Trompete, der
 *                   Marker laeuft mit
 *   Selbst spielen  der Rhythmus wird zur Uebung auf dem gewaehlten Ton:
 *                   erst Mitspielen (die Trompete spielt mit), dann Solo
 *                   (das Mikrofon hoert zu, jede Note zur rechten Zeit
 *                   bekommt ihr gruenes Haekchen)
 *
 * Toene: notiert c' bis c'' fuer B-Trompete, die Trompete klingt eine
 * grosse Sekunde tiefer (toene.json). Klang, Erkennung und Griffbild
 * stammen unveraendert aus »Pieps lernt Trompete«, Notensatz und
 * Bausteine aus »Pieps lernt Blockfloete, Band 2«.
 */
(function (root) {
  'use strict';

  var MAX_TAKTE = 4;
  var SPEICHER = 'trumpetstar.rhythmus.v1';
  var TOENE = ['c1', 'd1', 'e1', 'f1', 'g1', 'a1', 'h1', 'c2'];
  var NAME = { c1: 'c', d1: 'd', e1: 'e', f1: 'f', g1: 'g', a1: 'a', h1: 'h', c2: 'c' };
  var TEMPO_MIN = 40, TEMPO_MAX = 120;
  var NACHLAUF = 1.2;              // Sekunden Zugabe nach dem letzten Schlag

  var BAUSTEINE = [
    { id: 'viertel', wort: 'Ta', noten: [['T', 4]], schlaege: 1, silben: ['Ta'] },
    { id: 'achtel', wort: 'Ti-ti', noten: [['T', 8], ['T', 8]], schlaege: 1, silben: ['Ti', 'ti'] },
    { id: 'hopsa', wort: 'Tim-ri', noten: [['T', 8, '.'], ['T', 16]], schlaege: 1, silben: ['Tim', 'ri'] },
    { id: 'sechzehntel', wort: 'Ti-ki-ti-ki', noten: [['T', 16], ['T', 16], ['T', 16], ['T', 16]], schlaege: 1, silben: ['Ti', 'ki', 'ti', 'ki'] },
    { id: 'halbe', wort: 'Ta-o', noten: [['T', 2]], schlaege: 2, silben: ['Ta-o'] },
    { id: 'punktierteViertel', wort: 'Ta-i ti', noten: [['T', 4, '.'], ['T', 8]], schlaege: 2, silben: ['Ta-i', 'ti'] },
    { id: 'punktierteHalbe', wort: 'Ta-o-e', noten: [['T', 2, '.']], schlaege: 3, silben: ['Ta-o-e'] },
    { id: 'ganze', wort: 'Ta-o-e-o', noten: [['T', 1]], schlaege: 4, silben: ['Ta-o-e-o'], nur44: true },
    { id: 'viertelpause', wort: 'psst', noten: [[null, 4]], schlaege: 1, silben: [] },
    { id: 'achtelpause', wort: 'sch-ti', noten: [[null, 8], ['T', 8]], schlaege: 1, silben: ['ti'] },
    { id: 'halbepause', wort: 'Pau-se', noten: [[null, 2]], schlaege: 2, silben: [] }
  ];
  function baustein(id) {
    for (var i = 0; i < BAUSTEINE.length; i++) { if (BAUSTEINE[i].id === id) { return BAUSTEINE[i]; } }
    return null;
  }
  function $(id) { return document.getElementById(id); }

  /* Ein Tipp loest genau einmal aus, auch auf iOS (kein Doppel aus
   * touchend und click), und weckt beim ersten Mal den Klang. */
  function tipp(el, fn) {
    var zuletzt = 0;
    function los(e) {
      var jetzt = Date.now();
      if (jetzt - zuletzt < 350) { return; }
      zuletzt = jetzt;
      if (e.type === 'touchend') { e.preventDefault(); }
      W.klangStarten();
      fn(e);
    }
    el.addEventListener('touchend', los);
    el.addEventListener('click', los);
  }

  function wackeln(el) {
    if (!el) { return; }
    el.classList.remove('wackelt'); void el.offsetWidth; el.classList.add('wackelt');
  }

  /* ================================================================ */
  /* Gemeinsames: Toene, Motor, Tempo                                  */
  /* ================================================================ */

  var W = {
    daten: null, tonKarte: {}, motor: null, tracker: null,
    bpm: 60, gestartet: null,

    tonById: function (id) { return this.tonKarte[id] || null; },

    /* Web Audio darf erst nach einer Beruehrung loslegen (iOS). Die
     * Trompetenklaenge laden danach im Hintergrund. */
    klangStarten: function () {
      if (!this.gestartet) { this.gestartet = this.motor.starten().catch(function () { return null; }); }
      return this.gestartet;
    },

    schwierigkeit: function () {
      var s = (this.daten && this.daten.schwierigkeit) || {};
      return (s.stufen || {})[s.standard] || (s.stufen || {}).mittel || {};
    },

    tempoSetzen: function (bpm) {
      this.bpm = Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, Math.round(bpm / 5) * 5));
      $('tempo-wert').textContent = this.bpm;
      $('ue-tempo').textContent = this.bpm;
    }
  };

  /* Klatschen: ein kurzer, gefilterter Rauschstoss — derselbe Klang wie
   * in der Blockfloeten-App. Der Trompetenmotor kennt ihn nicht. */
  function klatsch(wann) {
    var m = W.motor;
    if (!m.ctx) { return; }
    if (!m._rauschen) { m._rauschen = m._rauschPuffer(); }
    var q = m.ctx.createBufferSource();
    q.buffer = m._rauschen;
    var bp = m.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.9;
    var g = m.ctx.createGain();
    g.gain.setValueAtTime(0.0001, wann);
    g.gain.exponentialRampToValueAtTime(0.9, wann + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, wann + 0.085);
    q.connect(bp); bp.connect(g); g.connect(m.meister);
    q.start(wann); q.stop(wann + 0.09);
    m._merken(q);
  }

  /* ================================================================ */
  /* Baukasten                                                         */
  /* ================================================================ */

  function Baukasten() {
    this.svg = $('rh-noten');
    this.feld = $('rh-notenfeld');
    this.silbenFeld = $('rh-silben');
    this.schlaegeFeld = $('rh-schlaege');
    this.palette = $('rh-bausteine');
    this.hoerKnopf = $('rh-hoeren');
    this.marke = 0;
    this.spielt = false;
    this._laden();
    this._binden();
  }

  Baukasten.prototype._laden = function () {
    var s = null;
    try { s = JSON.parse(root.localStorage.getItem(SPEICHER) || 'null'); } catch (e) { s = null; }
    this.taktart = (s && s.taktart === '3/4') ? '3/4' : '4/4';
    this.folge = (s && Array.isArray(s.folge)) ? s.folge.filter(baustein) : [];
    this.tonId = (s && TOENE.indexOf(s.tonId) >= 0) ? s.tonId : 'g1';
    this.klang = (s && s.klang === 'trompete') ? 'trompete' : 'klatschen';
    W.tempoSetzen((s && s.bpm) || 60);
    this._kuerzen();
  };

  Baukasten.prototype._sichern = function () {
    try {
      root.localStorage.setItem(SPEICHER, JSON.stringify({
        taktart: this.taktart, folge: this.folge, tonId: this.tonId, klang: this.klang, bpm: W.bpm
      }));
    } catch (e) { /* ohne Speicher geht es auch */ }
  };

  Baukasten.prototype.taktLaenge = function () { return this.taktart === '3/4' ? 3 : 4; };

  /** Bausteine auf Takte verteilen. Ein neuer Takt beginnt erst, wenn
   *  der alte voll ist — passt() laesst nur zu, was in die freien
   *  Schlaege passt. */
  Baukasten.prototype._verteilen = function (folge) {
    var L = this.taktLaenge(), takte = [], frei = 0;
    folge.forEach(function (id) {
      var b = baustein(id);
      if (b.schlaege > frei) { takte.push([]); frei = L; }
      takte[takte.length - 1].push(id);
      frei -= b.schlaege;
    });
    return takte;
  };

  Baukasten.prototype._takte = function () {
    var takte = this._verteilen(this.folge), belegt = 0;
    (takte[takte.length - 1] || []).forEach(function (id) { belegt += baustein(id).schlaege; });
    return { takte: takte, frei: takte.length ? this.taktLaenge() - belegt : this.taktLaenge() };
  };

  Baukasten.prototype.passt = function (id) {
    var b = baustein(id), L = this.taktLaenge();
    if (b.nur44 && L !== 4) { return false; }
    var t = this._takte();
    var frei = (t.takte.length && t.frei > 0) ? t.frei : L;
    if (b.schlaege > frei) { return false; }
    return this._verteilen(this.folge.concat([id])).length <= MAX_TAKTE;
  };

  Baukasten.prototype._kuerzen = function () {
    var alt = this.folge;
    this.folge = [];
    for (var i = 0; i < alt.length; i++) { if (this.passt(alt[i])) { this.folge.push(alt[i]); } }
  };

  /** Das Stueck im Format, das Melodie.aus() liest. Der letzte Takt
   *  wird mit Pausen voll gemacht. */
  Baukasten.prototype.stueck = function () {
    var ton = this.tonId, silben = [];
    var t = this._takte();
    var takte = t.takte.filter(function (x) { return x.length; }).map(function (ids) {
      var reihe = [];
      ids.forEach(function (id) {
        var b = baustein(id);
        b.noten.forEach(function (n) {
          var e = [n[0] === 'T' ? ton : null, n[1]];
          if (n[2]) { e.push(n[2]); }
          reihe.push(e);
        });
        b.silben.forEach(function (s) { silben.push(s); });
      });
      return reihe;
    });
    if (takte.length && t.frei > 0) {
      var L = this.taktLaenge(), pos = L - t.frei, letzter = takte[takte.length - 1];
      while (pos < L) {
        if (L === 4 && pos % 2 === 0 && L - pos >= 2) { letzter.push([null, 2]); pos += 2; }
        else { letzter.push([null, 4]); pos += 1; }
      }
    }
    return { takte: takte, taktart: this.taktart, vorzeichen: 0, auftakt: 0, silben: silben };
  };

  Baukasten.prototype._binden = function () {
    var selbst = this;
    tipp($('rh-haus'), function () {
      selbst.stop();
      /* In Lovable eingebettet: die Elternseite entscheidet, wohin es
       * geht. Allein geoeffnet: eine Seite zurueck. */
      if (root.parent && root.parent !== root) {
        root.parent.postMessage({ typ: 'trumpetstar-rhythmus', aktion: 'schliessen' }, root.location.origin);
      } else { root.history.back(); }
    });
    [].slice.call(document.querySelectorAll('#rh-taktart button')).forEach(function (b) {
      tipp(b, function () {
        /* Kein Wechsel mitten in der Uebung: erst leeren, dann umstellen. */
        if (selbst.folge.length && b.getAttribute('data-taktart') !== selbst.taktart) { wackeln(b); return; }
        selbst.stop();
        selbst.taktart = b.getAttribute('data-taktart');
        selbst._kuerzen(); selbst._sichern(); selbst.zeigen();
      });
    });
    tipp($('rh-ton'), function () {
      selbst.tonId = TOENE[(TOENE.indexOf(selbst.tonId) + 1) % TOENE.length];
      selbst._sichern(); selbst.zeigen();
      W.klangStarten().then(function () { W.motor.spieleTon(selbst.tonId, { dauer: 0.7 }); });
    });
    tipp($('rh-klang'), function () {
      selbst.klang = selbst.klang === 'klatschen' ? 'trompete' : 'klatschen';
      selbst._sichern(); selbst.zeigen();
    });
    tipp($('rh-wuerfel'), function () { selbst.stop(); selbst.wuerfeln(); });
    tipp($('rh-zurueck'), function () { selbst.stop(); selbst.folge.pop(); selbst._sichern(); selbst.zeigen(); });
    tipp($('rh-leeren'), function () { selbst.stop(); selbst.folge = []; selbst._sichern(); selbst.zeigen(); });
    tipp(this.hoerKnopf, function () { if (selbst.spielt) { selbst.stop(); } else { selbst.anhoeren(); } });
    tipp($('rh-selbst'), function () {
      var st = selbst.stueck();
      if (!st.takte.length || !st.silben.length) { wackeln($('rh-selbst')); return; }
      selbst.stop();
      W.ueben.oeffnen(st, selbst.tonId);
    });
    tipp($('tempo-minus'), function () { W.tempoSetzen(W.bpm - 5); selbst._sichern(); });
    tipp($('tempo-plus'), function () { W.tempoSetzen(W.bpm + 5); selbst._sichern(); });
  };

  Baukasten.prototype.hinzu = function (id, knopf) {
    if (!this.passt(id)) { wackeln(knopf); return; }
    this.stop();
    this.folge.push(id);
    this._sichern();
    this.zeigen();
    this._bausteinVorspielen(baustein(id));
  };

  Baukasten.prototype.wuerfeln = function () {
    var L = this.taktLaenge(), selbst = this, versuche = 0;
    this.folge = [];
    var erlaubt = BAUSTEINE.filter(function (b) { return !(b.nur44 && L !== 4); });
    while (versuche++ < 200) {
      var t = this._takte();
      if (t.takte.length >= MAX_TAKTE && t.frei === 0) { break; }
      var moeglich = erlaubt.filter(function (b) { return selbst.passt(b.id); });
      if (!moeglich.length) { break; }
      /* Pausen seltener als Noten, damit etwas zu spielen bleibt. */
      var gewichtet = [];
      moeglich.forEach(function (b) {
        for (var i = 0; i < (/pause/.test(b.id) ? 1 : 3); i++) { gewichtet.push(b); }
      });
      this.folge.push(gewichtet[Math.floor(Math.random() * gewichtet.length)].id);
    }
    this._sichern();
    this.zeigen();
  };

  Baukasten.prototype._klingen = function (wann, dauerSek) {
    if (this.klang === 'trompete') { W.motor.spieleTon(this.tonId, { wann: wann, dauer: dauerSek }); }
    else { klatsch(wann); }
  };

  Baukasten.prototype._bausteinVorspielen = function (b) {
    var selbst = this;
    W.klangStarten().then(function () {
      var schlag = 60 / Math.max(70, W.bpm), t = W.motor.jetzt() + 0.05;
      b.noten.forEach(function (n) {
        var d = (4 / n[1]) * (n[2] === '.' ? 1.5 : 1) * schlag;
        if (n[0]) { selbst._klingen(t, d * 0.9); }
        t += d;
      });
    });
  };

  Baukasten.prototype.anhoeren = function () {
    var st = this.stueck(), selbst = this;
    if (!st.takte.length) { wackeln(this.hoerKnopf); return; }
    var marke = ++this.marke;
    this.spielt = true;
    this.hoerKnopf.classList.add('laeuft');
    W.klangStarten().then(function () {
      if (marke !== selbst.marke) { return; }
      var m = root.Melodie.aus(st, 1);
      var schlag = 60 / W.bpm, L = selbst.taktLaenge();
      var t0 = W.motor.jetzt() + 0.3, start = t0 + L * schlag;
      for (var s = 0; s < L; s++) { W.motor.klick(t0 + s * schlag, s === 0); }
      for (var b = 0; b < m.schlaegeGesamt; b++) { W.motor.klick(start + b * schlag, b % L === 0, 0.6); }
      m.noten.forEach(function (n) {
        if (n.pause || n.fortsetzung) { return; }
        selbst._klingen(start + n.schlag * schlag, n.klangDauer * schlag * 0.92);
      });
      var letzter = -2;
      (function rahmen() {
        if (marke !== selbst.marke) { return; }
        var sj = (W.motor.hoerbarJetzt() - start) / schlag, idx = -1;
        for (var i = 0; i < m.noten.length; i++) {
          if (sj >= m.noten[i].schlag && sj < m.noten[i].schlag + m.noten[i].dauer) { idx = m.noten[i].ai; break; }
        }
        if (idx !== letzter) { letzter = idx; selbst._zeichnen(m, idx); }
        if (sj > m.schlaegeGesamt + 0.3) { selbst.stop(); return; }
        requestAnimationFrame(rahmen);
      })();
    });
  };

  Baukasten.prototype.stop = function () {
    this.marke++;
    if (this.spielt) {
      this.spielt = false;
      W.motor.allesStoppen();
      this.hoerKnopf.classList.remove('laeuft');
      if (!$('werkstatt').hidden) { this.zeigen(); }
    }
  };

  Baukasten.prototype.zeigen = function () {
    var selbst = this;
    [].slice.call(document.querySelectorAll('#rh-taktart button')).forEach(function (b) {
      var an = b.getAttribute('data-taktart') === selbst.taktart;
      b.classList.toggle('an', an);
      b.setAttribute('aria-checked', String(an));
      b.classList.toggle('gesperrt', !an && selbst.folge.length > 0);
    });
    var ton = W.tonById(this.tonId);
    var kreis = $('rh-ton-kreis');
    kreis.style.backgroundColor = ton.farbe;
    kreis.textContent = NAME[this.tonId];
    root.Griff.zeichne($('rh-ton-griff'), ton);
    $('rh-klang').classList.toggle('trompete', this.klang === 'trompete');
    $('rh-klang').setAttribute('aria-pressed', String(this.klang === 'trompete'));

    if (!this.palette.children.length) {
      BAUSTEINE.forEach(function (b) {
        var knopf = document.createElement('button');
        knopf.className = 'rh-stein';
        knopf.setAttribute('data-stein', b.id);
        knopf.setAttribute('aria-label', b.wort);
        var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('aria-hidden', 'true');
        knopf.appendChild(s);
        var silbe = document.createElement('b');
        silbe.textContent = b.wort;
        knopf.appendChild(silbe);
        tipp(knopf, function () { selbst.hinzu(b.id, knopf); });
        selbst.palette.appendChild(knopf);
      });
    }
    [].slice.call(this.palette.children).forEach(function (knopf) {
      var b = baustein(knopf.getAttribute('data-stein'));
      knopf.classList.toggle('passt-nicht', !selbst.passt(b.id));
      knopf.hidden = !!(b.nur44 && selbst.taktLaenge() !== 4);
      if (knopf.hidden) { return; }
      var s = knopf.querySelector('svg');
      var w = s.clientWidth || 110, h = s.clientHeight || 60;
      var m = root.Melodie.aus({ takte: [b.noten.map(function (n) {
        var e = [n[0] === 'T' ? 'h1' : null, n[1]]; if (n[2]) { e.push(n[2]); } return e;
      })] }, 0);
      root.Noten.zeichne(s, { toene: W.tonKarte, melodie: m, zeilen: [[0]], breitePx: w, hoehePx: h,
                              markerIndex: -1, haken: false, violinschluessel: false,
                              taktstriche: false, taktartZeigen: false });
    });

    var t = this._takte(), L = this.taktLaenge();
    this.schlaegeFeld.innerHTML = '';
    for (var ti = 0; ti < MAX_TAKTE; ti++) {
      var gruppe = document.createElement('span'), belegt = 0;
      gruppe.className = 'rh-takt';
      (t.takte[ti] || []).forEach(function (id) { belegt += baustein(id).schlaege; });
      for (var si = 0; si < L; si++) {
        var k = document.createElement('i');
        if (si < belegt) { k.className = 'voll'; }
        gruppe.appendChild(k);
      }
      this.schlaegeFeld.appendChild(gruppe);
    }

    var st = this.stueck();
    $('rh-leer').hidden = st.takte.length > 0;
    this._zeichnen(st.takte.length ? root.Melodie.aus(st, 1) : null, -1);
  };

  Baukasten.prototype._zeichnen = function (m, markerIndex) {
    zeichneMitSilben(this.svg, this.feld, this.silbenFeld, m, this.stueck().silben, markerIndex, false);
  };

  /** Notenbild mit den Silben darunter, in Pixeln aus dem Notensatz. */
  function zeichneMitSilben(svg, feld, silbenFeld, m, silben, markerIndex, haken) {
    var b = feld.clientWidth, h = feld.clientHeight;
    silbenFeld.innerHTML = '';
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    if (!m || !b || !h) { return null; }
    /* Schmal (Handy hochkant): zwei Takte je Zeile, sonst laufen die
     * Silben ineinander. */
    var proZeile = b < 560 ? 2 : MAX_TAKTE, zeilen = [];
    m.takte.forEach(function (_, i) {
      if (i % proZeile === 0) { zeilen.push([]); }
      zeilen[zeilen.length - 1].push(i);
    });
    var bild = root.Noten.zeichne(svg, {
      toene: W.tonKarte, melodie: m, zeilen: zeilen,
      breitePx: b, hoehePx: h * 0.86, markerIndex: markerIndex, haken: haken || [],
      violinschluessel: true, taktstriche: true
    });
    if (!bild) { return null; }
    var vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    /* Die Silben stehen direkt unter ihrem System: je Zeile unter der
     * untersten Linie oder dem tiefsten Notenkopf. */
    var zy = bild.zeilenY || [0];
    function zeileVon(y) {
      var beste = 0;
      zy.forEach(function (z, i) { if (Math.abs(y - z) < Math.abs(y - zy[beste])) { beste = i; } });
      return beste;
    }
    var unten = zy.map(function (z) { return z + 2; });
    bild.positionen.forEach(function (p) { var i = zeileVon(p.y); unten[i] = Math.max(unten[i], p.y); });
    bild.positionen.forEach(function (p) {
      if (p.klingendIndex < 0 || !silben[p.klingendIndex]) { return; }
      var s = document.createElement('span');
      s.textContent = silben[p.klingendIndex];
      s.style.left = ((p.x - vb[0]) * bild.z) + 'px';
      s.style.top = ((unten[zeileVon(p.y)] + 1.3 - vb[1]) * bild.z) + 'px';
      silbenFeld.appendChild(s);
    });
    return bild;
  }

  /* ================================================================ */
  /* Selbst spielen                                                    */
  /*                                                                   */
  /* Ablauf wie Level 2 der Trompeten-App: Los -> ein Takt Einzaehler  */
  /* (der letzte Schlag ist ein gruenes GO) -> das Stueck laeuft im    */
  /* Tempo durch. Mitspielen: die Trompete spielt mit, es wird nicht   */
  /* gewertet (das Mikrofon hoerte den Lautsprecher). Solo: nur der    */
  /* Klick laeuft, jede richtige Note zur rechten Zeit bekommt ihr     */
  /* Haekchen. Nach dem Mitspielen geht es von selbst auf Solo.        */
  /* ================================================================ */

  function Ueben() {
    this.svg = $('ue-noten');
    this.feld = $('ue-notenfeld');
    this.silbenFeld = $('ue-silben');
    this.startKnopf = $('ue-start');
    this.punkte = $('ue-punkte');
    this.marke = 0;
    this.offen = false;
    this.phase = 'aus';             // aus | bereit | vorzaehler | spielt | fertig
    this.modus = 'mit';
    this.mikrofon = false;
    var selbst = this;
    tipp($('ue-zurueck'), function () { selbst.schliessen(); });
    tipp($('ue-mit'), function () { selbst.stop(); selbst.setzeModus('mit'); });
    tipp($('ue-solo'), function () {
      if (!selbst.mikrofon) { selbst._hinweisMikrofon(); wackeln($('ue-solo')); return; }
      selbst.stop(); selbst.setzeModus('solo');
    });
    tipp(this.startKnopf, function () {
      if (selbst.phase === 'bereit') { selbst.start(); } else { selbst.stop(); }
    });
  }

  Ueben.prototype.oeffnen = function (st, tonId) {
    var selbst = this;
    this.stueck = st;
    this.tonId = tonId;
    this.melodie = root.Melodie.aus(st, 1);
    this.L = st.taktart === '3/4' ? 3 : 4;
    this.offen = true;
    $('werkstatt').hidden = true;
    $('ueben').hidden = false;
    this.punkte.innerHTML = '';
    for (var i = 0; i < this.L; i++) { this.punkte.appendChild(document.createElement('i')); }
    var ton = W.tonById(tonId);
    var kreis = $('ue-tonname');
    kreis.textContent = NAME[tonId];
    kreis.style.backgroundColor = ton.farbe;
    root.Griff.zeichne($('ue-griff'), ton);
    this.setzeModus('mit');
    this._bereit();
    /* Das Mikrofon erst hier erbitten, nicht schon beim Baukasten. */
    W.klangStarten().then(function () {
      return W.motor.mikrofonStarten(function (buf) { selbst._frames(buf); });
    }).then(function () {
      selbst.mikrofon = true;
      $('ue-hinweis').textContent = '';
    }, function () {
      selbst.mikrofon = false;
      selbst._hinweisMikrofon();
    });
  };

  Ueben.prototype._hinweisMikrofon = function () {
    $('ue-hinweis').textContent = 'Für Solo braucht die App dein Mikrofon. Mitspielen geht auch ohne.';
  };

  Ueben.prototype.schliessen = function () {
    this.stop();
    this.offen = false;
    this.phase = 'aus';
    $('ueben').hidden = true;
    $('werkstatt').hidden = false;
    W.baukasten.zeigen();
  };

  Ueben.prototype.setzeModus = function (art) {
    this.modus = art === 'solo' ? 'solo' : 'mit';
    $('ue-mit').classList.toggle('an', this.modus === 'mit');
    $('ue-solo').classList.toggle('an', this.modus === 'solo');
    $('ue-mit').setAttribute('aria-checked', String(this.modus === 'mit'));
    $('ue-solo').setAttribute('aria-checked', String(this.modus === 'solo'));
  };

  Ueben.prototype._bereit = function () {
    this.phase = 'bereit';
    this.haken = [];
    this.startKnopf.classList.remove('laeuft');
    this._punkteAus();
    this._zeichnen(-1);
  };

  Ueben.prototype._spaeter = function (fn, ms) {
    var selbst = this, marke = this.marke;
    return setTimeout(function () { if (selbst.marke === marke && selbst.offen) { fn(); } }, Math.max(0, ms));
  };

  Ueben.prototype.klingend = function () {
    return this.melodie.noten.filter(function (n) { return !n.pause && !n.fortsetzung; });
  };

  Ueben.prototype.start = function () {
    var selbst = this;
    this.marke++;
    this.phase = 'vorzaehler';
    this.startKnopf.classList.add('laeuft');
    W.klangStarten().then(function () {
      var schlag = 60 / W.bpm, L = selbst.L, m = selbst.melodie;
      var t0 = W.motor.jetzt() + 0.35;
      selbst.startZeit = t0 + L * schlag;
      selbst.endeZeit = selbst.startZeit + m.schlaegeGesamt * schlag;
      for (var s = 0; s < L; s++) {
        W.motor.klick(t0 + s * schlag, s === 0);
        selbst._punktPlanen(s, t0 + s * schlag, s === L - 1);
      }
      for (var b = 0; b < m.schlaegeGesamt; b++) {
        W.motor.klick(selbst.startZeit + b * schlag, b % L === 0, 0.85);
        selbst._punktPlanen(b % L, selbst.startZeit + b * schlag, false);
      }
      if (selbst.modus === 'mit') { W.motor.spieleMelodie(m, W.bpm, { wann: selbst.startZeit, lautstaerke: 0.9 }); }
      selbst.haken = [];
      selbst.letzteAnnahme = 0;
      selbst.letzterLauf = -1;
      W.tracker.reset();
      W.motor.erkennungZuruecksetzen();
      selbst._spaeter(function () { selbst._laufen(); }, (selbst.startZeit - W.motor.jetzt()) * 1000);
      selbst._spaeter(function () { selbst._auswerten(); }, (selbst.endeZeit - W.motor.jetzt() + NACHLAUF) * 1000);
    });
  };

  Ueben.prototype.stop = function () {
    this.marke++;
    W.motor.allesStoppen();
    $('ue-jubel').hidden = true;
    if (this.offen) { this._bereit(); }
  };

  Ueben.prototype._laufen = function () {
    this.phase = 'spielt';
    this._markerLaufen(this.startZeit);
  };

  /** Der Marker haengt am Puls, nicht am Kind — und an dem, was zu
   *  HOEREN ist, nicht an der Rechenuhr des Browsers. */
  Ueben.prototype._markerLaufen = function (start, fertig) {
    var selbst = this, marke = this.marke, schlag = 60 / W.bpm, m = this.melodie, letzter = -2;
    (function rahmen() {
      if (selbst.marke !== marke || !selbst.offen) { return; }
      var sj = (W.motor.hoerbarJetzt() - start) / schlag, idx = -1;
      for (var i = 0; i < m.noten.length; i++) {
        if (sj >= m.noten[i].schlag && sj < m.noten[i].schlag + m.noten[i].dauer) { idx = m.noten[i].ai; break; }
      }
      if (idx !== letzter) { letzter = idx; selbst._zeichnen(idx); }
      if (sj > m.schlaegeGesamt + 0.4) { selbst._zeichnen(-1); if (fertig) { fertig(); } return; }
      requestAnimationFrame(rahmen);
    })();
  };

  Ueben.prototype._frames = function (buf) {
    var e = W.tracker.feedKompakt(buf);
    if (!e.length || !this.offen || this.phase !== 'spielt' || this.modus !== 'solo') { return; }
    for (var i = 0; i < e.length; i++) {
      if (e[i].typ === 'kurz') { this._pruefe(e[i].tonId, e[i].oktave, e[i].t, e[i].laufNr); }
      else if (e[i].typ === 'einsatz') {
        /* Im Rhythmus ist jede Note derselbe Ton: ein Zungenstoss
         * reisst den Tonlauf nicht ab, ist aber eine neue Note. Darum
         * zaehlt hier jeder Einsatz, nur der Mindestabstand gilt. */
        var jetzt = W.tracker.aktuelleKlasse();
        if (jetzt) { this._pruefe(jetzt.tonId, jetzt.oktave, e[i].t, null); }
      }
    }
  };

  /* Die erste noch offene Note, deren Zeitfenster den Klang enthaelt
   * und deren Tonhoehe stimmt. Ueberblasen bringt kein Haekchen, ist
   * aber auch kein Fehler. */
  Ueben.prototype._pruefe = function (tonId, oktave, t, laufNr) {
    var kl = this.klingend(), s = W.schwierigkeit();
    /* Zwei Annahmen liegen mindestens 0,18 s auseinander — bei
     * schnellen Sechzehnteln weniger, sonst koennten sie nie alle
     * ihr Haekchen bekommen. */
    var kuerzeste = Math.min.apply(null, kl.map(function (n) { return n.dauer; }));
    var abstand = Math.min(0.18, 0.6 * kuerzeste * 60 / W.bpm);
    if (t - this.letzteAnnahme < abstand || (laufNr !== null && laufNr === this.letzterLauf) || oktave === 1) { return; }
    var vor = s.fensterVor != null ? s.fensterVor : 0.5, nach = s.fensterNach != null ? s.fensterNach : 1.3;
    /* Kurze Noten: das Fenster darf nicht in die uebernaechste reichen. */
    var sj = (t - this.startZeit) / (60 / W.bpm);
    for (var i = 0; i < kl.length; i++) {
      if (this.haken.indexOf(kl[i].ai) >= 0) { continue; }
      var b = kl[i].schlag;
      var v = Math.min(vor, kl[i].dauer), n = Math.min(nach, Math.max(kl[i].dauer, 0.5));
      if (sj < b - v) { break; }
      if (sj > b + n) { continue; }
      if (kl[i].tonId !== tonId) { continue; }
      this.letzteAnnahme = t;
      this.letzterLauf = laufNr;
      this.haken.push(kl[i].ai);
      this._zeichnen(this.markerIndex);
      return;
    }
  };

  Ueben.prototype._auswerten = function () {
    if (this.phase !== 'spielt' && this.phase !== 'vorzaehler') { return; }
    this.phase = 'fertig';
    this._punkteAus();
    this.startKnopf.classList.remove('laeuft');
    var selbst = this, marke = this.marke;
    if (this.modus === 'mit') {
      /* Erst vormachen, dann selber. */
      if (this.mikrofon) { this.setzeModus('solo'); }
      this._spaeter(function () { selbst._bereit(); }, 600);
      return;
    }
    var alle = this.klingend().length;
    if (this.haken.length >= alle) {
      $('ue-jubel').hidden = false;
      W.motor.spieleLob();
      this._spaeter(function () { $('ue-jubel').hidden = true; selbst._bereit(); }, 2600);
      return;
    }
    /* Nicht alles gesessen: kein Summer, kein rotes Zeichen — die
     * Trompete macht es noch einmal vor, dann liegt die Uebung wieder
     * bereit. */
    var haken = this.haken.slice();
    this.setzeModus('mit');
    this._spaeter(function () {
      var r = W.motor.spieleMelodie(selbst.melodie, W.bpm, { lautstaerke: 0.9 });
      selbst.haken = haken;
      selbst._markerLaufen(r.start, function () {
        if (selbst.marke !== marke) { return; }
        selbst.setzeModus('solo');
        selbst._bereit();
      });
    }, 900);
  };

  Ueben.prototype._zeichnen = function (markerIndex) {
    this.markerIndex = markerIndex;
    zeichneMitSilben(this.svg, this.feld, this.silbenFeld, this.melodie, this.stueck.silben, markerIndex, this.haken);
  };

  Ueben.prototype._punktPlanen = function (index, wann, istGo) {
    var selbst = this;
    this._spaeter(function () {
      var p = selbst.punkte.children[index];
      if (!p) { return; }
      p.classList.add(istGo ? 'los' : 'an');
      setTimeout(function () { p.classList.remove('an'); p.classList.remove('los'); }, istGo ? 420 : 190);
    }, (wann - W.motor.hoerbarJetzt()) * 1000);
  };

  Ueben.prototype._punkteAus = function () {
    [].slice.call(this.punkte.children).forEach(function (p) { p.classList.remove('an'); p.classList.remove('los'); });
  };

  /* ================================================================ */
  /* Start                                                             */
  /* ================================================================ */

  function aufbauen(daten) {
    /* iOS zeigt :active nur, wenn ein touchstart-Lauscher existiert —
     * ohne ihn kaeme die Rueckmeldung erst beim Loslassen. */
    document.addEventListener('touchstart', function () {}, { passive: true });
    W.daten = daten;
    daten.toene.concat(daten.buchToene || []).forEach(function (t) { W.tonKarte[t.id] = t; });
    W.motor = new root.Motor({ toene: daten.toene, erkennung: daten.erkennung });
    W.tracker = new root.Tracker({ toene: daten.toene, erkennung: daten.erkennung, logSekunden: 20,
                                   schwierigkeit: W.schwierigkeit() });
    /* In allen Trompeten-Knoepfen dieselbe Trompete wie im Griffbild,
     * mit offenen Ventilen: der Knopf sagt, WER spielt, nicht was. */
    [].slice.call(document.querySelectorAll('svg.trompete')).forEach(function (svg) {
      root.Griff.zeichne(svg, root.Griff.offen);
    });
    W.baukasten = new Baukasten();
    W.ueben = new Ueben();
    W.baukasten.zeigen();
    var warte = 0;
    root.addEventListener('resize', function () {
      clearTimeout(warte);
      warte = setTimeout(function () {
        if (W.ueben.offen) { W.ueben._zeichnen(W.ueben.markerIndex); } else { W.baukasten.zeigen(); }
      }, 120);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { W.baukasten.stop(); if (W.ueben.offen) { W.ueben.stop(); } }
    });
  }

  fetch('data/toene.json').then(function (r) { return r.json(); }).then(aufbauen);
  root.RhythmusWerkstatt = W;
})(typeof globalThis !== 'undefined' ? globalThis : this);
