# Gekaufte Produkte im Profil

## Ergebnis
- Ein Bereich „Meine Käufe“ zeigt die über Digistore24 gekauften Produkte mit Titel, Kaufdatum, Betrag und Status.
- Mehrfachzahlungen eines Abos werden einer Bestellung zugeordnet, statt als doppelte Produkte zu erscheinen.
- Bei E-Books erscheinen Downloadlinks nur, wenn Digistore24 einen passenden Link bereitstellt. Andernfalls kann die persönliche Bestellseite angeboten werden, sofern vorhanden.
- Anzeige und Meldungen funktionieren auf Deutsch, Englisch, Spanisch und Slowenisch, auch auf kleinen Bildschirmen.
- Bestehende Zahlpläne, Freischaltungen und E-Mail-Automationen bleiben unverändert.

## Sicherheit und technische Umsetzung
- Eine angemeldete, serverseitig geprüfte Sitzung bestimmt die Käuferidentität. Die Anfrage darf weder eine fremde E-Mail noch eine fremde Nutzer-ID auswählen.
- Vorhandene Digistore24-Kaufdaten werden über eine geprüfte, serverseitige Käuferzuordnung abgefragt; bestehende unveränderliche Bestellzuordnungen haben Vorrang. Verfügbare Anbieterabfragen ergänzen die Übersicht ausschließlich lesend. Keine Nachverarbeitung von Käufen und keine automatische Freischaltung.
- Nur die nötigen Produktdaten werden ausgegeben, keine vollständigen Kaufdaten oder Zugangsdaten. Links müssen gültige HTTPS-Adressen sein und zur eigenen Bestellung gehören; für erstattete Käufe werden keine Downloads angeboten.
- Ladezustand, leere Kaufübersicht, Fehler und erneutes Laden werden berücksichtigt.

## Prüfung
- Tests für Käuferzuordnung, Bestellzusammenfassung und sichere Linkfreigabe.
- Angemeldeter Durchlauf mit echten vorhandenen Käufen; Prüfung der Anzeige und angebotenen Links, ohne einen Kauf oder eine E-Mail auszulösen.
- Nicht vorhandene E-Book-Dateien oder fehlende Anbieterlinks werden ausdrücklich als fehlend behandelt, nicht erfunden.