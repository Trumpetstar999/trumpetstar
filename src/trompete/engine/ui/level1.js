/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/ui/level1.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* level1.js — Toene.
 *
 * Kein Rhythmus, kein Takt, kein Tempo, kein Vorzaehler.
 *
 * Note, Tonname, Griff und klingende Hoehe stehen von Anfang an da.
 * Start: der Ton erklingt, danach hoert die App zu. Waehrend des
 * Zuhoerens laeuft das Stimmgeraet mit — man sieht, ob der eigene Ton
 * zu tief oder zu hoch liegt, noch bevor er gewertet ist. Stopp haelt
 * jederzeit an.
 *
 * Sitzt ein Ton, kommt der naechste von selbst. Sitzt er nicht, sagt
 * die Statuszeile, was stattdessen zu hoeren war: ein anderer Ton
 * (dann stimmt meist der Griff nicht) oder derselbe Griff einen
 * Naturton zu hoch (dann war die Lippenspannung zu gross).
 */
(function (root) {
  'use strict';

  var T = function (s, u, w) { return root.Sprachen.t(s, u, w); };

  /* Wie lange nach dem eigenen Klang noch nicht zugehoert wird. Deckt
   * den Nachhall des Zimmers ab; die Laufzeit des Lautsprechers steckt
   * schon in motor.klangEndeAmMikrofon(). */
  var NACHHALL_RAND = 0.30;

  var MAX_VERSUCHE_JE_TON = 3;   // danach kommt ein anderer Ton dran
  var STILLE_BIS_HILFE = 4.5;    // Sekunden ohne jeden Pegel
  var GENAU_CENT = 10;           // darunter heisst es "sauber gestimmt"

  function Level1(k) {
    this.k = k;
    this.laeuft = false;         // Bereich ist offen
    this.spielt = false;         // Start gedrueckt, App hoert zu
    this.zielTon = null;
    this.letzterTon = null;
    this.versuche = 0;
    this.stilleInFolge = 0;
    this.hoert = false;
    this.hoerenAb = 0;
    this.letzterPegel = 0;
    this.uhr = null;
    this.marke = 0;
    this.stimmGlatt = null;
    this.zeiger = k.el('stimm-zeiger');
    this.stimmWert = k.el('stimm-wert');
    this.stimmFeld = k.el('stimmung');
  }

  Level1.prototype._nochAktuell = function (marke) {
    return this.marke === marke && this.laeuft && this.spielt;
  };

  /* ---------------------------------------------------------------- */

  Level1.prototype.starten = function () {
    this.marke++;
    this.laeuft = true;
    this.spielt = false;
    this.k.punkte.classList.add('aus');
    this.k.tempo.zeigen(false);
    this.k.titel(T('titel.toene', 'Töne'));
    /* Geprueft wird gegen das Tonmaterial dieses Bereichs — nur so
     * bleibt die Toleranz grosszuegig (siehe tracker.js). */
    this.k.hoerenAuf(this.k.fortschritt.vorrat());
    var selbst = this;
    if (this.uhr) { clearInterval(this.uhr); }
    this.uhr = setInterval(function () { selbst._wache(); }, 400);
    this._naechsterTon(true);
    this.k.status(T('l1.bereit', 'Start drücken: Die App spielt den Ton vor, danach bist du dran.'));
  };

  Level1.prototype.beenden = function () {
    this.marke++;
    this.laeuft = false;
    this.spielt = false;
    this.hoert = false;
    if (this.uhr) { clearInterval(this.uhr); this.uhr = null; }
    if (this.nachspielUhr) { clearTimeout(this.nachspielUhr); this.nachspielUhr = null; }
    this._stimmungAus();
    this.k.knopfBereit(false);
  };

  /** Start gedrueckt. */
  Level1.prototype.start = function () {
    if (!this.laeuft || this.spielt || this.k.rueckmeldung.laeuft) { return; }
    this.spielt = true;
    this.k.knopfBereit(true);
    this._vorspielenUndHoeren();
  };

  /** Stopp gedrueckt. */
  Level1.prototype.stop = function () {
    if (!this.laeuft) { return; }
    this.marke++;
    this.spielt = false;
    this.hoert = false;
    if (this.nachspielUhr) { clearTimeout(this.nachspielUhr); this.nachspielUhr = null; }
    this.k.grifffeld.classList.remove('pulsiert');
    /* Auch hier: geplante Toene verstummen nicht von selbst. */
    this.k.motor.allesStoppen();
    this.k.knopfBereit(false);
    this._stimmungAus();
    this.k.status(T('l1.bereit', 'Start drücken: Die App spielt den Ton vor, danach bist du dran.'));
  };

  /* ---------------------------------------------------------------- */

  Level1.prototype._naechsterTon = function (nurZeigen) {
    if (!this.laeuft) { return; }
    /* Das Tonmaterial kann inzwischen gewachsen sein — die Automatik
     * nimmt einen Ton dazu, sobald die bisherigen sitzen. */
    this.k.hoerenAuf(this.k.fortschritt.vorrat());
    this.zielTon = this.k.fortschritt.naechsterTon(this.letzterTon);
    this.letzterTon = this.zielTon;
    this.versuche = 0;
    this._zeigen();
    if (!nurZeigen && this.spielt) { this._vorspielenUndHoeren(); }
  };

  /** Note, Name und Griff stehen da — auch bevor etwas erklingt. */
  Level1.prototype._zeigen = function () {
    this.k.zeichneNote(null, this.zielTon);
    this.k.zeigeTon(this.k.tonById(this.zielTon));
    this._stimmungAus();
  };

  Level1.prototype._vorspielenUndHoeren = function () {
    var wann = this.k.motor.spieleTon(this.zielTon, { dauer: 1.35 });
    this.hoerenAb = this._abWannZuhoeren(1.7, wann, 1.35);
    this.hoert = true;
    this.letzterPegel = this.k.motor.jetzt();
    this.k.tracker.reset();
    this._stimmungAus();
    this.k.status(T('l1.vorspielen', 'Zuhören …'), 'aktiv');

    /* Wer sofort in den vorgespielten Ton hineinblaest, erzeugt fuer
     * die Erkennung EINEN durchgehenden Ton, der schon vor dem Zuhoeren
     * begonnen hat — und der wuerde nie gemeldet. Deshalb wird die
     * Erkennung genau dann noch einmal auf null gesetzt, wenn das
     * Vorspielen zu Ende ist. */
    var selbst = this, marke = this.marke;
    if (this.nachspielUhr) { clearTimeout(this.nachspielUhr); }
    this.nachspielUhr = setTimeout(function () {
      if (selbst._nochAktuell(marke) && selbst.hoert) {
        selbst.k.tracker.reset();
        selbst._jetztDu();
      }
    }, Math.max(0, (this.hoerenAb - this.k.motor.jetzt()) * 1000) + 50);
  };

  Level1.prototype._jetztDu = function () {
    this.k.status(T('l1.hoeren', 'Jetzt du: {ton} anstoßen und ruhig halten.',
                    { ton: root.Sprachen.ton(this.zielTon) }), 'aktiv');
  };

  /* Ab wann darf gezaehlt werden, was das Mikrofon hoert?
   *
   * Erst wenn der eigene Vorspielton verklungen UND beim Mikrofon
   * angekommen ist. Der Motor weiss, wann sein Klang endet und wie
   * lange der Ausgabeweg braucht (ueber eine Bluetooth-Box gern 200
   * bis 400 ms). Dazu kommt ein fester Rand fuer den Nachhall des
   * Zimmers. Ohne das hoerte die App sich selbst und meldete einen
   * Treffer fuer den eigenen Ton. */
  Level1.prototype._abWannZuhoeren = function (mindestens, wann, dauer) {
    var jetzt = this.k.motor.jetzt();
    var frueheste = jetzt + (mindestens != null ? mindestens : 1.7);
    if (wann == null) { return frueheste; }
    return Math.max(frueheste,
                    this.k.motor.klangEndeAmMikrofon(wann, dauer) + NACHHALL_RAND);
  };

  /* ---------------------------------------------------------------- */
  /* Stimmgeraet                                                       */
  /* ---------------------------------------------------------------- */

  /** Zeigt, wie weit der gerade klingende Ton vom gesuchten entfernt
   *  ist. Die Skala reicht einen Viertelton nach beiden Seiten; was
   *  weiter weg liegt, steht am Anschlag. Geglaettet, damit der Zeiger
   *  nicht zappelt. */
  Level1.prototype._stimmung = function (frame) {
    var ziel = this.k.tonById(this.zielTon);
    if (!ziel || !frame || !frame.above || !(frame.freq > 0) ||
        frame.clarity < this.k.tracker.opt.clarityMin) { return; }
    var cent = 1200 * Math.log(frame.freq / ziel.frequenzHz) / Math.LN2;
    if (Math.abs(cent) > 250) { return; }               // ein ganz anderer Ton
    this.stimmGlatt = this.stimmGlatt === null ? cent : this.stimmGlatt + (cent - this.stimmGlatt) * 0.25;
    var c = Math.max(-50, Math.min(50, this.stimmGlatt));
    this.zeiger.style.left = (50 + c) + '%';
    this.stimmFeld.classList.add('an');
    this.stimmFeld.classList.toggle('gut', Math.abs(this.stimmGlatt) <= 15);
    var rund = Math.round(this.stimmGlatt);
    this.stimmWert.textContent = (rund > 0 ? '+' : '') + rund + ' ' + T('einheit.cent', 'Cent');
  };

  Level1.prototype._stimmungAus = function () {
    this.stimmGlatt = null;
    this.stimmFeld.classList.remove('an');
    this.stimmFeld.classList.remove('gut');
    this.zeiger.style.left = '50%';
    this.stimmWert.textContent = '–';
  };

  /* ---------------------------------------------------------------- */

  /** liste: Ereignisse des Trackers. frame: der juengste Frame. */
  Level1.prototype.ereignisse = function (liste, frame) {
    if (!this.laeuft || !this.spielt || !this.hoert) { return; }
    if (this.k.rueckmeldung.laeuft) { return; }
    if (frame && frame.above) { this.letzterPegel = frame.t; }
    if (frame && frame.t >= this.hoerenAb) { this._stimmung(frame); }
    for (var i = 0; i < liste.length; i++) {
      var e = liste[i];
      if (e.typ !== 'stabil') { continue; }
      if (e.t < this.hoerenAb) { continue; }           // das war die App selbst
      this._bewerten(e);
      return;
    }
  };

  Level1.prototype._centText = function (cent) {
    var n = Math.round(Math.abs(cent));
    if (n < GENAU_CENT) { return T('cent.genau', 'sauber gestimmt'); }
    return cent < 0 ? T('cent.tief', '{n} Cent zu tief', { n: n })
                    : T('cent.hoch', '{n} Cent zu hoch', { n: n });
  };

  /** Der Name dessen, was zu hoeren war — aus der ganzen Tabelle, nicht
   *  nur aus dem Tonmaterial. */
  Level1.prototype._gehoert = function (freq) {
    var h = this.k.tracker.naechsteHoehe(freq);
    return h ? root.Sprachen.ton(h.tonId) : '?';
  };

  Level1.prototype._bewerten = function (e) {
    var selbst = this, marke = this.marke;
    this.hoert = false;
    this.stilleInFolge = 0;
    var ziel = this.k.tonById(this.zielTon);
    var urteil = this.k.tracker.pruefeZiel(e.freq, this.k.hoehe(this.zielTon));
    this.letztesUrteil = urteil;
    var name = root.Sprachen.ton(this.zielTon);

    if (urteil.art === 'treffer') {
      this.k.fortschritt.notiere(this.zielTon, true);
      this.k.status(T('l1.treffer', 'Treffer – {ton}, {cent}.',
                      { ton: name, cent: this._centText(urteil.cents) }), 'gut');
      this.k.rueckmeldung.treffer().then(function () {
        if (selbst._nochAktuell(marke)) { selbst._naechsterTon(false); }
      });
      return;
    }

    if (urteil.art === 'ueberblasen' && !urteil.fremderTon) {
      // Kein Fehlversuch: der Griff stimmt, nur die Spannung war zu hoch.
      this.k.status(T('l1.ueberblasen',
        'Überblasen: Der Griff stimmt, aber es klang {gehoert}. Lippen lockerer lassen und ruhiger blasen.',
        { gehoert: this._gehoert(e.freq) }), 'achtung');
      this.k.rueckmeldung.ueberblasen(this.zielTon).then(function () {
        if (selbst._nochAktuell(marke)) { selbst._weiterHoeren(); }
      });
      return;
    }

    if (urteil.art === 'ungenau') {
      /* Der richtige Ton, aber weiter daneben, als die gewaehlte Strenge
       * erlaubt. Das zaehlt als Fehlversuch — genau dafuer ist die
       * Strenge da — und der Ton kommt zum Vergleich noch einmal. */
      this.k.fortschritt.notiere(this.zielTon, false);
      this.versuche++;
      this.k.status(T('l1.ungenau', 'Das war {ton}, aber {cent} – für die gewählte Strenge zu weit daneben.',
                      { ton: name, cent: this._centText(urteil.cents) }), 'achtung');
      this.k.rueckmeldung.ueberblasen(this.zielTon).then(function () {
        if (!selbst._nochAktuell(marke)) { return; }
        if (selbst.versuche >= MAX_VERSUCHE_JE_TON) { selbst._naechsterTon(false); }
        else { selbst._weiterHoeren(); }
      });
      return;
    }

    /* Ein anderer Ton: der richtige leuchtet auf und erklingt allein.
     * Als Fehlversuch zaehlt nur ein wirklich anderer Ton — nicht der
     * verrutschte Naturton eines fremden Griffs. */
    if (urteil.art === 'anderer') { this.k.fortschritt.notiere(this.zielTon, false); }
    this.versuche++;
    this.k.status(T('l1.anderer', 'Das war {gehoert} – gesucht ist {ton}, Griff {griff}.',
                    { gehoert: this._gehoert(e.freq), ton: name, griff: this.k.griffInWorten(ziel) }),
                  'achtung');
    var kopf = this.k.noten.querySelector('ellipse');
    var farbe = root.Noten.istEinfarbig() ? null : ziel.farbe;
    this.k.rueckmeldung.einzelneNote(kopf, this.zielTon, farbe).then(function () {
      if (!selbst._nochAktuell(marke)) { return; }
      if (selbst.versuche >= MAX_VERSUCHE_JE_TON) { selbst._naechsterTon(false); }
      else { selbst._weiterHoeren(); }
    });
  };

  Level1.prototype._weiterHoeren = function () {
    if (!this.laeuft || !this.spielt) { return; }
    this.hoert = true;
    /* Nach einer Rueckmeldung: die hat gerade selbst geklungen, und
     * genau dann ist spieltBis aktuell und nicht veraltet. */
    this.hoerenAb = Math.max(this.k.motor.jetzt() + 0.25,
                             this.k.motor.spieltBis + this.k.motor.ausgabeVerzug() + NACHHALL_RAND);
    this.letzterPegel = this.k.motor.jetzt();
    this.k.tracker.reset();
    this._stimmungAus();
    this._jetztDu();
  };

  /* Nichts gehoert: kein Zeitlimit, kein Abbruch — nur der Zielton
   * noch einmal und ein pulsierendes Griffbild. Beim dritten Mal
   * lauter, weil die Trompete dann vermutlich zu weit weg ist. */
  Level1.prototype._wache = function () {
    if (!this.laeuft || !this.spielt || !this.hoert) { return; }
    if (this.k.rueckmeldung.laeuft) { return; }
    var jetzt = this.k.motor.jetzt();
    if (jetzt - this.letzterPegel < STILLE_BIS_HILFE) { return; }
    var selbst = this, marke = this.marke;
    this.stilleInFolge++;
    this.hoert = false;
    this.k.status(T('l1.stille', 'Nichts gehört. Der Ton kommt noch einmal – näher ans Mikrofon?'), 'achtung');
    this.k.rueckmeldung.nochmalHoeren(this.zielTon, this.stilleInFolge >= 3).then(function () {
      if (selbst._nochAktuell(marke)) { selbst._weiterHoeren(); }
    });
  };

  root.Level1 = Level1;
})(typeof globalThis !== 'undefined' ? globalThis : this);
