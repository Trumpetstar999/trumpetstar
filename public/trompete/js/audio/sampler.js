/* sampler.js — die echten Trompetentoene aus einer einzigen Datei.
 *
 * Quelle: Sample_Trompete.mp3, Mario Schulter, Yamaha Perinet-Trompete.
 * Aus den sieben Aufnahmen je Tonhoehe wurde die sauberste ausgewaehlt
 * (Stoerabstand, Stimmung, Ansprache von oben) und auf gleiche
 * empfundene Lautstaerke gebracht.
 *
 * Von jedem Ton stecken nur Ansprache und ein kurzer Schleifenabschnitt
 * in `audio/trumpet-sprite.m4a` — zusammen 11,7 Sekunden statt 109. Beim
 * Abspielen laeuft die Schleife weiter, solange der Ton stehen soll:
 *
 *   │◀── Ansprache ──▶│◀── Schleife ──▶│
 *    Anstoss, Aufbluehen  laeuft endlos    → Absetzen wird gerechnet
 *
 * Neun Toene in 49 kB, ein Netzwerkzugriff, ein Dekodiervorgang. Danach
 * startet jeder Ton in jeder Laenge ohne messbare Verzoegerung — was in
 * dieser App zwingend ist: das Metronom laeuft, und ein Vorbildton, der
 * zu spaet kommt, ist schlimmer als keiner.
 *
 * Die Zahlen unten stammen aus trompeten-sampler/src/lib/trumpetSampleMap.ts
 * und sind unveraendert. Wird die Sprite-Datei neu gebaut, muessen beide
 * Tabellen gemeinsam nachgezogen werden.
 */
(function (root, factory) {
  var S = factory();
  if (typeof module === 'object' && module.exports) { module.exports = S; }
  root.Sampler = S;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* start      Beginn des Tons (Anblasgeraeusch + natuerliche Ansprache)
   * loopStart  ab hier wird endlos wiederholt
   * loopEnd    Ende der Schleife
   * xfade      Laenge der Kreuzblende, die NACH dem Dekodieren gerechnet
   *            wird — siehe _blenden()
   * f0         gemessene Grundfrequenz der Schleife. Damit stimmt der
   *            Sampler exakt nach; die Aufnahme liegt bis zu 1,7 Cent daneben.
   *
   * Alle Zeiten in Sekunden — dadurch stimmen sie auch dann, wenn der
   * Browser beim Dekodieren auf seine eigene Abtastrate umrechnet. */
  var PROBEN = {
    c1: { f0: 232.53, start: 0.05000, loopStart: 0.92036, loopEnd: 1.24290, xfade: 0.05 },
    d1: { f0: 261.54, start: 1.26789, loopStart: 1.87819, loopEnd: 2.22995, xfade: 0.05 },
    e1: { f0: 293.83, start: 2.25494, loopStart: 2.99109, loopEnd: 3.43011, xfade: 0.05 },
    f1: { f0: 310.79, start: 3.45510, loopStart: 4.18143, loopEnd: 4.68016, xfade: 0.05 },
    g1: { f0: 348.98, start: 4.70515, loopStart: 5.41873, loopEnd: 5.84855, xfade: 0.05 },
    a1: { f0: 391.48, start: 5.87354, loopStart: 6.57138, loopEnd: 6.87791, xfade: 0.05 },
    h1: { f0: 439.90, start: 6.90290, loopStart: 8.06274, loopEnd: 8.53558, xfade: 0.05 },
    c2: { f0: 466.99, start: 8.56057, loopStart: 9.55900, loopEnd: 10.02154, xfade: 0.05 },
    d2: { f0: 522.89, start: 10.04653, loopStart: 11.24683, loopEnd: 11.70964, xfade: 0.05 }
  };

  /* Abklingen nach dem Absetzen, an der Aufnahme gemessen: -20 dB in
   * 135 ms. Der Klang selbst steckt in der Datei, nur das Absetzen
   * rechnet der Sampler — so ist jede Tonlaenge moeglich. */
  var RELEASE = 0.055;
  var RELEASE_SCHWANZ = 0.35;

  function Sampler(opt) {
    opt = opt || {};
    this.ctx = opt.ctx || null;
    this.url = opt.url || 'audio/trumpet-sprite.m4a';
    this.puffer = null;
    this.laedt = null;
  }

  Sampler.prototype.bereit = function () { return this.puffer !== null; };

  /** Kennt der Sampler eine Aufnahme dieses Namens? */
  Sampler.prototype.kennt = function (name) {
    return Object.prototype.hasOwnProperty.call(PROBEN, name);
  };

  /* ---------------------------------------------------------------- */
  /* Laden                                                             */
  /* ---------------------------------------------------------------- */

  /** Laedt und dekodiert die Sprite-Datei. Mehrfaches Aufrufen ist
   *  unschaedlich — geladen wird genau einmal. */
  Sampler.prototype.laden = function () {
    var selbst = this;
    if (this.laedt) { return this.laedt; }
    this.laedt = new Promise(function (aufl, ab) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', selbst.url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (xhr.status !== 200 && xhr.status !== 0) { ab(new Error(selbst.url + ' ' + xhr.status)); return; }
        function fertig(b) { selbst._blenden(b); selbst.puffer = b; aufl(b); }
        // Alte Safari-Versionen kennen nur die Callback-Form.
        var ergebnis = selbst.ctx.decodeAudioData(xhr.response, fertig,
          function (e) { ab(e || new Error('decode sprite')); });
        if (ergebnis && ergebnis.then) { ergebnis.then(fertig, ab); }
      };
      xhr.onerror = function () { ab(new Error('netz ' + selbst.url)); };
      xhr.send();
    });
    return this.laedt;
  };

  /** Blendet das Schleifenende auf den Schleifenanfang — einmalig nach
   *  dem Dekodieren.
   *
   *  Das MUSS hier passieren und nicht schon in der Datei: die
   *  AAC-Kodierung veraendert die Wellenform am Schleifenanfang anders
   *  als am Schleifenende. Eine vorher eingebrannte Blende passt danach
   *  nicht mehr, und die Schleife knackt bei jedem Durchlauf hoerbar
   *  (gemessen: +25 dB Hochtonstoss). Danach bleiben +3 dB — nichts
   *  Hoerbares.
   *
   *  Die Blende ist bewusst LINEAR und nicht leistungsgleich (cos/sin):
   *  beide Haelften sind hier fast dasselbe Signal und phasengleich, sie
   *  addieren sich also. Eine leistungsgleiche Blende hoebe den Pegel in
   *  der Mitte um 3 dB an — einmal je Schleifendurchlauf, also drei- bis
   *  sechsmal in der Sekunde. Das klingt wie starkes Vibrato. */
  Sampler.prototype._blenden = function (buf) {
    var sr = buf.sampleRate;
    for (var ch = 0; ch < buf.numberOfChannels; ch++) {
      var d = buf.getChannelData(ch);
      for (var name in PROBEN) {
        if (!Object.prototype.hasOwnProperty.call(PROBEN, name)) { continue; }
        var s = PROBEN[name];
        var S = Math.round(s.loopStart * sr);
        var E = Math.round(s.loopEnd * sr);
        var X = Math.min(Math.round(s.xfade * sr), S - Math.round(s.start * sr), E - S);
        if (X <= 1) { continue; }
        for (var i = 0; i < X; i++) {
          var t = i / (X - 1);
          d[E - X + i] = d[E - X + i] * (1 - t) + d[S - X + i] * t;
        }
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /* Abspielen                                                         */
  /* ---------------------------------------------------------------- */

  /** Spielt eine Aufnahme mit fester Dauer.
   *
   *  name          Schluessel in PROBEN, zugleich die Ton-ID ('c1' … 'd2')
   *  o.frequenzHz  gewuenschte KLINGENDE Frequenz. Ohne Angabe klingt die
   *                Aufnahme so, wie sie eingespielt wurde.
   *  o.wann        Startzeit auf der Uhr des AudioContext
   *  o.dauer       klingende Dauer in Sekunden (ohne Ausklang)
   *  o.ziel        Knoten, an den gehaengt wird
   *
   *  Rueckgabe ist die Quelle — der Motor merkt sie sich fuer den Not-Aus. */
  Sampler.prototype.spiele = function (name, o) {
    o = o || {};
    var s = PROBEN[name];
    if (!s || !this.puffer || !this.ctx) { return null; }

    var jetzt = this.ctx.currentTime;
    var wann = Math.max(o.wann != null ? o.wann : jetzt + 0.03, jetzt);
    var dauer = Math.max(o.dauer != null ? o.dauer : 1.0, 0.05);
    var ziel = o.ziel || this.ctx.destination;

    var q = this.ctx.createBufferSource();
    q.buffer = this.puffer;
    // Stimmt die Aufnahme exakt nach und verschiebt sie auf die
    // gewuenschte Hoehe. Bei den neun aufgenommenen Toenen ist das eine
    // Korrektur von wenigen Cent, kein hoerbares Verschieben.
    var rate = o.frequenzHz ? (o.frequenzHz / s.f0) : 1;
    q.playbackRate.value = rate;
    q.loop = true;
    q.loopStart = s.loopStart;
    q.loopEnd = s.loopEnd;

    /* Wird die Aufnahme tiefer abgespielt — fuer Horn und Tenorhorn um
     * bis zu eine Oktave — laeuft auch die Ansprache langsamer. Aus dem
     * kurzen Anstoss wuerde ein Anschwellen, und eine Viertelnote waere
     * vorbei, bevor der Ton steht. Deshalb wird spaeter in der Ansprache
     * eingesetzt, genau so weit, dass sie in ECHTER Zeit gleich lang
     * bleibt. Der Anstoss selbst bleibt dabei erhalten. */
    var ab = s.start;
    if (rate < 0.98) { ab = s.loopStart - (s.loopStart - s.start) * rate; }

    var g = this.ctx.createGain();
    var laut = o.lautstaerke != null ? o.lautstaerke : 1;
    g.gain.setValueAtTime(laut, wann);
    // Absetzen: dieselbe Kurve wie in der Aufnahme gemessen.
    g.gain.setTargetAtTime(0, wann + dauer, RELEASE);
    q.connect(g);
    g.connect(ziel);

    q.start(wann, ab);
    q.stop(wann + dauer + RELEASE_SCHWANZ);
    return q;
  };

  /** Wie lange klingt ein Ton nach dem Absetzen noch nach? */
  Sampler.prototype.ausklang = function () { return RELEASE_SCHWANZ; };

  Sampler.PROBEN = PROBEN;
  return Sampler;
});
