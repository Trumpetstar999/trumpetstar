
# iPad/iOS Safari Pitch-Detection Fix

## Problem

Die Pitch-Detection funktioniert auf Desktop (Chrome/Firefox) einwandfrei, aber auf iPad/iPadOS Safari nicht oder nur unzuverlaessig. Dies liegt an bekannten iOS-WebAudio-Einschraenkungen, nicht an einem Logikfehler.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useGamePitchDetection.tsx` | Komplett ueberarbeitet: iOS-Erkennung, GainNode, adaptive fftSize, adaptive Confidence, Silent-Frame-Detection, webkitAudioContext-Fallback |
| `src/pages/GamePlayPage.tsx` | Mic-Aktivierungs-Overlay vor Spielstart, SFX-Default per Plattform, Mic-Status-Indikator |
| `src/hooks/useGameSettings.tsx` | SFX-Default abhaengig von Plattform (iOS = OFF) |

## Aenderungen im Detail

### 1. iOS-Erkennung (Hilfsfunktion)

Neue Funktion `isIOSDevice()` basierend auf UserAgent + Plattform-Check. Wird in mehreren Dateien verwendet.

### 2. useGamePitchDetection.tsx - Komplette Ueberarbeitung

**a) webkitAudioContext-Fallback**
- Verwende `window.AudioContext || (window as any).webkitAudioContext` fuer Safari-Kompatibilitaet.

**b) Explizites `audioContext.resume()`**
- Nach Erstellen des AudioContext wird `await audioContext.resume()` aufgerufen -- auf iOS zwingend noetig.

**c) Adaptive fftSize**
- Desktop: `4096` (wie bisher)
- iOS/iPad: `8192` (groesserer Buffer fuer stabile Erkennung)

**d) GainNode in Audio-Chain**
- Audio-Kette wird: `MicSource -> GainNode(1.0) -> AnalyserNode`
- Nicht mehr direkt Mic -> Analyser. Der GainNode stabilisiert die Kette auf iOS.

**e) Adaptive Confidence-Schwelle**
- Der Hook erhaelt einen zusaetzlichen Boost: auf iOS wird die uebergebene Confidence-Schwelle mit 0.6 multipliziert (weicher).
- Desktop bleibt wie bisher.

**f) Silent-Frame-Detection (Safari-Failsafe)**
- Zaehle aufeinanderfolgende Frames mit RMS nahe 0.
- Nach 60 stillen Frames (~1 Sekunde): Setze einen Fehler-State mit Hinweis "Bitte naeher ins Mikrofon spielen".
- Nach 120 stillen Frames: Automatische Reinitialisierung des AudioContext.

**g) Neuer Return-Wert: `isMicActive`**
- Boolean, der anzeigt ob das Mikrofon tatsaechlich Audiosignal empfaengt (nicht nur ob der Stream laeuft).

### 3. GamePlayPage.tsx - Mic-Aktivierungs-Overlay

**a) Kein Auto-Start mehr**
- AudioContext und Mikrofon werden NICHT mehr beim Laden der Seite initialisiert.
- Stattdessen zeigt ein Overlay-Button: "Mikrofon aktivieren -- Tippen zum Start"
- Erst nach Tap: `startListening()` -> `startGame()`

**b) iPad-Hinweis**
- Auf iOS wird zusaetzlich angezeigt: "iPad benoetigt einen Tipp, um das Mikrofon zu aktivieren"

**c) Mic-Status-Indikator**
- Kleines Icon oben rechts: "Mic active" (gruen) wenn Signal vorhanden
- Zeigt auch "Audio signal" Status an

**d) SFX-Default auf iOS**
- Beim ersten Laden auf iOS: `sfxEnabled = false`
- Hinweis: "Fuer beste Erkennung auf iPad: Soundeffekte deaktivieren" (einmalig sichtbar)

### 4. useGameSettings.tsx - Plattform-adaptiver Default

- `sfxEnabled` Default wird bei erstem Laden auf iOS automatisch auf `false` gesetzt.
- Bestehende gespeicherte Settings werden nicht ueberschrieben.

## Technische Zusammenfassung der adaptiven Parameter

```text
Parameter          | Desktop        | iPad/iOS
-------------------|----------------|------------------
AudioContext       | AudioContext   | webkitAudioContext
fftSize            | 4096           | 8192
GainNode           | ja             | ja
audioContext.resume| ja             | ja (zwingend)
Confidence-Faktor  | 1.0x           | 0.6x
SFX Default        | ON             | OFF
Silent-Frame-Limit | 120 frames     | 120 frames
Stability MS       | 100ms          | 100ms
```

## UX-Flow auf iPad

1. Spielseite laedt -> Overlay erscheint mit grossem Mikrofon-Button
2. User tippt -> AudioContext + Mikrofon initialisiert -> Spiel startet
3. Kleiner Indikator zeigt "Mic aktiv" an
4. Falls Audio-Signal verloren geht -> Automatische Warnung + Reinitialisierung
5. SFX sind standardmaessig aus, um Mikrofon-Interferenz zu vermeiden
