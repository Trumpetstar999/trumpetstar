

# Fix: iPad Pitch Detection - ScriptProcessorNode + AudioContext-Konfiguration

## Kernproblem

Die bisherige Implementierung nutzt `AnalyserNode.getFloatTimeDomainData()` in einer `requestAnimationFrame`-Schleife. Auf iPad/iOS Safari hat das zwei fundamentale Probleme:

1. **rAF-Timing ist unzuverlaessig**: Safari auf iPad drosselt rAF-Callbacks, besonders wenn der Tab nicht im Vordergrund ist oder bei hoher Last. Das fuehrt zu inkonsistenten Abtastintervallen.
2. **AnalyserNode liefert auf iOS oft leere/veraltete Daten**: Die `getFloatTimeDomainData`-Methode gibt auf manchen Safari-Versionen nur Nullen zurueck, selbst mit dem Byte-Fallback.

## Loesung: ScriptProcessorNode statt AnalyserNode + rAF

Statt den AnalyserNode in einer rAF-Schleife abzufragen, wird ein `ScriptProcessorNode` verwendet. Dieser wird direkt vom Audio-Thread aufgerufen und liefert zuverlaessig PCM-Samples -- unabhaengig von rAF-Timing.

**Warum nicht AudioWorklet?** AudioWorklet wird erst ab iOS 14.5+ unterstuetzt und hat auf aelteren iPads Probleme. ScriptProcessorNode ist zwar deprecated, funktioniert aber zuverlaessig auf allen iOS-Versionen.

## Aenderungen

### Datei: `src/hooks/useGamePitchDetection.tsx`

**1. AudioContext mit latencyHint und sampleRate**
```typescript
const ctx = new ACtor({
  latencyHint: 'playback',
  sampleRate: 48000,  // Hint - iOS may ignore this
});
```
Hinweis: iOS ignoriert moeglicherweise die sampleRate-Vorgabe und nutzt die Hardware-Rate. Darum wird weiterhin `ctx.sampleRate` fuer die Pitch-Berechnung verwendet.

**2. getUserMedia mit channelCount + sampleRate**
```typescript
stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: { ideal: 48000 },
  },
});
```

**3. ScriptProcessorNode ersetzt AnalyserNode + rAF (NUR auf iOS)**
Auf iOS:
- Ein `ScriptProcessorNode` (bufferSize = 4096) sammelt PCM-Samples
- Alle ~200ms (je nach sampleRate ca. 9600 Samples) wird ein Analyse-Frame gebildet
- Autocorrelation laeuft auf diesem gesammelten Frame
- Kein rAF noetig -- der Audio-Thread triggert die Analyse

Auf Desktop:
- Bisheriges Verhalten (AnalyserNode + rAF) bleibt erhalten, da es dort zuverlaessig funktioniert

**4. Audio-Chain auf iOS**
```
MicSource -> GainNode(1.0) -> ScriptProcessorNode -> (silent output)
```
Der ScriptProcessorNode muss an `ctx.destination` angeschlossen werden (auch wenn kein Audio ausgegeben wird), damit er auf iOS aktiv bleibt.

**5. Analyse-Logik im ScriptProcessor-Callback**
```typescript
scriptProcessor.onaudioprocess = (event) => {
  const input = event.inputBuffer.getChannelData(0);
  // Samples in Ring-Buffer sammeln
  // Wenn genug Samples (~200ms), Autocorrelation ausfuehren
  // Pitch-Ergebnis in State schreiben
};
```

**6. Stability-Window auf 120ms erhoehen (iOS)**
Wie angefordert: `STABILITY_MS = 120` auf iOS (statt 60). Da die Frame-basierte Analyse weniger Rauschen produziert, kann die Stabilitaet hoeher sein.

**7. Kein aubiojs**
aubiojs (WASM) wuerde eine neue Abhaengigkeit einfuehren und hat eigene iOS-Kompatibilitaetsprobleme. Die bestehende Autocorrelation mit den optimierten Parametern ist ausreichend, wenn sie zuverlaessig Daten bekommt -- was der ScriptProcessorNode sicherstellt.

## Aktualisierte Parameter-Tabelle

```text
Parameter                | Desktop           | iPad/iOS
-------------------------|-------------------|---------------------------
AudioContext sampleRate   | default (44100)   | 48000 (hint)
latencyHint              | default           | "playback"
getUserMedia channelCount| default           | 1
getUserMedia sampleRate  | default           | ideal: 48000
Analyse-Methode          | AnalyserNode+rAF  | ScriptProcessorNode
Analyse-Intervall        | ~16ms (rAF)       | ~200ms (frame collection)
fftSize / bufferSize     | 4096              | 4096 (ScriptProcessor)
Korrelations-Schwelle    | 0.9               | 0.75
RMS Silence Threshold    | 0.005             | 0.002
Confidence-Faktor        | 1.0x              | 0.6x
Stability MS             | 100               | 120
Audio-Chain              | Mic->Gain->Analyser | Mic->Gain->ScriptProc->dest
```

## Betroffene Dateien

Nur `src/hooks/useGamePitchDetection.tsx` -- keine anderen Dateien muessen geaendert werden.

