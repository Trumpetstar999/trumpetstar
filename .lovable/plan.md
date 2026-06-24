# NoteRunner: iPad-taugliche Tonerkennung (Port aus Tone-Force)

Im Schwesterprojekt **Tone-Force** funktioniert die Tonerkennung am iPad zuverlässig. Wir übernehmen exakt diesen Ansatz für NoteRunner – er ist deutlich einfacher und robuster als die aktuelle Implementierung.

## Was sich ändert

Nur eine Datei wird angefasst: `src/hooks/useGamePitchDetection.tsx`. `GamePlayPage.tsx`, der Game-Loop, die HUD und die Settings bleiben unverändert. Die Public-API des Hooks (Rückgabewerte, Signaturen) bleibt 1:1 gleich.

## Übernahme aus Tone-Force

### 1. getUserMedia-Constraints (Apple-Mics liefern sonst zu leise)
```ts
audio: {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: IOS,   // <-- neu: auf iOS aktiv, sonst aus
  channelCount: 1,
  sampleRate: 48000,
}
```
Fallback auf `{ audio: true }` bleibt erhalten.

### 2. AudioContext-Setup vereinfachen
- Kein „silent buffer unlock" mehr (wird auf iPadOS nicht gebraucht, der User-Gesture-Tap reicht).
- `ctx.resume()` nur falls suspended.
- `analyser.fftSize = 2048` (statt 8192 auf iOS) – schneller, stabiler auf Safari.
- `analyser.smoothingTimeConstant = 0`.

### 3. Pitch-Detector durch ACF2+ aus Tone-Force ersetzen
- RMS-Gate: `0.003`.
- Trimmen auf Threshold `0.2`.
- Autokorrelation mit Schwellwerttest `maxval / c[0] ≥ 0.3` (verwirft schwache Korrelationen).
- Parabolische Interpolation am Peak.
- Liefert Frequenz in Hz oder `-1`.

Die plattform-spezifischen Konstanten (`FFT_SIZE`-Verzweigung, `CORRELATION_THRESHOLD`, `RMS_SILENCE`, `CONFIDENCE_FACTOR`, `STABILITY_MS`, der alte `autoCorrelate` mit AMDF) entfallen. Eine einheitliche `STABILITY_MS = 120` wird verwendet (Tone-Force nimmt 150 ms, NoteRunner nutzte vorher 120/100 ms – wir bleiben bei 120 ms für schnelles Spielgefühl).

### 4. Aufräumen
Die noch verbliebenen ungenutzten Felder/Refs aus dem alten iOS-Worklet-Pfad (`scriptFireCount`, `maxAmplitude`, `iosPath`) werden auf statische Werte gesetzt bzw. entfernt, soweit sie das DebugInfo-Interface nicht brechen. Das Debug-Overlay in `GamePlayPage` bleibt funktionsfähig.

## Technische Details

```text
useGamePitchDetection
├─ startListening()
│   ├─ new AudioContext()  → resume() if suspended
│   ├─ getUserMedia({ autoGainControl: IOS, channelCount:1, sampleRate:48000 })
│   ├─ createMediaStreamSource → AnalyserNode (fftSize=2048, smoothing=0)
│   └─ requestAnimationFrame loop
│         getFloatTimeDomainData → detectPitchACF2Plus(buf, sampleRate)
│         → processPitchRef.current(freq, rms, sr) // unverändert
└─ stopListening()  // unverändert
```

`detectPitchACF2Plus` ist die Eins-zu-eins-Portierung von `src/lib/pitch.ts` aus Tone-Force – inklusive RMS-Berechnung, sodass wir nicht zweimal über den Buffer laufen müssen (`rms` wird zusätzlich zurückgegeben für `processPitch`).

## Verifikation

- Build muss grün sein (tsgo).
- Auf iPad in der Console erwartet:
  `[PitchDetect] AnalyserNode started { sampleRate: 48000, fftSize: 2048 }`
  gefolgt von Frames mit `rms > 0.003` und plausiblen Frequenzen beim Spielen.
- Debug-Overlay zeigt steigenden Frame-Count und erkannte Frequenzen.
- Desktop-Verhalten darf sich nicht spürbar verschlechtern (gleiche Detection-Engine wie Tone-Force, dort auf Desktop ebenfalls produktiv im Einsatz).
