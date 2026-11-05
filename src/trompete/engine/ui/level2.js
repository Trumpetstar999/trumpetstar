/* Kopie aus der App "Trompete fuer Erwachsene" (app/js/ui/level2.js), gebaut von
 * tools/mach-lovable.js. Bitte nicht hier aendern, sondern dort. */
/* level2.js — alles, was im Takt laeuft.
 *
 *   'r'   Rhythmus-Training: Takte aus selbst gewaehlten Bausteinen,
 *         auf einem Ton, im Tonmaterial oder getippt
 *   '2a'  Melodie, zwei Takte
 *   '2b'  Melodie, vier Takte
 *
 * Die Uebung steht bereit. Start: ein Takt Vorzaehler — der letzte
 * Schlag ist gruen — und dann laeuft das Stueck IM TEMPO durch. Der
 * Marker wandert mit dem Puls, der Klick laeuft hoerbar mit, und jede
 * Note, die zur rechten Zeit richtig kommt, bekommt ihr Haekchen.
 * Stopp haelt jederzeit an.
 *
 * Zwei Betriebsarten:
 *
 *   Mitspielen  Die App spielt die Uebung mit — zum Kennenlernen.
 *               Gewertet wird hier nicht: das Mikrofon hoert den
 *               eigenen Lautsprecher mit und koennte die App nicht vom
 *               Menschen unterscheiden.
 *   Solo        Nur der Klick laeuft. Jetzt wird gewertet.
 *
 * Wer "Mitspielen" gewaehlt hat, bekommt jede neue Uebung erst
 * vorgespielt und danach solo — erst hoeren, dann selber. Wer "Solo"
 * gewaehlt hat, spielt jede neue Uebung gleich vom Blatt. Die App
 * wechselt nach einem Durchgang nie ungefragt die Uebung: noch einmal,
 * schneller oder weiter entscheidet der Mensch.
 */
(function (root) {
  'use strict';

  var T = function (s, u, w) { return root.Sprachen.t(s, u, w); };

  var SAUBER_BIS_TEMPOTIPP = 3;   // nach drei sauberen Durchlaeufen: schneller?
  var NACHLAUF = 1.2;             // Sekunden Zugabe am Schluss
  var ZEIT_GENAU_MS = 35;         // darunter gilt das Timing als genau
  var MIN_ABSTAND = 0.18;         // Sekunden zwischen zwei angenommenen Noten

  /* Wieviele Schlaege eine Note zu frueh und zu spaet kommen darf,
   * steht in der Schwierigkeitsstufe (toene.json). */
  function fenster(k) {
    var s = k.schwierigkeit();
    return { vor: s.fensterVor != null ? s.fensterVor : 0.3,
             nach: s.fensterNach != null ? s.fensterNach : 0.4 };
  }

  function Level2(k) {
    this.k = k;
    this.stufe = '2a';
    this.laeuft = false;          // Bereich ist offen
    this.phase = 'aus';           // aus | bereit | vorzaehler | spielt | fertig
    this.modus = 'mit';           // gilt fuer den naechsten Durchgang
    this.startModus = 'mit';      // was der Mensch gewaehlt hat
    this.eingabe = 'trompete';    // 'trompete' | 'tippen'
    this.melodie = null;
    this.seed = -1;
    this.letzterSeed = -1;
    this.letzteRhythmen = [];
    this.saubereInFolge = 0;
    this.marke = 0;
    this.bild = null;
    this.haken = [];
    this.zeiten = {};
    this.letzteAnnahme = -1;
    this.letzteMarke = null;
    this.letzterEinsatz = -1;
    this.mitGelaufen = false;
    this.vorzaehlZeiten = [];
    this.latenzProben = [];
    this.latenz = 0;
    this.tippNr = 0;
  }

  Level2.prototype._spaeter = function (fn, ms) {
    var selbst = this, marke = this.marke;
    return setTimeout(function () {
      if (selbst.marke === marke && selbst.laeuft) { fn(); }
    }, Math.max(0, ms));
  };
  Level2.prototype._nochAktuell = function (marke) {
    return this.marke === marke && this.laeuft;
  };

  /* ---------------------------------------------------------------- */

  /* `feste` ist gesetzt, wenn eine bestimmte Uebung gespielt werden
   * soll. Dann wird nicht gewuerfelt und nicht gewechselt. */
  Level2.prototype.starten = function (stufe, feste) {
    this.marke++;
    this.stufe = stufe;
    this.festeMelodie = feste || null;
    this.laeuft = true;
    this.saubereInFolge = 0;
    this.letzteRhythmen = [];
    this.eingabe = (stufe === 'r') ? this.k.fortschritt.rhythmus().eingabe : 'trompete';
    this.k.punkte.classList.remove('aus');
    this.k.tempo.zeigen(true);
    this.startModus = this.k.fortschritt.modus();
    this.modus = this.startModus;
    this._neueUebung();
  };

  Level2.prototype.beenden = function () {
    this.marke++;
    this.laeuft = false;
    this.festeMelodie = null;
    this.phase = 'aus';
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this.k.tempo.sperren(false);
    this.k.grifffeld.classList.remove('pulsiert');
    this.k.knopfBereit(false);
    this._punkteAus();
  };

  /* Naechste Uebung: die laufende abbrechen und eine neue bereitlegen.
   * Alles Geplante muss dabei verstummen — Web Audio plant Klaenge im
   * Voraus, sonst spielt das Metronom der alten Uebung in die neue
   * hinein. */
  Level2.prototype.weiter = function () {
    if (!this.laeuft) { return; }
    this.marke++;
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this.k.rueckmeldung.abbrechen();
    this.k.motor.allesStoppen();
    this.k.tracker.reset();
    this.k.motor.erkennungZuruecksetzen();
    this.k.tempo.sperren(false);
    this.phase = 'aus';
    this._neueUebung();
  };

  /** vomMenschen: der Knopf in der Leiste. Nur dann wird die Wahl
   *  gemerkt — der Wechsel auf Solo nach dem Mitspielen ist keine. */
  Level2.prototype.setzeModus = function (art, vomMenschen) {
    this.modus = (art === 'solo') ? 'solo' : 'mit';
    if (vomMenschen) {
      this.startModus = this.modus;
      this.k.fortschritt.setzeModus(this.modus);
    }
    this.k.zeigeModus(this.modus);
    if (this.phase === 'bereit') { this._bereitText(); }
  };

  /* ---------------------------------------------------------------- */
  /* Uebung waehlen und bereitlegen                                    */
  /* ---------------------------------------------------------------- */

  /** Die Toene, aus denen die naechste Uebung gebaut wird. */
  Level2.prototype._material = function () {
    if (this.stufe === 'r') {
      var r = this.k.fortschritt.rhythmus();
      if (r.material === 'einton') { return [r.ton]; }
    }
    return this.k.fortschritt.vorrat();
  };

  Level2.prototype._neueUebung = function (wiederholen) {
    if (!this.laeuft) { return; }

    if (!wiederholen) {
      if (this.festeMelodie) {
        this.melodie = this.festeMelodie;
        this.seed = this.festeMelodie.seed;
      } else if (this.stufe === 'r') {
        var r = this.k.fortschritt.rhythmus();
        this.seed = this.k.fortschritt.naechsteUebung('r', this.letzterSeed);
        this.melodie = root.Generator.erzeugeRhythmus({
          toene: this.k.toene, vorratIds: this._material(),
          bausteine: r.bausteine, zaehler: r.zaehler, takte: r.takte,
          seed: this.seed, vermeideRhythmus: this.letzteRhythmen
        });
      } else {
        var vorrat = this._material();
        var lied = this.k.liedFuer(this.stufe, vorrat);
        if (lied && lied.seed !== this.letzterSeed) {
          this.melodie = lied;
          this.seed = lied.seed;
        } else {
          this.seed = this.k.fortschritt.naechsteUebung(this.stufe, this.letzterSeed);
          this.melodie = root.Generator.erzeuge({
            toene: this.k.toene, vorratIds: vorrat, stufe: this.stufe,
            seed: this.seed, vermeideRhythmus: this.letzteRhythmen
          });
        }
      }
      this.letzterSeed = this.seed;
      if (!this.melodie) { return; }
      if (this.melodie.rhythmus) {
        this.letzteRhythmen.push(this.melodie.rhythmus);
        while (this.letzteRhythmen.length > 2) { this.letzteRhythmen.shift(); }
      }
      this.mitGelaufen = false;
      this.modus = this.startModus;
      this.k.zeigeModus(this.modus);
      /* Geprueft wird gegen die Toene DIESER Uebung — so bleibt die
       * Toleranz so grosszuegig, wie das Material es erlaubt. */
      this.k.hoerenAuf(this.melodie.vorrat);
      this._titel();
    }

    this.haken = [];
    this.zeiten = {};
    /* Das Ergebnis gehoert zum abgeschlossenen Durchgang. */
    this.letztesErgebnis = null;
    this.phase = 'bereit';
    this._punkteZahl();
    this._zeichnen(-1);
    this._griffFuerKlingend(0);
    this.k.tempo.sperren(false);
    this.k.knopfBereit(false);
    this._punkteAus();
    this._bereitText();
    this.k.el('umblaettern').classList.remove('lockt');
  };

  Level2.prototype._titel = function () {
    var z = this.melodie.zaehler || 4;
    if (this.stufe === 'r') {
      this.k.titel(T('titel.rhythmus', 'Rhythmus · {takt}', { takt: z + '/4' }));
    } else if (this.melodie.istLied && this.melodie.name) {
      this.k.titel(this.melodie.name);
    } else {
      this.k.titel(T('titel.melodie', 'Melodie'));
    }
  };

  Level2.prototype._bereitText = function () {
    var text;
    if (this.modus !== 'solo') {
      text = T('l2.bereit.mit', 'Mitspielen: Die App spielt die Übung mit. Zum Kennenlernen – ohne Wertung.');
    } else if (this.eingabe === 'tippen') {
      text = T('l2.bereit.tippen', 'Solo: Rhythmus auf dem Tippfeld oder mit der Leertaste klopfen.');
    } else {
      text = T('l2.bereit.solo', 'Solo: Nur das Metronom läuft. Jetzt wird gewertet.');
    }
    if (this.melodie && this.melodie.istLied && this.melodie.name && !this.mitGelaufen) {
      text = T('l2.lied', 'Bekanntes Stück: {name}', { name: this.melodie.name }) + ' · ' + text;
    }
    this.k.status(text);
  };

  /* ---------------------------------------------------------------- */
  /* Start und Stopp                                                   */
  /* ---------------------------------------------------------------- */

  Level2.prototype.start = function () {
    if (!this.laeuft || this.phase !== 'bereit' || this.k.rueckmeldung.laeuft) { return; }
    if (!this.melodie) { return; }
    this.phase = 'vorzaehler';
    this.k.knopfBereit(true);
    this.k.tempo.sperren(true);
    this.k.el('umblaettern').classList.remove('lockt');

    var bpm = this.k.tempo.bpm;
    var schlag = 60 / bpm;
    var z = this.melodie.zaehler || 4;
    /* Ein Takt Vorzaehler; im Zweiertakt zwei, sonst waere er zu kurz,
     * um das Tempo aufzunehmen. */
    var vor = z < 3 ? z * 2 : z;
    var t0 = this.k.motor.jetzt() + 0.35;
    this.startZeit = t0 + vor * schlag;
    this.endeZeit = this.startZeit + this.melodie.schlaegeGesamt * schlag;

    this.vorzaehlZeiten = [];
    for (var s = 0; s < vor; s++) {
      this.k.motor.klick(t0 + s * schlag, s % z === 0);
      this._punktPlanen(s % z, t0 + s * schlag, s === vor - 1);
      this.vorzaehlZeiten.push(t0 + s * schlag);
    }
    // Der Puls laeuft durch das ganze Stueck.
    for (var b = 0; b < this.melodie.schlaegeGesamt; b++) {
      this.k.motor.klick(this.startZeit + b * schlag, b % z === 0, 0.85);
      this._punktPlanen(b % z, this.startZeit + b * schlag, false);
    }
    if (this.modus === 'mit') {
      this.k.motor.spieleMelodie(this.melodie, bpm, { wann: this.startZeit, lautstaerke: 0.9 });
    }

    this.haken = [];
    this.zeiten = {};
    this.letztesErgebnis = null;
    this.letzteAnnahme = -1;
    this.letzteMarke = null;
    this.letzterEinsatz = -1;
    this.latenzProben = [];
    this.latenz = this._latenzAnfang();
    this.k.tracker.reset();
    this.k.motor.erkennungZuruecksetzen();
    this._zeichnen(-1);
    this.k.status(T('l2.vorzaehler', 'Vorzähler …'), 'aktiv');

    var selbst = this;
    this._spaeter(function () { selbst._laufen(bpm); },
                  (this.startZeit - this.k.motor.jetzt()) * 1000);
    this._spaeter(function () { selbst._auswerten(); },
                  (this.endeZeit - this.k.motor.jetzt() + NACHLAUF) * 1000);
  };

  Level2.prototype.stop = function () {
    if (!this.laeuft) { return; }
    this.marke++;                       // schneidet alle geplanten Rueckrufe ab
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    /* Und den KLANG anhalten. Web Audio plant Toene im Voraus: was
     * bereits eingeplant ist, erklingt weiter, auch wenn hier laengst
     * nichts mehr laeuft. */
    this.k.motor.allesStoppen();
    this.k.knopfBereit(false);
    this._punkteAus();
    this._neueUebung(true);
  };

  /* ---------------------------------------------------------------- */
  /* Laufzeit Lautsprecher → Mikrofon                                  */
  /* ---------------------------------------------------------------- */
  /* Wer "auf den Klick" spielt, spielt auf den Klick, den er HOERT —
   * und der kommt spaeter aus dem Lautsprecher, als er gerechnet wurde.
   * Dazu braucht der eigene Ton seine Zeit durchs Mikrofon. Zusammen
   * sind das ueber die eingebauten Wandler einige zehn Millisekunden,
   * ueber eine Bluetooth-Box mehrere hundert. Ohne Ausgleich stuende in
   * der Auswertung immer "zu spaet", auch bei tadellosem Spiel.
   *
   * Messen laesst sich das ohne jede Bedienung: waehrend des
   * Vorzaehlers hoert das Mikrofon die eigenen Klicks. Der Abstand
   * zwischen geplantem und gehoertem Klick ist genau die gesuchte
   * Laufzeit. Mit Kopfhoerern kommt nichts an; dann gilt die letzte
   * Messung oder, wenn es nie eine gab, die Angabe des Browsers. */

  Level2.prototype._latenzAnfang = function () {
    var gemerkt = this.k.fortschritt.latenz();
    return (typeof gemerkt === 'number') ? gemerkt : this.k.motor.ausgabeVerzug();
  };

  Level2.prototype._latenzMessen = function (t) {
    var grenze = Math.min(0.35, 0.8 * 60 / this.k.tempo.bpm);
    for (var i = this.vorzaehlZeiten.length - 1; i >= 0; i--) {
      var d = t - this.vorzaehlZeiten[i];
      if (d < 0) { continue; }
      if (d <= grenze) { this.latenzProben.push(d); }
      break;
    }
    if (this.latenzProben.length < 2) { return; }
    /* Zwei Messungen, die zusammenpassen, genuegen. Wer waehrend des
     * Vorzaehlers schon einblaest, erzeugt Einsaetze, die nicht zu den
     * Klicks gehoeren — die streuen und fallen hier heraus. */
    var p = this.latenzProben.slice().sort(function (a, b) { return a - b; });
    var mitte = p[Math.floor(p.length / 2)];
    var nah = p.filter(function (x) { return Math.abs(x - mitte) <= 0.03; });
    if (nah.length < 2) { return; }
    var summe = 0;
    for (var j = 0; j < nah.length; j++) { summe += nah[j]; }
    this.latenz = summe / nah.length;
    var gemerkt = this.k.fortschritt.latenz();
    if (typeof gemerkt !== 'number' || Math.abs(gemerkt - this.latenz) > 0.008) {
      this.k.fortschritt.setzeLatenz(this.latenz);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Der Durchlauf: der Marker haengt am Puls, nicht am Menschen       */
  /* ---------------------------------------------------------------- */

  Level2.prototype._laufen = function (bpm) {
    this.phase = 'spielt';
    this.k.status(this.modus === 'solo' ? T('l2.laeuft.solo', 'Solo …')
                                        : T('l2.laeuft.mit', 'Mitspielen …'), 'aktiv');
    this._markerMitlaufen(this.startZeit, bpm, true);
  };

  /* ---------------------------------------------------------------- */
  /* Erkennung: richtiger Ton zur richtigen Zeit                       */
  /* ---------------------------------------------------------------- */

  Level2.prototype.ereignisse = function (liste) {
    if (!this.laeuft) { return; }
    if (this.phase !== 'spielt' && this.phase !== 'vorzaehler') { return; }
    var schlag = 60 / this.k.tempo.bpm;
    /* Ab hier gehoert ein Klang zum Stueck: die erste Note darf einen
     * halben Schlag zu frueh kommen. Davor ist Vorzaehler. */
    var abHier = this.startZeit - 0.5 * schlag;
    var wertet = this.modus === 'solo' && this.eingabe !== 'tippen' && !this.k.rueckmeldung.laeuft;

    for (var i = 0; i < liste.length; i++) {
      var e = liste[i];
      if (e.typ === 'einsatz') {
        this.letzterEinsatz = e.t;
        if (e.t < abHier) { this._latenzMessen(e.t); continue; }
        if (!wertet) { continue; }
        /* Ein Einsatz mitten in einem laufenden Ton: ein Zungenstoss
         * auf derselben Tonhoehe reisst den Tonlauf nicht ab, ist aber
         * trotzdem eine neue Note. */
        var jetzt = this.k.tracker.aktuelleKlasse();
        if (jetzt && !jetzt.fremd) {
          this._pruefeKlang(jetzt.tonId, jetzt.oktave, e.t - this.latenz, 'e' + e.t);
        }
      } else if (e.typ === 'kurz') {
        /* Was nur ueber die Hintergrund-Tabelle erkannt wurde, ist kein
         * Ton dieser Uebung — oder der richtige, aber zu weit daneben. */
        if (e.t < abHier || !wertet || e.fremd) { continue; }
        /* Der Tonlauf beginnt erst, wenn die Tonhoehe steht — ein paar
         * Hundertstel nach dem Anstoss. Fuers Timing zaehlt der Anstoss
         * selbst, wenn er dazu gehoert. */
        var t = e.t;
        if (this.letzterEinsatz > t - 0.12 && this.letzterEinsatz < t + 0.06) { t = this.letzterEinsatz; }
        this._pruefeKlang(e.tonId, e.oktave, t - this.latenz, 'k' + e.laufNr);
      }
    }
  };

  /** Getippt: Finger auf dem Tippfeld oder die Leertaste. */
  Level2.prototype.tipp = function () {
    if (!this.laeuft || this.eingabe !== 'tippen' || this.modus !== 'solo') { return; }
    if (this.phase !== 'spielt' && this.phase !== 'vorzaehler') { return; }
    var t = this.k.motor.jetzt();
    if (t < this.startZeit - 0.5 * 60 / this.k.tempo.bpm) { return; }
    this.tippNr++;
    /* Der Finger folgt dem Klick, den das Ohr hoert — und der kommt um
     * den Ausgabeweg spaeter als geplant. */
    this._pruefeKlang(null, 0, t - this.k.motor.ausgabeVerzug(), 't' + this.tippNr);
  };

  /** Das Zeitfenster der i-ten klingenden Note, in Schlaegen.
   *
   *  Es reicht nie weiter als bis zur Mitte zur Nachbarnote. Sonst
   *  ueberlappten sich die Fenster zweier Achtel, und ein Anstoss
   *  koennte fuer beide gelten — dann waere jeder Rhythmus richtig,
   *  solange nur die Zahl der Noten stimmt. */
  Level2.prototype._fenster = function (kl, i) {
    var f = fenster(this.k);
    var b = kl[i].schlag;
    var vor = f.vor, nach = f.nach;
    if (i > 0) { vor = Math.min(vor, (b - kl[i - 1].schlag) / 2); }
    if (i < kl.length - 1) { nach = Math.min(nach, (kl[i + 1].schlag - b) / 2); }
    return { von: b - vor, bis: b + nach };
  };

  /** hoehe: die gehoerte Tonhoehe — oder null, wenn getippt wurde und
   *  nur der Zeitpunkt zaehlt. t ist bereits um die Laufzeit bereinigt. */
  Level2.prototype._pruefeKlang = function (hoehe, oktave, t, marke) {
    if (t - this.letzteAnnahme < MIN_ABSTAND) { return; }
    if (marke === this.letzteMarke) { return; }
    // Ueberblasen ist kein Fehler — es bringt nur kein Haekchen.
    if (oktave === 1) { return; }

    var kl = this.klingend();
    var schlag = 60 / this.k.tempo.bpm;
    var sj = (t - this.startZeit) / schlag;

    /* Die erste noch offene Note, deren Zeitfenster den Klang enthaelt
     * und deren Tonhoehe stimmt. */
    for (var i = 0; i < kl.length; i++) {
      if (this.haken.indexOf(i) >= 0) { continue; }
      var w = this._fenster(kl, i);
      if (sj < w.von) { break; }                  // noch nicht dran
      if (sj > w.bis) { continue; }               // diese Note ist vorbei
      if (hoehe !== null && this.k.hoehe(kl[i].tonId) !== hoehe) { continue; }
      this.letzteAnnahme = t;
      this.letzteMarke = marke;
      this.haken.push(i);
      this.zeiten[i] = sj - kl[i].schlag;
      this.neuZeichnen();
      return;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Auswertung                                                        */
  /* ---------------------------------------------------------------- */

  Level2.prototype._auswerten = function () {
    if (this.phase !== 'spielt' && this.phase !== 'vorzaehler') { return; }
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); this.rahmen = null; }
    this._punkteAus();
    this.k.knopfBereit(false);
    this.k.tempo.sperren(false);
    this.phase = 'bereit';

    var kl = this.klingend();

    /* Beim Mitspielen wird nicht gewertet — danach kommt der
     * Solo-Durchgang. */
    if (this.modus === 'mit') {
      this.mitGelaufen = true;
      this.modus = 'solo';
      this.k.zeigeModus('solo');
      this._zeichnen(-1);
      this.k.status(T('l2.nachMit', 'Jetzt solo: Start drücken, wenn du bereit bist.'));
      return;
    }

    var getroffen = this.haken.length;
    var alle = kl.length;
    var schlag = 60 / this.k.tempo.bpm;

    /* Mittlere Abweichung vom Schlag, in Millisekunden. */
    var summe = 0, anzahl = 0;
    for (var i in this.zeiten) {
      if (Object.prototype.hasOwnProperty.call(this.zeiten, i)) { summe += this.zeiten[i]; anzahl++; }
    }
    var mittelMs = anzahl ? (summe / anzahl) * schlag * 1000 : 0;

    this.letztesErgebnis = {
      getroffen: getroffen, noten: alle, mittelMs: mittelMs,
      urteil: { fall: getroffen >= alle ? 'sauber' : (getroffen === 0 ? 'nichts' : 'teils') }
    };
    this.k.fortschritt.notiereUebung(this.stufe, this.seed, alle - getroffen);
    this._zeichnen(-1);

    if (getroffen === 0) {
      this.saubereInFolge = 0;
      this.k.status(this.eingabe === 'tippen'
        ? T('l2.nichts.tippen', 'Kein Tippen erkannt.')
        : T('l2.nichts', 'Keine Note erkannt. Näher ans Mikrofon – oder erst einmal mitspielen.'), 'achtung');
      return;
    }

    var text = getroffen >= alle
      ? T('l2.sauber', 'Alle {n} Noten getroffen.', { n: alle })
      : T('l2.teils', '{g} von {n} Noten getroffen.', { g: getroffen, n: alle });
    if (anzahl >= 2) {
      var ms = Math.round(Math.abs(mittelMs) / 10) * 10;
      if (Math.abs(mittelMs) < ZEIT_GENAU_MS) { text += ' ' + T('zeit.genau', 'Timing genau.'); }
      else if (mittelMs < 0) { text += ' ' + T('zeit.frueh', 'Im Schnitt {ms} ms zu früh.', { ms: ms }); }
      else { text += ' ' + T('zeit.spaet', 'Im Schnitt {ms} ms zu spät.', { ms: ms }); }
    }

    if (getroffen < alle) {
      this.saubereInFolge = 0;
      this.k.status(text, 'achtung');
      return;
    }

    /* Nur ein vollstaendiger Solo-Durchgang zaehlt fuer das Tonmaterial
     * — und nur dort, wo es um Toene geht: beim Rhythmus-Training auf
     * einem Ton oder beim Tippen sagt ein sauberer Durchgang nichts
     * darueber, ob ein Ton sitzt. */
    if (this.stufe !== 'r') {
      var selbst = this, gezaehlt = {};
      kl.forEach(function (n) {
        if (gezaehlt[n.tonId]) { return; }
        gezaehlt[n.tonId] = true;
        selbst.k.fortschritt.notiere(n.tonId, true);
      });
    }
    this.saubereInFolge++;
    if (this.saubereInFolge >= SAUBER_BIS_TEMPOTIPP && this.k.tempo.bpm < root.Tempo.MAX) {
      this.saubereInFolge = 0;
      text += ' ' + T('l2.tempoTipp', 'Dreimal sauber – Zeit für ein höheres Tempo?');
    } else {
      text += ' ' + T('l2.weiter', 'Noch einmal oder „Nächste Übung“.');
    }
    this.k.status(text, 'gut');
    this.k.el('umblaettern').classList.add('lockt');
  };

  /* ---------------------------------------------------------------- */
  /* Darstellung                                                       */
  /* ---------------------------------------------------------------- */

  Level2.prototype._zeichnen = function (markerIndex) {
    this.letzterMarker = markerIndex;
    this.bild = this.k.zeichneNote(this.melodie, null, markerIndex, this.haken, this.zeiten);
    return this.bild;
  };
  /** Dasselbe Bild noch einmal — nach einem Haekchen, nach dem Drehen
   *  des Geraets, nach dem Umschalten einer Hilfe. */
  Level2.prototype.neuZeichnen = function () {
    if (!this.melodie) { return; }
    this._zeichnen(this.letzterMarker === undefined ? -1 : this.letzterMarker);
  };

  Level2.prototype.klingend = function () {
    return this.melodie.noten.filter(function (n) { return !n.pause; });
  };

  Level2.prototype._griffFuerKlingend = function (kIndex) {
    var kl = this.klingend();
    var n = kl[Math.max(0, Math.min(kl.length - 1, kIndex))];
    if (n) { this.k.zeigeTon(this.k.tonById(n.tonId)); }
  };

  /** So viele Punkte, wie der Takt Schlaege hat. */
  Level2.prototype._punkteZahl = function () {
    var z = (this.melodie && this.melodie.zaehler) || 4;
    for (var i = 0; i < this.k.punkte.children.length; i++) {
      this.k.punkte.children[i].hidden = i >= z;
    }
  };

  Level2.prototype._punktPlanen = function (index, wann, istLos) {
    var selbst = this;
    this._spaeter(function () {
      var p = selbst.k.punkte.children[index];
      if (!p) { return; }
      p.classList.add(istLos ? 'los' : 'an');
      setTimeout(function () {
        p.classList.remove('an');
        p.classList.remove('los');
      }, istLos ? 420 : 190);
    }, (wann - this.k.motor.jetzt()) * 1000);
  };

  Level2.prototype._punkteAus = function () {
    for (var i = 0; i < this.k.punkte.children.length; i++) {
      var p = this.k.punkte.children[i];
      p.classList.remove('an');
      p.classList.remove('los');
    }
  };

  /** Der Marker wandert mit dem Puls von Note zu Note, und das
   *  Griffbild zeigt jeweils den Griff der Note, die gerade dran ist. */
  Level2.prototype._markerMitlaufen = function (start, bpm, nurBeimSpielen) {
    var selbst = this;
    var schlag = 60 / bpm;
    var letzter = -2;
    var marke = this.marke;
    if (this.rahmen) { cancelAnimationFrame(this.rahmen); }

    function rahmen() {
      if (!selbst._nochAktuell(marke)) { return; }
      if (nurBeimSpielen && selbst.phase !== 'spielt') { return; }
      var sj = (selbst.k.motor.jetzt() - start) / schlag;
      var index = -1, kIndex = -1, k = 0;
      for (var i = 0; i < selbst.melodie.noten.length; i++) {
        var n = selbst.melodie.noten[i];
        if (sj >= n.schlag && sj < n.schlag + n.dauer) {
          index = i; kIndex = n.pause ? -1 : k; break;
        }
        if (!n.pause) { k++; }
      }
      if (index !== letzter) {
        letzter = index;
        selbst._zeichnen(index);
        if (kIndex >= 0) { selbst._griffFuerKlingend(kIndex); }
      }
      if (sj > selbst.melodie.schlaegeGesamt + 0.5) { return; }
      selbst.rahmen = requestAnimationFrame(rahmen);
    }
    this.rahmen = requestAnimationFrame(rahmen);
  };

  root.Level2 = Level2;
})(typeof globalThis !== 'undefined' ? globalThis : this);
