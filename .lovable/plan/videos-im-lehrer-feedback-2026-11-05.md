# Videos im Lehrer-Feedback

- Neben dem Nachrichtenfeld eine Video-Auswahl ergänzen; Video mit optionaler Nachricht senden und Auswahl wieder entfernen können.
- Gesendete Videos direkt in der Unterhaltung abspielen; Lade-, Versand- und Fehlerzustände in DE, EN, ES und SL anzeigen.
- Bestehende PRO-Zugangsregeln und Lehrerzuordnung beibehalten. Keine Schülerchats und keine öffentlichen Videolinks.
- Videoversand und geschützte Wiedergabe testen; Testdateien anschließend entfernen.

## Technische Umsetzung
- Privaten Videospeicher mit begrenzter Dateigröße und erlaubten Videoformaten verwenden.
- Anhänge über einen serverseitig geprüften, wiederholungssicheren Feedback-Aufruf speichern; Speicherzugriff an Identität und Lehrer-Unterhaltung binden.
- Videos erst auf Anforderung laden, damit die Nachrichtenliste weiterhin schnell öffnet.