## Problem

Im NoteRunner-Spiel werden auf iPad keine Töne erkannt. Der Tuner (`TunerPopup` + `usePitchDetection`) funktioniert auf iPad einwandfrei — er verwendet einen einfachen, bewährten Pfad: AudioContext → MediaStreamSource → AnalyserNode → `requestAnimationFrame`-Schleife mit Autokorrelation.

Der Game-Hook `useGamePitchDetection` geht auf iOS einen anderen Weg (AudioWorklet → Fallback ScriptProcessor → Watchdog → erst nach 3 s AnalyserFallback). Genau dieser iOS-Sonderpfad ist auf iPadOS die wahrscheinliche Fehlerquelle:

- AudioWorklet-Inline-Blob lädt auf manchen iPadOS-Versionen nicht zuverlässig (CSP/Worklet-Init).
- ScriptProcessor liefert auf neueren iPadOS-Versionen häufig nur Stille (`maxAbs ≈ 0`) im Input-Buffer, obwohl der Track „live" ist.
- Wenn die Worklet-Initialisierung scheinbar erfolgreich ist, schlägt der 3-s-Watchdog nicht an, und es wird nie auf den funktionierenden AnalyserNode-Pfad gewechselt → keine Tonerkennung.

Da der Tuner auf demselben Gerät zuverlässig erkennt, ist der einfache AnalyserNode-Pfad nachweislich iPad-tauglich.

## Lösung

Den iOS-Sonderpfad im Game-Hook entfernen und auf allen Plattformen den gleichen AnalyserNode + rAF-Pfad nutzen, den der Tuner bereits erfolgreich verwendet. Die spielspezifische Logik (Stabilitäts-Timer, transponierte MIDI-Note, Konfidenzschwelle, Debug-Info) bleibt vollständig erhalten.

### Änderungen in `src/hooks/useGamePitchDetection.tsx`

1. **iOS-Pfad entfernen**: `AudioWorklet`-Branch, `ScriptProcessor`-Fallback, Ring-Buffer und 3-s-Watchdog komplett raus. Refs `workletNodeRef`, `scriptNodeRef`, `ringBufferRef`, `ringWriteRef`, `ringTargetRef`, `watchdogTimerRef` und der zugehörige Cleanup-Code entfallen.
2. **Einheitlicher Start**: Nach `getUserMedia` + `createMediaStreamSource` immer `setupAnalyserPath(...)` aufrufen — egal ob iOS oder Desktop. AnalyserNode wird **nicht** mit `ctx.destination` verbunden (sonst Feedback), genau wie im Tuner.
3. **iOS-freundliche Konstanten beibehalten**: `FFT_SIZE`, `CORRELATION_THRESHOLD`, `RMS_SILENCE`, `STABILITY_MS`, `CONFIDENCE_FACTOR` für iOS bleiben unverändert — sie sind unabhängig vom Erfassungspfad und für das Spielgefühl auf iPad wichtig.
4. **AudioContext-Unlock**: Der bestehende Silent-Buffer + `await ctx.resume()` + `onstatechange`-Resume-Loop bleibt. Das ist die gleiche Sequenz, die der Tuner nutzt.
5. **Debug-Info anpassen**: `iosPath` wird auf iOS auf `'AnalyserNode'` gesetzt (statt `'Worklet'`/`'ScriptProcessor'`/`'AnalyserFallback'`). `scriptFireCount` / `maxAmplitude` bleiben im Interface, werden auf dem Analyser-Pfad nicht aktiv befüllt (bleiben 0) — kein Konsument außerhalb des Debug-Overlays.
6. **Cleanup in `stopListening`**: Verweise auf entfernte Refs entfernen.

### Nicht geändert

- `GamePlayPage.tsx` (Mic-Activation-Overlay, Touch/Click-Dual-Handler) bleibt unverändert — die User-Gesture-Logik ist korrekt.
- Spiel-Logik, Settings, Game-Loop, HUD: unverändert.
- Tuner-Code: unverändert.

## Verifikation

- Build muss grün sein (Tsgo-Typecheck — Interface `GamePitchDebugInfo` unverändert).
- Konsolen-Log nach Start im Spiel sollte auf iPad zeigen: `[PitchDetect] N/A AnalyserNode started` und kontinuierlich `frame=… rms=… freq=…` mit `rms > 0` sobald in die Trompete gespielt wird.
- Debug-Overlay im Spiel zeigt steigenden `Frames`-Counter und `Freq`-Wert.
