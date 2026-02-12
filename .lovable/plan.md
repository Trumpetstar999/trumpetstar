
# Fix: Pitch-Detection iPad — Fehlende kritische Einstellungen

## Ursachen (3 Probleme identifiziert)

### 1. `smoothingTimeConstant` fehlt (KRITISCHSTER FIX)
Der `AnalyserNode` hat einen Default von `smoothingTimeConstant = 0.8`. Das bedeutet: Safari glaettet 80% des vorherigen Audio-Frames in den aktuellen. Das Signal wird "verwaschen", die Autocorrelation findet keinen scharfen Peak. Auf Desktop reicht die Signalstaerke trotzdem — auf iPad nicht.

**Fix:** `analyser.smoothingTimeConstant = 0` setzen — sowohl in `startListening` als auch in `reinitAudioContext`.

### 2. Autocorrelation startet bei Offset 0
Offset 0 vergleicht das Signal mit sich selbst (perfekte Korrelation = 1.0). Die nachfolgenden niedrigen Offsets erzeugen hohe Korrelationswerte fuer nicht-existente Ultraschall-Frequenzen. Der Algorithmus muss erst ab einem Mindest-Offset starten, der der hoechsten erwarteten Frequenz entspricht.

**Fix:** Minimum-Offset = `floor(sampleRate / 2000)` (~22 bei 44.1kHz, ~24 bei 48kHz). Damit werden nur Frequenzen bis 2000 Hz gesucht.

### 3. STABILITY_MS zu hoch fuer iPad
100ms Stabilitaet bedeutet: der erkannte MIDI-Wert muss sich 100ms lang nicht aendern. Auf iPad mit verrauschtem Signal springt der Wert oefter — 100ms wird selten erreicht.

**Fix:** iOS: `STABILITY_MS = 60` (statt 100).

### 4. Zusaetzliche Robustheit: getByteTimeDomainData Fallback
Manche Safari-Versionen liefern bei `getFloatTimeDomainData` nur Nullen. Als Fallback wird geprueft, ob die Daten alle 0 sind, und dann `getByteTimeDomainData` verwendet (Wertebereich 0-255, konvertiert zu -1..1).

## Aenderungen

### Datei: `src/hooks/useGamePitchDetection.tsx`

**a) smoothingTimeConstant = 0 setzen**
An zwei Stellen (startListening + reinitAudioContext):
```
analyser.smoothingTimeConstant = 0;
```

**b) Autocorrelation: Minimum-Offset**
Die `autoCorrelate`-Funktion erhaelt `sampleRate` bereits. Der Start-Offset wird auf `floor(sampleRate / 2000)` gesetzt statt 0.

**c) Adaptive STABILITY_MS**
```
Desktop: 100ms
iOS:      60ms
```

**d) Byte-Data Fallback**
Nach `getFloatTimeDomainData`: Wenn alle Werte exakt 0 sind, wird `getByteTimeDomainData` versucht und die Byte-Werte zu Float konvertiert (`(byte - 128) / 128`).

**e) Erweitertes Debug-Logging**
Beim Start wird zusaetzlich `smoothingTimeConstant: 0` geloggt. Bei den ersten 5 Frames wird der RMS-Wert geloggt, damit man auf dem iPad sofort sieht ob ueberhaupt Signal ankommt.

## Aktualisierte Parameter-Tabelle

```text
Parameter                | Desktop  | iPad/iOS
-------------------------|----------|----------
smoothingTimeConstant    | 0        | 0
Korrelations-Schwelle    | 0.9      | 0.75
RMS Silence Threshold    | 0.005    | 0.002
fftSize                  | 4096     | 8192
Confidence-Faktor        | 1.0x     | 0.6x
Stability MS             | 100      | 60
Min Autocorr Offset      | ~22      | ~24
Byte-Data Fallback       | nein     | ja (wenn Float=0)
```

Keine Aenderungen an anderen Dateien noetig.
