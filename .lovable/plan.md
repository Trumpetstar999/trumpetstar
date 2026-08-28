# Besserer Trompetenklang für Happy Beginners

Ziel: Die aktuell im Spiel verwendeten Trompeten-Aufnahmen durch hochwertige, lizenzfreie Samples einer echten Trompete ersetzen — inklusive Belohnungsklang.

## Was ersetzt wird

Das Spiel spielt pro Ton eine fertige Audiodatei ab (keine Synthese). Ersetzt werden:

- 9 Töne × 3 Varianten = 27 Dateien: `ton_c1_1..3`, `ton_d1`, `ton_e1`, `ton_f1`, `ton_g1`, `ton_a1`, `ton_h1`, `ton_c2`, `ton_d2`
- 1 Belohnungsklang: `lob`

Die klingenden Tonhöhen (B♭-Trompete, notiert c1–d2) sind: B♭3, C4, D4, E♭4, F4, G4, A4, B♭4, C5.

## Vorgehen

1. **Quelle sichern**: Trompeten-Einzeltöne aus einer CC0-/Public-Domain-Bibliothek beschaffen (primär Versilian VSCO 2 Community Edition, CC0). Falls dort ein Ton fehlt, wird er aus dem nächstgelegenen Sample um maximal einen Halbton transponiert — hörbar bleibt der echte Trompetenklang.
2. **Prüfen**: Jede Datei automatisch auf tatsächliche Tonhöhe messen (Abweichung < 5 Cent) und auf Störgeräusche/Stille prüfen. Kein Sample wird ungeprüft übernommen.
3. **Aufbereiten**: Anfang exakt auf den Toneinsatz schneiden, Länge ca. 1,3 s mit natürlichem Ausklang, Lautstärke aller Töne gleichziehen (Loudness-Normalisierung), leichtes Rauschgate.
4. **Drei Varianten pro Ton**: Für Lebendigkeit je Ton drei minimal unterschiedliche Versionen (unterschiedlicher Anblas-Ausschnitt, leichte Längen- und Klangfarbenvariation). Klanglich identisch im Charakter, nur nicht monoton.
5. **Belohnungsklang**: Kurze, freundliche Fanfare (Terz-/Quint-Motiv) aus denselben Samples gebaut, damit sie zum neuen Trompetenklang passt.
6. **Format**: Ausgabe als `.m4a` (AAC, Mono, 44,1 kHz) unter den bestehenden Dateinamen in `public/trompete/audio/` — dadurch sind keine Änderungen am Spielcode nötig und iOS/Safari bleibt kompatibel.
7. **Alte Dateien**: Werden durch die neuen ersetzt (die bisherigen Aufnahmen bleiben über den Chat-Verlauf rückholbar).
8. **Test**: E2E im Browser — Spiel starten, Töne und Melodien abspielen, Belohnungsklang auslösen, Lautstärke- und Timing-Kontrolle. Zusätzlich wird geprüft, dass die Tonhöhenerkennung des Spiels durch die neuen Samples nicht gestört wird (Lautsprecherton darf nicht als gespielter Ton gewertet werden).

## Technische Details

- Beschaffung und Aufbereitung per `ffmpeg` (Trimmen, Loudnorm, AAC-Encoding) plus Tonhöhenmessung via Autokorrelation.
- Dateinamen und Ordnerstruktur bleiben exakt gleich (`public/trompete/audio/ton_<id>_<1..3>.m4a`, `lob.m4a`), `motor.js` und `toene.json` werden nicht verändert.
- Dateigröße pro Ton bleibt im Bereich der bisherigen (~20–30 KB), damit die Ladezeit des Spiels gleich bleibt.
- Lizenzhinweis: Es werden ausschließlich CC0-/Public-Domain-Quellen verwendet, damit die kommerzielle Nutzung in Trumpetstar unproblematisch ist. Das verlinkte Samplemodeling-Plugin kann nicht verwendet werden — es ist ein kostenpflichtiges VST-Plugin und im Browser nicht lauffähig.

## Wenn der Klang nicht überzeugt

Falls das Ergebnis klanglich nicht auf dem gewünschten Niveau ist, ist der beste Weg, dass du die 9 Töne mit deinem Samplemodeling-Plugin (oder deiner eigenen Trompete) aufnimmst und hochlädst — dann baue ich diese Dateien in derselben Struktur ein.
