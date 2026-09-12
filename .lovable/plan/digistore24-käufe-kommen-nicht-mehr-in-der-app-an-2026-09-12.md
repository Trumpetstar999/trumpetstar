# Digistore24-Käufe kommen nicht mehr in der App an

## Was ich geprüft habe

- Für `isabella-koepf@gmx.de` existiert **kein** Benutzerkonto, kein Kunde und kein Lead in der App.
- Der letzte Kaufhinweis von Digistore24 ist am **26. März 2026** eingegangen. Seither: gar keiner — auch keine abgelehnten. Die Kaufmeldung zu diesem Kauf ist also nie bei der App angekommen.
- Zusätzlich falsch hinterlegt: das Produkt „Trumpetstar PRO – Trompete lernen leicht gemacht“ (346007) ist in der App mit Zugangsstufe **BASIC** eingetragen, nicht PRO. Auch bei funktionierender Meldung hätte die Kundin den falschen Zugang bekommen.
- Zwischen 25. und 26. März wurden mehrere Meldungen als „UNKNOWN“ abgelegt, also ohne Zugangsfreischaltung — die Ereignisnamen von Digistore24 waren nicht bekannt.
- Die Willkommensmail läuft über Resend mit Absender `noreply@trumpetstar.com`, nicht über den sonst genutzten Hausversand.

## Was gemacht wird

### 1. Kundin sofort freischalten
Konto für isabella-koepf@gmx.de anlegen, PRO-Zugang setzen, Kundendatensatz erstellen und die Willkommensmail mit Einstiegslink senden.

### 2. Produktzuordnung korrigieren
„Trumpetstar PRO – Trompete lernen leicht gemacht“ auf PRO stellen. Die übrigen Produkte werden dabei mit dir durchgesehen (aktuell stehen viele Kurse auf FREE).

### 3. Kaufmeldungen zuverlässig machen
- Unbekannte Ereignisnamen werden nicht mehr stillschweigend verworfen: bei Zahlungsmeldungen wird der Kauf trotzdem verarbeitet, alles andere wird sichtbar als „nicht zugeordnet“ markiert.
- Käufe zu Produkten ohne Zuordnung erzeugen künftig ebenfalls einen Kunden- und E-Mail-Eintrag statt komplett übersprungen zu werden.
- Willkommensmail läuft über den bestehenden Hausversand (gleicher Absender wie alle anderen Mails), Resend nur noch als Ausweichweg.

### 4. Sichtbarkeit und Nachholen im Adminbereich
- Im Digistore24-Bereich: Warnhinweis „seit X Tagen keine Kaufmeldung eingegangen“, die genaue Webhook-Adresse zum Kopieren und ein Testknopf.
- Knopf „Käufe nachholen“: holt die Bestellungen der letzten Monate direkt von Digistore24 und legt fehlende Zugänge samt Willkommensmail an — damit alle seit Ende März verpassten Käufe aufgeholt werden.

### 5. Was du bei Digistore24 tun musst
Die Meldung („IPN / Kaufbenachrichtigung“) muss bei jedem Produkt auf die App-Adresse zeigen. Ich gebe dir die exakte Adresse und den Ort im Digistore24-Konto; das Eintragen dort kann nur mit deinem Digistore24-Login passieren. Danach prüfen wir gemeinsam mit einem Testkauf.

## Technische Details

- `digistore24_products`: `plan_key` für 346007 auf `PRO`.
- Nutzeranlage für die Kundin über `auth.admin.createUser` + `user_memberships` (plan_key PRO, plan_rank aus `plans`) + `digistore24_entitlements` + `digistore24_customers`, ausgeführt über die bestehende Funktion `digistore24-ipn` bzw. einen Admin-Aufruf.
- `supabase/functions/digistore24-ipn/index.ts`:
  - `EVENT_TYPE_MAP` erweitern (u. a. `on_payment_missed`, `connection_test`, `on_upgrade`, `last_paid_day`) und Fallback: enthält der Payload `billing_type`/`pay_sequence_no`/`amount` und einen Auftrag, gilt er als `PURCHASE`.
  - Unbekannte Produkte: Kunde + Transaktion anlegen, Event mit Status `processed` und Hinweis `unknown_product` behalten (wie bisher), zusätzlich Admin-Sichtbarkeit.
  - `sendWelcomeEmail` ruft `send-email` (SMTP-Relay) auf; Resend nur wenn SMTP fehlschlägt.
- Neue Admin-UI-Teile im bestehenden Digistore24-Tab: Status-Karte mit `max(received_at)` aus `digistore24_ipn_events`, Webhook-URL, Testknopf gegen `digistore24-test-connection`, Nachhol-Lauf über `digistore24-import`/`digistore24-sync` mit Protokoll in `digistore24_import_logs`.
