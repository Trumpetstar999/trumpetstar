
# Fix: Pitch-Detection auf iPad zum Laufen bringen

## Ursachenanalyse

Das Hauptproblem liegt in der `autoCorrelate`-Funktion (Zeile 73 in `useGamePitchDetection.tsx`):

```text
if (correlation > 0.9 && correlation > lastCorrelation)
```

Dieser Schwellwert von **0.9** ist fuer iPad-Mikrofone zu streng. Das iPad-Mikrofon liefert ein verrauschteres Signal als ein Laptop-Mikrofon, sodass die Korrelation diesen Wert praktisch nie erreicht. Ergebnis: **kein Pitch wird erkannt**.

## Aenderungen

### Datei: `src/hooks/useGamePitchDetection.tsx`

**1. Adaptive Autocorrelation-Schwelle (KRITISCHER FIX)**
- Desktop: Korrelationsschwelle bleibt bei `0.9`
- iOS: Korrelationsschwelle wird auf `0.75` gesenkt
- Die Konstante wird wie `FFT_SIZE` und `CONFIDENCE_FACTOR` plattformabhaengig gesetzt

**2. Niedrigere RMS-Stille-Schwelle fuer iOS**
- Desktop: `rms < 0.005` gilt als zu leise (wie bisher)
- iOS: `rms < 0.002` -- iPad-Mikrofone liefern leisere Signale

**3. getUserMedia mit Fallback**
- Erster Versuch: mit `echoCancellation: false, noiseSuppression: false, autoGainControl: false`
- Falls das fehlschlaegt (Safari unterstuetzt nicht alle Constraints): Fallback auf `{ audio: true }`

**4. Debug-Logging fuer iPad**
- Temporaeres `console.log` bei Audio-Start: Sample Rate, fftSize, iOS-Erkennung
- Hilft bei zukuenftiger Fehlersuche direkt auf dem iPad (Safari Web Inspector)

## Zusammenfassung der adaptiven Parameter (aktualisiert)

```text
Parameter              | Desktop  | iPad/iOS
-----------------------|----------|----------
Korrelations-Schwelle  | 0.9      | 0.75
RMS Silence Threshold  | 0.005    | 0.002
fftSize                | 4096     | 8192
Confidence-Faktor      | 1.0x     | 0.6x
getUserMedia           | strict   | mit Fallback
```

Keine Aenderungen an `GamePlayPage.tsx` oder `useGameSettings.tsx` noetig -- das Problem liegt rein in der Pitch-Detection-Logik.
