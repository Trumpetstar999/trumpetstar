# Redesign Etappe 4, 5, 6

Zahlpläne, Preise, Käufe, Gutscheine und Login-Mails bleiben unverändert.

## Etappe 4 – Neuigkeiten-Glocke und Profil
- **Glocke:** Ein Tipp öffnet ein Fenster mit den Neuigkeiten, die neuesten zuerst, in der eingestellten Sprache, optional mit Link. Der rote Zähler zeigt, wie viele ungelesen sind. Nach dem Öffnen steht er auf 0.
  - Gäste: Was sie gelesen haben, merkt sich das Gerät.
  - Eingeloggte Nutzer: Gelesenes wird im Konto gespeichert und gilt auf allen Geräten.
- **Neuigkeiten verwalten:** Im Admin-Bereich gibt es einen neuen Punkt „Neuigkeiten“. Dort legst du Einträge an, änderst und löschst sie, mit Titel und Text in DE/EN/ES/SL und optionalem Link. Nur Admins dürfen Einträge anlegen oder ändern.
- **Profil-Avatar:**
  - Gast: Es öffnet sich das Login-Fenster.
  - Eingeloggt: Es öffnet sich ein Profil-Fenster mit Name, Sternen, Level, „Meine Aufnahmen“ (die bestehende Liste) und Abmelden.
- **Sprache:** Die bestehende Flaggen-Auswahl wird zusätzlich im Profil gespeichert.

## Etappe 5 – Shop-Karussell und Shop-Seite
- **Karussell auf dem Homescreen:** Glas-Karte „Neu im Shop“ mit Link „Alle“. Jede Produktkarte zeigt Cover, roten „NEU“-Badge, Titel, Preis und einen goldenen „Kaufen“-Button, der Digistore24 in einem neuen Tab öffnet.
  - Läuft alle 3,2 s eine Karte weiter und pausiert bei Berührung.
  - Unten Seiten-Punkte.
  - Wenn am Gerät „Bewegung reduzieren“ eingeschaltet ist, läuft es nicht automatisch.
- **/shop:** Alle Produkte als Raster, die neuesten zuerst. Das Shop-Icon führt hierher statt zur Preisseite.
- **Daten:** Die Produkte kommen aus Digistore24, über den bestehenden Schlüssel auf dem Server, und werden höchstens einmal pro Stunde aufgefrischt.
  - Sortierung: zuerst die manuelle Reihenfolge, sonst die neuesten zuerst.
  - „NEU“ heißt: jünger als 60 Tage, oder du hast es manuell gesetzt.
  - Startdaten sind die bekannten Produkte (Band 1, Band 2, Duette, Technotunes, Klavierbegleitung, PRO).
- **Admin „Shop-Produkte“:** Cover-Bild hochladen, Produkt sichtbar oder versteckt, Reihenfolge, NEU-Markierung.
- **Fallback:** Wenn Digistore24 nicht antwortet, zeigt die App die zuletzt gespeicherten Produkte. Sind keine gespeichert, wird das Karussell ausgeblendet, ohne Fehlermeldung.
- **Bestell-Link:** Er wird wie bei den bestehenden Kauf-Links aufgebaut und vor dem Einbau am ersten Produkt geprüft.

## Etappe 6 – Interaktive Grifftabelle (/grifftabelle, ohne Login)
- Ein Notensystem im Violinschlüssel mit allen 31 Tönen chromatisch von fis bis c''' (B-Trompete), seitlich scrollbar, mit Kreuz-Vorzeichen und Hilfslinien.
- Tippen auf eine Note markiert sie. Darunter erscheinen drei Ventile: Die gedrückten sind farbig und abgesenkt, dazu der Text „Ventil 1 + 3 drücken“ oder „Leer – kein Ventil“, in 4 Sprachen.
- Beim Antippen erklingt ein kurzer Ton in der klingenden Tonhöhe.
- Die Griffe werden exakt aus der Tabelle in der Anleitung übernommen.
- Ersetzt den bisherigen Platzhalter.

## Prüfung
- Tests:
  - alle 31 Griffe
  - Zähler für ungelesene Neuigkeiten
  - Sortierung und NEU-Regel im Shop
  - Bestell-Link-Prüfung
- Klicktest im Browser als Gast und als eingeloggter Nutzer:
  - Glocke: zeigt den Zähler, danach 0
  - Profil-Fenster
  - Karussell und /shop
  - Grifftabelle auf Handy und Tablet ohne seitliches Überlaufen

## Technische Details
- Migration:
  - `app_updates(id, created_at, title_i18n jsonb, body_i18n jsonb, link)` und `app_update_reads(user_id, update_id, pk)`. Lesen öffentlich; schreiben nur mit Admin-Rolle über `has_role`. Die Lesestatus-Einträge gehören nur dem eigenen Nutzer.
  - `profiles.language` (falls die Spalte fehlt).
  - `shop_products` (id, name, price, currency, created_at, image_url, order_url, is_new, sort_override, visible). Öffentlich lesbar sind nur sichtbare Produkte; schreiben nur Admin.
  - Öffentlicher Storage-Bucket `shop`, Upload nur für Admins.
- Die Server-Funktion `shop-products` ruft öffentlich `listProducts` mit dem vorhandenen `DIGISTORE24_API_KEY` auf (es wird kein zweites Secret angelegt). Sie hat eine Stunden-Sperre für den Cache, schreibt nur Name, Preis und Datum, und manuelle Felder überschreibt sie nie.
- Die Glocke und die Shop-Daten werden aus der zentralen App-Liste beziehungsweise neuen Hooks gelesen. Alle Texte kommen über das bestehende Sprachsystem.
- VexFlow wird als Abhängigkeit hinzugefügt. Die Griffdaten liegen in einem eigenen, getesteten Datenmodul. Der Ton wird mit WebAudio erzeugt, über die bestehende Freischaltung für iOS.
- AGENTS.md und roadmap.md werden aktualisiert.
