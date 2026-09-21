/* buch.js — die Lieder aus dem gedruckten Buch.
 *
 * Neben dem iPad liegt das Buch. Die App zeigt deshalb keine eigene
 * Liste, sondern das Buch selbst: die farbigen Reiter der elf Welten,
 * darunter die Seiten als Bilder. Das Kind sucht die Seite, die es
 * aufgeschlagen hat, und tippt sie an. Steht mehr als ein Lied auf der
 * Seite, wird die Seite gross gezeigt und das Kind tippt das Lied an —
 * dieselbe Bewegung wie mit dem Finger im Heft.
 *
 * Geuebt wird dann Zeile fuer Zeile, so wie ein Lehrer es vormacht:
 *
 *   1. Die App spielt die Zeile vor, der Marker laeuft mit.
 *   2. Das Kind spielt dieselbe Zeile allein. Jede Note, die sitzt,
 *      bekommt ihr gruenes Haekchen.
 *   3. Sitzt alles, ist die Zeile geschafft und die naechste kommt.
 *      Sonst wird sie noch einmal vorgemacht.
 *
 * Nach der letzten Zeile das ganze Lied, mit Wiederholungen und
 * Zeilenwechsel. Bleibt dabei etwas liegen, wird die schwaechste Zeile
 * noch einmal geuebt und danach das Lied noch einmal versucht.
 *
 * Was geuebt wird, darf das Kind auch selbst waehlen: jedes Feld im Band
 * unter der Leiste ist eine gedruckte Zeile, das breite am Ende das ganze
 * Lied. Und im ganzen Lied genuegt es, auf eine Zeile im Notenbild zu
 * tippen.
 *
 * Duette: das Kind waehlt mit den beiden Sternen seine Stimme — die
 * Sterne stehen im Buch an derselben Stelle. Beim Vormachen erklingt
 * die andere Stimme leise mit, damit hoerbar wird, dass es zusammen
 * etwas ergibt. Gewertet wird immer nur die eigene Stimme.
 */
(function (root) {
  'use strict';

  var NACHLAUF = 1.2;           // Sekunden Zugabe am Schluss
  var LEISE = 0.34;             // so leise liegt die andere Stimme darunter

  /* ================================================================ */
  /* Blaettern                                                         */
  /* ================================================================ */

  function Buch(k) {
    this.k = k;
    this.daten = k.buchDaten;
    this.welt = null;
    this.ueben = new Ueben(k, this);

    this.reiter = document.getElementById('buch-reiter');
    this.seiten = document.getElementById('buch-seiten');
    this.lupe = document.getElementById('buch-lupe');
    this.lupeBild = document.getElementById('buch-lupe-bild');
    this.lupeFelder = document.getElementById('buch-lupe-felder');

    var selbst = this;
    k.tippBinden(document.getElementById('buch-haus'), function () { selbst.k.nachHause(); });
    k.tippBinden(document.getElementById('buch-lupe-zu'), function () { selbst._lupeSchliessen(); });
  }

  Buch.prototype.stueckMit = function (id) {
    var alle = this.daten.stuecke;
    for (var i = 0; i < alle.length; i++) { if (alle[i].id === id) { return alle[i]; } }
    return null;
  };

  /** Die Stuecke einer Welt, in der Reihenfolge des Buches. */
  Buch.prototype.stueckeDerWelt = function (welt) {
    return this.daten.stuecke.filter(function (s) { return s.welt === welt; });
  };

  Buch.prototype.oeffnen = function () {
    /* Aufgeschlagen wird dort, wo zuletzt gespielt wurde — wie ein
     * Lesezeichen. Beim ersten Mal ganz vorn. */
    var zuletzt = this.stueckMit(this.k.fortschritt.buchZuletzt());
    this.welt = (zuletzt && zuletzt.welt) || this.daten.welten[0].id;
    this._lupeSchliessen();
    this._reiterBauen();
    this._seitenBauen();
    this.k.bildschirm('buch');
  };

  Buch.prototype._reiterBauen = function () {
    var selbst = this;
    this.reiter.innerHTML = '';
    this.daten.welten.forEach(function (w) {
      var knopf = document.createElement('button');
      knopf.className = 'buch-reiter' + (w.id === selbst.welt ? ' an' : '');
      knopf.style.backgroundColor = w.farbe;
      knopf.setAttribute('role', 'tab');
      knopf.setAttribute('aria-selected', w.id === selbst.welt ? 'true' : 'false');
      knopf.setAttribute('aria-label', w.titel);
      /* Auf dem Reiter steht, was auch im Buch darauf steht: die Zahl
       * der Welt. Eine Ziffer erkennt ein fuenfjaehriges Kind, bevor es
       * lesen kann, und im Buch steht sie daneben ("Level 4"). */
      var zahl = document.createElement('b');
      zahl.textContent = w.level;
      knopf.appendChild(zahl);
      selbst.k.tippBinden(knopf, function () {
        if (selbst.welt === w.id) { return; }
        selbst.welt = w.id;
        selbst._reiterBauen();
        selbst._seitenBauen();
      });
      selbst.reiter.appendChild(knopf);
    });
  };

  Buch.prototype._seitenBauen = function () {
    var selbst = this;
    var liste = this.stueckeDerWelt(this.welt);
    var seiten = [];
    liste.forEach(function (s) {
      var letzte = seiten[seiten.length - 1];
      if (letzte && letzte.nr === s.seite) { letzte.stuecke.push(s); }
      else { seiten.push({ nr: s.seite, stuecke: [s] }); }
    });

    this.seiten.innerHTML = '';
    this.seiten.classList.toggle('viele', seiten.length > 6);
    seiten.forEach(function (seite) {
      var knopf = document.createElement('button');
      knopf.className = 'buch-seite';
      knopf.setAttribute('aria-label', seite.stuecke.map(function (s) { return s.titel; }).join(', '));

      var bild = document.createElement('img');
      bild.src = 'img/buch/seite-' + zwei(seite.nr) + '.jpg';
      bild.alt = '';
      bild.setAttribute('aria-hidden', 'true');
      knopf.appendChild(bild);

      /* Ein Stern auf der Seite heisst: das steht. Bei mehreren Liedern
       * auf einer Seite erst, wenn alle stehen. */
      var geschafft = seite.stuecke.every(function (s) {
        return selbst.k.fortschritt.buchGeschafft(s.id);
      });
      if (geschafft) {
        var stern = document.createElement('span');
        stern.className = 'buch-stern';
        knopf.appendChild(stern);
      }

      selbst.k.tippBinden(knopf, function () {
        if (seite.stuecke.length > 1) { selbst._lupeOeffnen(seite); }
        else { selbst.ueben.starten(seite.stuecke[0].id); }
      });
      selbst.seiten.appendChild(knopf);
    });
  };

  Buch.prototype._lupeOeffnen = function (seite) {
    var selbst = this;
    this.lupeBild.src = 'img/buch/seite-' + zwei(seite.nr) + '-gross.jpg';
    this.lupeFelder.innerHTML = '';
    seite.stuecke.forEach(function (s) {
      var b = s.bereich || [0, 1];
      var feld = document.createElement('button');
      feld.className = 'buch-feld';
      feld.style.top = (b[0] * 100) + '%';
      feld.style.height = ((b[1] - b[0]) * 100) + '%';
      feld.setAttribute('aria-label', s.titel);
      if (selbst.k.fortschritt.buchGeschafft(s.id)) {
        var stern = document.createElement('span');
        stern.className = 'buch-stern';
        feld.appendChild(stern);
      }
      selbst.k.tippBinden(feld, function () { selbst.ueben.starten(s.id); });
      selbst.lupeFelder.appendChild(feld);
    });
    this.lupe.hidden = false;
  };

  Buch.prototype._lupeSchliessen = function () {
    this.lupe.hidden = true;
    this.lupeBild.removeAttribute('src');
  };

  function zwei(n) { return (n < 10 ? '0' : '') + n; }

  /* ================================================================ */
  /* Ueben                                                             */
  /* ================================================================ */

  function Ueben(k, buch) {
    this.k = k;
    this.buch = buch;
    this.laeuft = false;
    this.phase = 'aus';           // aus | bereit | spielt | fertig
    this.marke = 0;
    this.stueck = null;
    this.stimme = 0;
    this.schritte = [];
    this.schritt = 0;
    this.modus = 'mit';
    this.melodie = null;
    this.bild = null;
    this.haken = [];
    this.letzteAnnahme = 0;
    this.letzterAkzeptLauf = -1;
    this.rahmen = null;

    this.svg = document.getElementById('satz');
    this.band = document.getElementById('zeilenband');
    this.stimmenFeld = document.getElementById('stimmen');
    this.vorKnopf = document.getElementById('umblaettern');
    this.zurueckKnopf = document.getElementById('zurueckblaettern');

    var selbst = this;
    [].slice.call(this.stimmenFeld.querySelectorAll('.stimmknopf')).forEach(function (knopf) {
      k.tippBinden(knopf, function () {
        selbst.setzeStimme(parseInt(knopf.getAttribute('data-stimme'), 10));
      });
    });
    /* Im ganzen Lied fuehrt ein Tipp auf eine Zeile zu dieser Zeile.
     * Nur solange nichts laeuft: eine Hand, die beim Spielen aufs Bild
     * kommt, soll den Durchgang nicht abbrechen. */
    k.tippBinden(k.notenfeld, function (tipp) {
      if (!selbst.laeuft || !selbst.bild || !tipp) { return; }
      if (selbst.phase !== 'bereit' || selbst.k.rueckmeldung.laeuft) { return; }
      if (!selbst.schritte[selbst.schritt].ganz || selbst.zeilen.length < 2) { return; }
      var zeile = selbst.bild.zeileBei(tipp.clientY);
      if (zeile != null) { selbst.waehleSchritt(zeile); }
    });
  }

  Ueben.prototype._spaeter = function (fn, ms) {
    var selbst = this, marke = this.marke;
    return setTimeout(function () {
      if (selbst.marke === marke && selbst.laeuft) { fn(); }
    }, Math.max(0, ms));
  };
  Ueben.prototype._nochAktuell = function (marke) {
    return this.marke === marke && this.laeuft;
  };

  /* ---------------------------------------------------------------- */
  /* Ein Stueck aufschlagen                                            */
  /* ---------------------------------------------------------------- */

  Ueben.prototype.starten = function (id) {
    var stueck = this.buch.stueckMit(id);
    if (!stueck) { return; }
    this.marke++;
    this.stueck = stueck;
    this.stimme = Math.min(this.k.fortschritt.buchStimme(id), stueck.stimmen.length - 1);
    this.laeuft = true;
    this.k.fortschritt.setzeBuchStueck(id, this.stimme);

    this.k.uebungsbildSetzen('buch');
    /* Vor dem ersten und hinter dem letzten Lied gibt es nichts mehr zu
     * blaettern. Ein Knopf, der dort stuende und nichts taete, fuehrte
     * ins Leere — also steht er dort nicht. */
    var alle = this.buch.daten.stuecke, platz = alle.indexOf(stueck);
    this.zurueckKnopf.hidden = platz === 0;
    this.vorKnopf.hidden = platz === alle.length - 1;
    this.k.notenfarbeAnwenden('buch');
    this.k.punkte.classList.remove('aus');
    this.k.tempo.zeigen(true);
    this.k.tempo.setze(this.k.fortschritt.tempo(), true);
    this.k.grifffeld.style.visibility = 'visible';
    this.k.tierfeld.style.visibility = 'hidden';
    this.k.knopfBereit(false);
    this.k.bildschirm('uebung');

    this.stimmenFeld.hidden = stueck.stimmen.length < 2;
    this._stimmenZeigen();
    this._schritteBauen();
    this._toeneSetzen();
    this._bereitlegen();
  };

  Ueben.prototype.beenden = function () {
    this.marke++;
    this.laeuft = false;
    this.phase = 'aus';
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this.k.tempo.sperren(false);
    this.k.grifffeld.classList.remove('pulsiert');
    this.k.knopfBereit(false);
    this._punkteAus();
    this.stimmenFeld.hidden = true;
    this.band.hidden = true;
    // Die Erkennung und die Farben gehoeren wieder den Levels 1 bis 3.
    this.k.tracker.setzeToene(this.k.toene);
    this.k.notenfarbeAnwenden();
  };

  /** Einen Ausschnitt selbst waehlen: eine gedruckte Zeile oder das
   *  ganze Lied. Was laeuft, verstummt; der Ausschnitt wird zuerst
   *  vorgemacht. */
  Ueben.prototype.waehleSchritt = function (i) {
    if (!this.laeuft || i < 0 || i >= this.schritte.length) { return; }
    this._alleStoppen();
    this.k.knopfBereit(false);
    this._punkteAus();
    this.schritt = i;
    this._bereitlegen();
  };

  /** Umblaettern: das naechste Lied des Buches, ueber Weltgrenzen hinweg. */
  Ueben.prototype.blaettern = function (richtung) {
    if (!this.laeuft || !this.stueck) { return; }
    var alle = this.buch.daten.stuecke;
    var i = alle.indexOf(this.stueck) + (richtung < 0 ? -1 : 1);
    if (i < 0 || i >= alle.length) { return; }
    this._alleStoppen();
    this.buch.welt = alle[i].welt;
    this.starten(alle[i].id);
  };

  Ueben.prototype.setzeStimme = function (stimme) {
    if (!this.laeuft || !this.stueck) { return; }
    stimme = stimme === 1 ? 1 : 0;
    if (stimme >= this.stueck.stimmen.length || stimme === this.stimme) { return; }
    this._alleStoppen();
    this.stimme = stimme;
    this.k.fortschritt.setzeBuchStueck(this.stueck.id, stimme);
    this._stimmenZeigen();
    this._schritteBauen();
    this._toeneSetzen();
    this._bereitlegen();
  };

  Ueben.prototype.setzeModus = function (art) {
    this.modus = (art === 'solo') ? 'solo' : 'mit';
    this.k.fortschritt.setzeModus(this.modus);
    this.k.zeigeModus(this.modus);
  };

  Ueben.prototype._stimmenZeigen = function () {
    var selbst = this;
    [].slice.call(this.stimmenFeld.querySelectorAll('.stimmknopf')).forEach(function (knopf) {
      var an = parseInt(knopf.getAttribute('data-stimme'), 10) === selbst.stimme;
      knopf.classList.toggle('an', an);
      knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
  };

  /* Die Schritte: jede gedruckte Zeile, dann das ganze Lied. Hat das
   * Lied nur eine Zeile, waere beides dasselbe — dann nur das Lied. */
  Ueben.prototype._schritteBauen = function () {
    var zl = root.Buchstueck.zeilen(this.stueck.stimmen[this.stimme].takte);
    this.zeilen = zl;
    this.schritte = [];
    if (zl.length > 1) {
      for (var i = 0; i < zl.length; i++) { this.schritte.push({ zeile: i }); }
    }
    this.schritte.push({ ganz: true });

    /* Weiter geht es bei der ersten Zeile, die noch nicht steht — wer
     * gestern bis Zeile drei kam, faengt nicht wieder bei eins an. */
    var stand = this.k.fortschritt.buchStand(this.stueck.id, this.stimme);
    this.schritt = 0;
    while (this.schritt < this.schritte.length - 1 && stand.zeilen[this.schritt]) { this.schritt++; }
    this.gesehen = {};
  };

  /* Die Erkennung braucht genau die Toene dieses Stuecks. Ein Stueck
   * aus dem Buch kennt Toene, die in den Levels nicht vorkommen (fis1,
   * b1, e2); umgekehrt wuerde ein Ton, den es hier gar nicht gibt, die
   * Toleranz seiner Nachbarn unnoetig einengen. */
  Ueben.prototype._toeneSetzen = function () {
    var gebraucht = {};
    var selbst = this;
    this.stueck.stimmen.forEach(function (st, si) {
      root.Buchstueck.toeneDerStimme(selbst.stueck, si).forEach(function (id) { gebraucht[id] = true; });
    });
    this.k.tracker.setzeToene(this.k.alleToene.filter(function (t) { return gebraucht[t.id]; }));
  };

  /* ---------------------------------------------------------------- */
  /* Einen Schritt bereitlegen                                         */
  /* ---------------------------------------------------------------- */

  Ueben.prototype._bereitlegen = function (wiederholen) {
    if (!this.laeuft) { return; }
    var schritt = this.schritte[this.schritt];

    this.melodie = root.Buchstueck.melodie(this.stueck, {
      stimme: this.stimme,
      zeile: schritt.ganz ? null : schritt.zeile,
      tonKarte: this.k.tonKarte,
      fMinHz: this.k.erkennung.fMinHz
    });
    this.wertbar = this.melodie.noten.filter(function (n) {
      return !n.pause && !n.fortsetzung && !n.ohneWertung;
    });
    this.k.punkteSetzen(this.melodie.zaehlzeiten);

    /* Jeder Schritt wird einmal vorgemacht und dann selbst gespielt.
     * Wer denselben Schritt noch einmal versucht, faengt wieder beim
     * Vormachen an — das ist der Sinn des Wiederholens. */
    if (!wiederholen) { this.setzeModus('mit'); }

    this.haken = [];
    this.phase = 'bereit';
    // Erst das Band, dann die Noten: das Band nimmt seine Zeile im
    // Raster ein, und danach erst steht fest, wie hoch das Notenbild wird.
    this._bandBauen();
    this._zeichnen();
    this._griffFuer(0);
    this.k.tempo.sperren(false);
    this.k.knopfBereit(false);
    this._punkteAus();
  };

  Ueben.prototype._zeichnen = function () {
    var schritt = this.schritte[this.schritt];
    var takte = this.stueck.stimmen[this.stimme].takte;
    var masse = this.k.notenMasse();
    if (!masse.b || !masse.h) { return; }
    this.bild = root.Satz.zeichne(this.svg, {
      takte: takte,
      zeilen: this.zeilen,
      zeigen: schritt.ganz ? [0, this.zeilen.length - 1] : [schritt.zeile, schritt.zeile],
      /* Beim ganzen Lied stehen zwei Zeilen untereinander: eine zum
       * Spielen, die naechste schon zum Hinschauen. Beim Ueben einer
       * einzelnen Zeile steht sie allein und gross. */
      sichtbar: schritt.ganz ? Math.min(2, this.zeilen.length) : 1,
      breitePx: masse.b, hoehePx: masse.h,
      tonKarte: this.k.tonKarte,
      einfarbig: this.k.fortschritt.buchNotenfarbe() === 'schwarz'
    });
    this.bild.haken(this.haken);
  };

  /* Der Weg durch das Lied, oben unter der Leiste.
   *
   * Links die gedruckten Zeilen, jede als kleines Abbild ihrer selbst —
   * dieselben Noten, nur klein und grau. Ein Strich verbindet sie, ein
   * gruener Haken sagt, was steht. Rechts, durch einen Pfeil abgesetzt,
   * das ganze Lied mit seinem Stern: das ist das Ziel, und es ist etwas
   * anderes als eine Zeile.
   *
   * Jedes Feld ist ein Knopf. So waehlt das Kind selbst, was es ueben
   * will, und muss dafuer nichts lesen: es tippt auf die Zeile, die es
   * gerade vor sich sieht. */
  Ueben.prototype._bandBauen = function () {
    var stand = this.k.fortschritt.buchStand(this.stueck.id, this.stimme);
    var selbst = this;
    var t = root.Sprachen ? root.Sprachen.t : function (k, u) { return u; };
    this.band.hidden = false;
    this.band.innerHTML = '';

    function fertig(i) {
      var s = selbst.schritte[i];
      return s.ganz ? !!stand.ganz : !!stand.zeilen[s.zeile];
    }

    var felder = [];
    this.schritte.forEach(function (schritt, i) {
      if (i > 0) {
        /* Vor dem ganzen Lied steht ein Pfeil, zwischen den Zeilen ein
         * Strich — er faerbt sich mit, sobald die Zeile davor steht. */
        selbst.band.appendChild(schritt.ganz ? pfeilTeil() : strichTeil(fertig(i - 1)));
      }
      var feld = document.createElement('button');
      feld.className = 'bandfeld' +
        (schritt.ganz ? ' ganz' : '') +
        (i === selbst.schritt ? ' hier' : '') +
        (fertig(i) ? ' geschafft' : '');
      feld.setAttribute('aria-pressed', i === selbst.schritt ? 'true' : 'false');
      feld.setAttribute('aria-label', schritt.ganz
        ? t('buch.band.ganz', 'Das ganze Lied')
        : t('buch.band.zeile', 'Zeile {n}').replace('{n}', schritt.zeile + 1));

      var kasten = document.createElement('span');
      kasten.className = 'bandbild';
      var svg = document.createElementNS(NS, 'svg');
      kasten.appendChild(svg);
      feld.appendChild(kasten);
      feld.appendChild(schritt.ganz ? sternTeil() : hakenTeil());

      selbst.k.tippBinden(feld, function () { selbst.waehleSchritt(i); });
      selbst.band.appendChild(feld);
      felder.push({ svg: svg, kasten: kasten, schritt: schritt });
    });

    /* Die Noten erst jetzt: vorher steht die Breite der Felder nicht
     * fest, und ein Notenbild richtet sich nach seinem Kasten. */
    var takte = this.stueck.stimmen[this.stimme].takte;
    felder.forEach(function (e) {
      var b = e.kasten.clientWidth, h = e.kasten.clientHeight;
      if (!b || !h) { return; }
      /* Gezeigt werden die ersten Takte der Zeile, nicht die ganze.
       * In Daumennagelgroesse waere eine volle Zeile ein Gekritzel;
       * zwei Takte bleiben Noten, die man wiedererkennt. Die uebrigen
       * Zeilen bleiben in der Liste stehen, damit Vorzeichen und
       * Taktart richtig weitergereicht werden. */
      var zi = e.schritt.ganz ? 0 : e.schritt.zeile;
      var takteImBild = e.schritt.ganz ? 3 : 2;
      /* Gekuerzt werden ALLE Zeilen, nicht nur die gezeigte: die
       * Notengroesse richtet sich nach der laengsten Zeile im Bild, und
       * eine volle Zeile daneben wuerde die gezeigte wieder klein
       * rechnen. Die Zeilen behalten ihren Anfangstakt, damit Vorzeichen
       * und Taktart richtig weitergereicht werden. */
      var zeilen = selbst.zeilen.map(function (z) {
        return [z[0], Math.min(z[0] + takteImBild, z[1])];
      });
      root.Satz.zeichne(e.svg, {
        takte: takte,
        zeilen: zeilen,
        zeigen: [zi, zi],
        sichtbar: 1,
        breitePx: b, hoehePx: h,
        tonKarte: selbst.k.tonKarte,
        einfarbig: true
      });
    });
  };

  var NS = 'http://www.w3.org/2000/svg';

  function strichTeil(gruen) {
    var i = document.createElement('i');
    i.className = 'bandstrich' + (gruen ? ' geschafft' : '');
    return i;
  }

  function pfeilTeil() {
    var i = document.createElement('i');
    i.className = 'bandpfeil';
    return i;
  }

  function hakenTeil() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'bandmarke bandhaken');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var kreis = document.createElementNS(NS, 'circle');
    kreis.setAttribute('cx', '12'); kreis.setAttribute('cy', '12'); kreis.setAttribute('r', '11');
    svg.appendChild(kreis);
    var pfad = document.createElementNS(NS, 'path');
    pfad.setAttribute('d', 'M6.6 12.5 10.4 16.3 17.5 8.5');
    svg.appendChild(pfad);
    return svg;
  }

  function sternTeil() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'bandmarke bandstern');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var pfad = document.createElementNS(NS, 'path');
    pfad.setAttribute('d', 'M12 1.6 14.7 9h7.7l-6.2 4.8 2.3 7.6L12 16.6 5.5 21.4l2.3-7.6L1.6 9h7.7z');
    svg.appendChild(pfad);
    return svg;
  }

  /* ---------------------------------------------------------------- */
  /* Start und Stop                                                    */
  /* ---------------------------------------------------------------- */

  Ueben.prototype.start = function () {
    if (!this.laeuft || this.phase !== 'bereit' || this.k.rueckmeldung.laeuft) { return; }
    if (!this.melodie || !this.melodie.noten.length) { return; }
    this.phase = 'spielt';
    this.k.knopfBereit(true);
    this.k.tempo.sperren(true);

    var bpm = this.k.tempo.bpm;
    var schlag = 60 / bpm;
    var vor = this.melodie.klicks.length ? -this.melodie.klicks[0].schlag : 1;
    this.startZeit = this.k.motor.jetzt() + 0.35 + vor * schlag;
    this.endeZeit = this.startZeit + this.melodie.schlaegeGesamt * schlag;

    var selbst = this;
    this.melodie.klicks.forEach(function (klick) {
      var wann = selbst.startZeit + klick.schlag * schlag;
      selbst.k.motor.klick(wann, klick.betont, klick.vor ? 1 : 0.85);
      selbst._punktPlanen(klick.punkt, wann, !!klick.go);
    });

    if (this.modus === 'mit') {
      this.k.motor.spieleMelodie(this.melodie, bpm, { wann: this.startZeit, lautstaerke: 0.9 });
      /* Die andere Stimme leise darunter: so hoert das Kind, dass die
       * beiden Stimmen zusammengehoeren. Gewertet wird sie nie. */
      if (this.melodie.begleitung && this.melodie.begleitung.length) {
        this.k.motor.spieleMelodie({ noten: this.melodie.begleitung }, bpm,
                                   { wann: this.startZeit, lautstaerke: LEISE });
      }
    }

    this.haken = [];
    this.gesehen = {};
    this.letzteAnnahme = 0;
    this.letzterAkzeptLauf = -1;
    this.k.tracker.reset();
    this.k.motor.erkennungZuruecksetzen();

    this._laufen(bpm);
    this._spaeter(function () { selbst._auswerten(); },
                  (this.endeZeit - this.k.motor.jetzt() + NACHLAUF) * 1000);
  };

  Ueben.prototype.stop = function () {
    if (!this.laeuft) { return; }
    this._alleStoppen();
    this.k.knopfBereit(false);
    this._punkteAus();
    this._bereitlegen(true);
  };

  Ueben.prototype._alleStoppen = function () {
    this.marke++;                       // schneidet alle geplanten Rueckrufe ab
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this.k.rueckmeldung.abbrechen();
    this.k.motor.allesStoppen();
    this.k.tracker.reset();
    this.k.motor.erkennungZuruecksetzen();
    this.k.tempo.sperren(false);
    this.k.grifffeld.classList.remove('pulsiert');
    this.phase = 'aus';
  };

  /* ---------------------------------------------------------------- */
  /* Der Durchlauf                                                     */
  /* ---------------------------------------------------------------- */

  /* Der Marker haengt am Puls, nicht am Kind: er steht auf der Note,
   * die JETZT zu hoeren ist — gemessen an der hoerbaren Uhr des Motors,
   * nicht an der Zeit, die der Browser gerade rechnet. Sonst liefe er dem
   * Klang um die Laufzeit des Ausgabewegs voraus.
   *
   * Beim ganzen Lied rueckt das Notenbild weich nach, und zwar so, dass
   * die neue Zeile OBEN steht, wenn ihre erste Note erklingt: der
   * Wechsel beginnt einen halben Schlag vorher. Wer spielt, liest ja
   * voraus — ein Bild, das erst im Moment des Einsatzes springt, reisst
   * das Auge genau dann weg, wenn es gebraucht wird. */
  Ueben.prototype._laufen = function (bpm, vonZeit) {
    var selbst = this;
    var schlag = 60 / bpm;
    var start = vonZeit || this.startZeit;
    var marke = this.marke;
    var letzte = null;
    var vorlauf = Math.min(0.5, 0.45 / schlag);          // in Schlaegen
    var zeileOben = null;
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); }

    function noteBei(sj) {
      var noten = selbst.melodie.noten;
      for (var i = 0; i < noten.length; i++) {
        if (sj >= noten[i].schlag && sj < noten[i].schlag + noten[i].dauer) { return noten[i]; }
      }
      return null;
    }

    function rahmen() {
      if (!selbst._nochAktuell(marke)) { return; }
      var sj = (selbst.k.motor.hoerbarJetzt() - start) / schlag;
      var noten = selbst.melodie.noten;
      var dran = noteBei(sj), klingt = null, i;
      for (i = 0; i < noten.length; i++) {
        if (!noten[i].pause && noten[i].schlag <= sj) { klingt = noten[i]; }
      }
      var bald = noteBei(sj + vorlauf);
      if (selbst.bild && bald && bald.zeile != null && bald.zeile !== zeileOben) {
        zeileOben = bald.zeile;
        selbst.bild.zeigeZeile(bald.zeile, false, vorlauf * schlag);
      }
      if (dran !== letzte) {
        letzte = dran;
        if (selbst.bild) {
          selbst.bild.marker(dran ? dran.ref : null);
        }
        if (klingt) { selbst._griffFuerTon(klingt.tonId); }
        /* Was zu tief liegt, um gehoert zu werden, bekommt sein
         * Haekchen, wenn der Marker darueber laeuft: das Kind spielt
         * die Note, nur das Mikrofon reicht nicht so weit hinunter. */
        if (dran && dran.ohneWertung && dran.ref && !selbst.gesehen[dran.ref]) {
          selbst.gesehen[dran.ref] = true;
          selbst.haken.push(dran.ref);
          if (selbst.bild) { selbst.bild.haken(selbst.haken); }
        }
      }
      if (sj > selbst.melodie.schlaegeGesamt + 0.5) { return; }
      selbst.rahmen = requestAnimationFrame(rahmen);
    }
    this.rahmen = requestAnimationFrame(rahmen);
  };

  /* ---------------------------------------------------------------- */
  /* Erkennung                                                         */
  /* ---------------------------------------------------------------- */

  Ueben.prototype.ereignisse = function (liste) {
    if (!this.laeuft || this.phase !== 'spielt') { return; }
    if (this.modus !== 'solo') { return; }        // beim Mitspielen wird nicht gewertet
    if (this.k.rueckmeldung.laeuft) { return; }

    for (var i = 0; i < liste.length; i++) {
      var e = liste[i];
      if (e.typ === 'kurz') { this._pruefeKlang(e.tonId, e.oktave, e.t, e.laufNr); }
      else if (e.typ === 'einsatz') {
        var jetzt = this.k.tracker.aktuelleKlasse();
        if (jetzt) { this._pruefeKlang(jetzt.tonId, jetzt.oktave, e.t, -jetzt.nr); }
      }
    }
  };

  Ueben.prototype._pruefeKlang = function (tonId, oktave, t, laufNr) {
    if (t - this.letzteAnnahme < 0.18) { return; }
    if (laufNr === this.letzterAkzeptLauf) { return; }
    if (oktave === 1) { return; }                 // ueberblasen bringt kein Haekchen

    var s = this.k.schwierigkeit();
    var vor = s.fensterVor != null ? s.fensterVor : 0.5;
    var nach = s.fensterNach != null ? s.fensterNach : 1.3;
    var sj = (t - this.startZeit) / (60 / this.k.tempo.bpm);

    for (var i = 0; i < this.wertbar.length; i++) {
      var n = this.wertbar[i];
      if (this.gesehen[n.ref]) { continue; }
      if (sj < n.schlag - vor) { break; }          // noch nicht dran
      if (sj > n.schlag + nach) { continue; }      // diese Note ist vorbei
      if (n.tonId !== tonId) { continue; }
      this.letzteAnnahme = t;
      this.letzterAkzeptLauf = laufNr;
      this.gesehen[n.ref] = true;
      if (n.ref) { this.haken.push(n.ref); }
      if (this.bild) { this.bild.haken(this.haken); }
      return;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Auswertung                                                        */
  /* ---------------------------------------------------------------- */

  Ueben.prototype._auswerten = function () {
    if (this.phase !== 'spielt') { return; }
    this.phase = 'fertig';
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this._punkteAus();
    this.k.knopfBereit(false);
    if (this.bild) { this.bild.marker(null); }

    var selbst = this, marke = this.marke;
    var schritt = this.schritte[this.schritt];

    // Vorgemacht — jetzt ist das Kind dran, mit derselben Stelle.
    if (this.modus === 'mit') {
      this.setzeModus('solo');
      this._spaeter(function () { selbst._bereitlegen(true); }, 700);
      return;
    }

    var offen = this.wertbar.filter(function (n) { return !selbst.gesehen[n.ref]; });
    if (!offen.length) { this._geschafft(); return; }

    /* Nicht alles gesessen. Beim ganzen Lied wird zuerst die Zeile
     * geuebt, in der das meiste liegengeblieben ist — dort liegt der
     * Grund, nicht im Lied als Ganzem. */
    if (schritt.ganz && this.zeilen.length > 1) {
      var zurueck = this._schwaechsteZeile(offen);
      if (zurueck != null) {
        this.schritt = zurueck;
        this.k.rueckmeldung.abbrechen();
        this._spaeter(function () { selbst._bereitlegen(); }, 600);
        return;
      }
    }

    // Kein Summer, kein rotes Etwas: noch einmal vormachen und wieder hin.
    this.setzeModus('mit');
    this.k.rueckmeldung.vorspielen(this.melodie, this.k.tempo.bpm, function (start) {
      selbst._laufen(selbst.k.tempo.bpm, start);
    }).then(function () {
      if (!selbst._nochAktuell(marke)) { return; }
      selbst.k.tempo.sperren(false);
      selbst._bereitlegen(true);
    });
  };

  Ueben.prototype._geschafft = function () {
    var selbst = this, marke = this.marke;
    var schritt = this.schritte[this.schritt];
    if (schritt.ganz) { this.k.fortschritt.notiereBuchGanz(this.stueck.id, this.stimme); }
    else { this.k.fortschritt.notiereBuchZeile(this.stueck.id, this.stimme, schritt.zeile); }
    this._bandBauen();

    this.k.rueckmeldung.jubel().then(function () {
      if (!selbst._nochAktuell(marke)) { return; }
      selbst.k.tempo.sperren(false);
      /* Weiter zum naechsten Schritt. Steht das ganze Lied, bleibt es
       * stehen — dann kann das Kind es noch einmal spielen oder mit dem
       * Blaetterknopf zum naechsten Lied gehen. */
      if (selbst.schritt < selbst.schritte.length - 1) { selbst.schritt++; }
      selbst._bereitlegen();
    });
  };

  /* In welcher Zeile ist am meisten liegengeblieben? */
  Ueben.prototype._schwaechsteZeile = function (offen) {
    var zaehler = {};
    offen.forEach(function (n) {
      if (n.zeile == null) { return; }
      zaehler[n.zeile] = (zaehler[n.zeile] || 0) + 1;
    });
    var beste = null, viel = 0;
    Object.keys(zaehler).forEach(function (z) {
      if (zaehler[z] > viel) { viel = zaehler[z]; beste = parseInt(z, 10); }
    });
    return beste;
  };

  /* ---------------------------------------------------------------- */
  /* Kleinkram                                                         */
  /* ---------------------------------------------------------------- */

  Ueben.prototype._griffFuer = function (index) {
    var klingend = this.melodie.noten.filter(function (n) { return !n.pause; });
    var n = klingend[Math.max(0, Math.min(klingend.length - 1, index))];
    if (n) { this._griffFuerTon(n.tonId); }
  };

  Ueben.prototype._griffFuerTon = function (tonId) {
    var ton = this.k.tonById(tonId);
    if (ton) { this.k.zeichneGriff(ton); }
  };

  Ueben.prototype._punktPlanen = function (index, wann, istGo) {
    var selbst = this;
    this._spaeter(function () {
      var p = selbst.k.punkte.children[index];
      if (!p) { return; }
      if (istGo) { p.classList.add('los'); }
      else { p.style.backgroundColor = 'var(--marker)'; p.classList.add('an'); }
      setTimeout(function () {
        p.classList.remove('an');
        p.classList.remove('los');
        p.style.backgroundColor = '';
      }, istGo ? 420 : 190);
    }, (wann - this.k.motor.hoerbarJetzt()) * 1000);
  };

  Ueben.prototype._punkteAus = function () {
    for (var i = 0; i < this.k.punkte.children.length; i++) {
      var p = this.k.punkte.children[i];
      p.classList.remove('an');
      p.classList.remove('los');
      p.style.backgroundColor = '';
    }
  };

  /** Nach einer Drehung des iPads neu setzen. */
  Ueben.prototype.neuZeichnen = function () {
    if (this.laeuft && this.stueck) { this._zeichnen(); }
  };

  root.Buch = Buch;
})(typeof globalThis !== 'undefined' ? globalThis : this);
