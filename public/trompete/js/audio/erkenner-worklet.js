/* erkenner-worklet.js — laeuft im AudioWorkletGlobalScope.
 *
 * Diese Datei wird NICHT direkt geladen. motor.js holt sich den Text
 * von dsp.js und diesen hier, klebt beides zusammen und uebergibt das
 * als Blob an addModule(). Damit gibt es im Worklet keine Importe —
 * die vertragen aeltere Safari-Versionen nicht zuverlaessig.
 *
 * Hier wird bewusst ES6-Klassensyntax benutzt (im Rest der App nicht):
 * AudioWorkletProcessor MUSS mit super() abgeleitet werden, und jedes
 * Geraet, das AudioWorklet ueberhaupt kennt (iOS ab 14.5), kann
 * Klassen. Aeltere Geraete nehmen den ScriptProcessor-Weg und laden
 * diese Datei nie.
 *
 * DSP ist hier bereits definiert.
 */
/* global DSP, sampleRate, AudioWorkletProcessor, registerProcessor, currentTime */
class ErkennerProzessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    this.analyzer = new DSP.Analyzer(sampleRate, o);
    this.zaehler = 0;
    this.jeder = o.postAlleQuanten || 8;      // ~21 ms bei 128er Quanten
    this.port.onmessage = (e) => {
      if (e.data === 'reset') { this.analyzer.reset(); }
    };
  }

  process(inputs, outputs) {
    // Der Ausgang bleibt stumm; er existiert nur, damit der Knoten
    // sicher im Rechenweg des Browsers liegt.
    const aus = outputs[0] && outputs[0][0];
    if (aus) { aus.fill(0); }

    const kanal = inputs[0] && inputs[0][0];
    if (kanal && kanal.length) {
      if (this.analyzer.samplesSeen === 0) { this.analyzer.zeitVersatz = currentTime; }
      this.analyzer.push(kanal);
      this.zaehler++;
      if (this.zaehler >= this.jeder) {
        this.zaehler = 0;
        const buf = this.analyzer.drainKompakt();
        if (buf) { this.port.postMessage(new Float32Array(buf)); }
      }
    }
    return true;
  }
}

registerProcessor('erkenner', ErkennerProzessor);
