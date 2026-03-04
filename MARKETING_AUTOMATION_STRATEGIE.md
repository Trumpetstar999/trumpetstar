# 🎯 Trumpetstar Marketing-Automation & E-Mail-Strategie

## Übersicht: Lead → Kauf → Bindung

### Ziel-Funnel
```
Lead (App/Website/QR) → Segmentierung → Willkommen → Mini-Erfolg → Vertrauen → Soft-Offer → Kauf → Onboarding → Bindung → Empfehlung
```

---

## 1) Lead-Quellen & Tracking

| Quelle | Tracking-Parameter | Segment-Erkennung |
|--------|-------------------|-------------------|
| App-Registrierung | `?ref=app` | Instrument + Level + Ziel |
| Landingpage | `?ref=lp` | Formular-Auswahl |
| QR-Code Buch | `?ref=book&song=X&level=Y` | Song-Kontext |
| Social Ads | `?ref=ad&platform=fb/ig/yt` | Ad-Creative → Segment |
| Webinar | `?ref=webinar` | Teilnahme-Verhalten |
| Schule/Bläserklasse | `?ref=school` | Teacher-Flag |

---

## 2) Segmentierung (3 Hauptsegmente)

### Segment A: Erwachsene Anfänger/Wiedereinsteiger
**Kennzeichen:**
- Alter: 25-65
- Instrument: Trompete/Kornett
- Level: Anfänger oder Wiedereinsteiger
- Ziel: "Endlich Trompete lernen" / "Wieder anfangen"

**Pain Points:**
- Keine Zeit (Beruf, Familie)
- Angst vor Scheitern
- "Bin ich zu alt?"
- Lippen werden schnell müde

**Messaging:**
- Zeit-effizient (5-Minuten-Methode)
- Erwachsene lernen schneller
- Nie zu spät
- Flexible Übezeiten

### Segment B: Eltern + Kind (6-14 Jahre)
**Kennzeichen:**
- Elternteil registriert sich
- Kind 6-14 Jahre
- Instrument: Kornett (6-8) oder Trompete (8+)

**Pain Points:**
- Wie halte ich mein Kind motiviert?
- Übt nicht regelmäßig
- Schnell frustriert
- Zu viel Druck?

**Messaging:**
- Gamification (Sterne, Abzeichen)
- Kurze, spaßige Übungen
- Eltern-Kind-Erfolge
- Kein Üben = kein Problem (Motivation kommt vorher)

### Segment C: Lehrer/Dirigenten/Bläserklasse
**Kennzeichen:**
- Beruf: Musiklehrer, Dirigent
- Kontext: Bläserklasse, Orchester
- Ziel: Materialien für Schüler

**Pain Points:**
- Unterschiedliche Levels in Klasse
- Wenig Zeit für individuelle Betreuung
- Mangel an guten Unterrichtsmaterialien
- Schüler üben nicht genug

**Messaging:**
- Klassen-Workflow
- Unterrichtsmaterialien
- Fortschritts-Tracking für Schüler
- B2B-Angebot

---

## 3) Automation-Flow (7-Tage-Sequenz)

### Tag 0 (Sofort): Willkommens-E-Mail
**Ziel:** Vertrauen aufbauen, Erwartungen setzen, erster Micro-Commit

**Trigger:** Registrierung im App/Formular

**Logik:**
- Personalisierung mit Name + Instrument
- Segment-spezifische Begrüßung
- Link zu "Ersten Schritten"
- PS mit "Quick Win"

---

### Tag 1: Mini-Erfolg
**Ziel:** Erster kleiner Erfolg (Motivation)

**Inhalt:**
- Eine konkrete Übung (30 Sekunden)
- Video-Demo
- "Mach das jetzt und antworte mir"

**Bot-Logik:**
- Wenn geöffnet aber nicht geklickt → Reminder in 24h
- Wenn geklickt → Positive Verstärkung

---

### Tag 3: Social Proof + Hürde lösen
**Ziel:** Vertrauen durch andere, größte Hürde adressieren

**Inhalt:**
- Erfolgsgeschichte aus gleichem Segment
- "Häufige Frage" + Antwort
- Micro-CTA

**Bot-Logik:**
- Segment-spezifische Story wählen
- Hürde basierend auf Onboarding-Daten

---

### Tag 5: Soft-Offer
**Ziel:** Erstes Angebot (nicht drängend)

**Inhalt:**
- Value-First: "Hier ist etwas, das dir hilft"
- Soft: "Falls du bereit bist..."
- Garantie/Risiko-Minimierung

**Bot-Logik:**
- Wenn vorher geklickt → Direkter Offer
- Wenn nicht geklickt → Indirekter Offer

---

### Tag 7: Deadline/Bonus
**Ziel:** Entscheidung herbeiführen

**Inhalt:**
- Bonus (zeitlich begrenzt)
- Scarcity (nur für neue Mitglieder)
- Letzte Chance

**Bot-Logik:**
- Wenn bereits gekauft → Onboarding-Sequenz starten
- Wenn nicht gekauft → Einwand-Behandlung

---

## 4) Bot-Intelligenz (Valentin-Steuerung)

### Regel-Engine

```javascript
// Pseudo-Code für Valentin-Logik

if (lead.segment === 'adult') {
  if (lead.email_opens === 0) {
    // Nicht geöffnet
    sendShorterEmail();
    changeSubjectLine();
  }
  
  if (lead.email_clicks > 0 && lead.purchased === false) {
    // Klickt aber kauft nicht
    identifyObjection();
    // Zeit? Lippen? Motivation?
    sendObjectionHandler();
  }
  
  if (lead.activity_score >= 3) {
    // Sehr aktiv
    accelerateOffer();
    showAdvancedContent();
  }
}

if (lead.segment === 'parent_child') {
  emphasizeGamification();
  addParentTips();
  trackChildProgress();
}

if (lead.segment === 'teacher') {
  showClassroomFeatures();
  offerBulkPricing();
  sendTeachingMaterials();
}
```

### Dynamische Anpassungen

| Verhalten | Bot-Reaktion |
|-----------|--------------|
| Nicht geöffnet (24h) | Shorter email, different subject |
| Geöffnet, nicht geklickt | Bigger CTA, more urgency |
| Geklickt, nicht gekauft | Objection handler sequence |
| 3+ Aktivitäten | Early upgrade offer |
| Kind-Account | Gamification emphasis |
| Teacher-Account | B2B workflow, materials |

---

## 5) E-Mail-Templates (fertig)

### Template A0: Willkommen (Erwachsene)

**Betreff:** "Willkommen [Name] – hier ist dein erster Schritt"

```
Hallo [Name],

schön, dass du da bist! 

Du hast dich für [Instrument] entschieden – das ist eine großartige Wahl.

Ich weiß: Als Erwachsener hast du wenig Zeit. Deshalb ist unsere Methode auf 5-Minuten-Einheiten ausgelegt. Kurz, fokussiert, effektiv.

👉 Hier ist dein erster Schritt (dauert 2 Minuten):
[LINK: Erste Übung ansehen]

PS: Die häufigste Frage, die ich höre: "Bin ich zu alt?"
Antwort: Absolut nicht. Unsere erfolgreichsten Schüler sind zwischen 35 und 65. Deine Disziplin ist dein Vorteil.

Viele Grüße
Mario (und das Trumpetstar-Team)

---
Falls du Fragen hast, antworte einfach auf diese Mail.
```

---

### Template B0: Willkommen (Eltern)

**Betreff:** "[Name] – so macht das Kind Freude am Üben"

```
Hallo [Name],

du willst deinem Kind [Instrument] beibringen – das ist wunderbar!

Ich bin Vater von zwei Kindern, deshalb weiß ich: Motivation ist alles. 

Unsere Methode nutzt Gamification (Sterne, Abzeichen, kleine Erfolge). Kinder üben freiwillig, weil es Spaß macht – nicht weil sie müssen.

👉 So startest du richtig:
[LINK: Eltern-Guide ansehen]

Tipp: Beginne mit 5 Minuten täglich. Lieber kurz und freiwillig als lang und gezwungen.

PS: Wenn dein Kind einmal nicht üben will – keine Panik. Das ist normal. Ich zeige dir im Guide, wie du damit umgehst.

Viele Grüße
Mario

PPS: Hast du Fragen? Einfach antworten – ich lese alle Mails persönlich.
```

---

### Template C0: Willkommen (Lehrer)

**Betreff:** "Materialien für Ihre Bläserklasse – [Name]"

```
Guten Tag [Name],

vielen Dank für Ihr Interesse an Trumpetstar für Schulen.

Ich weiß: In einer Bläserklasse haben Sie unterschiedliche Levels, wenig Zeit und möchten trotzdem jeden Schüler fördern.

Unsere Lösung:
• Individuelle Lernpfade pro Schüler
• Fortschritts-Tracking für Sie
• Unterrichtsmaterialien (Noten, Videos, Übepläne)
• Klassen-Übersicht im Dashboard

👉 Hier sind Beispiel-Materialien:
[LINK: PDF-Download]

Gerne vereinbare ich mit Ihnen ein kurzes Gespräch (15 Min), um Ihre spezifischen Bedürfnisse zu besprechen.

[Button: Termin vereinbaren]

Mit freundlichen Grüßen
Mario Schulter
Gründer, Trumpetstar

---
Für Schulen: Spezielle Konditionen ab 10 Schülern
```

---

### Template A1: Mini-Erfolg (Tag 1)

**Betreff:** "2 Minuten Übung – mach das jetzt"

```
Hallo [Name],

gestern hast du dich angemeldet. Heute kommt deine erste Übung.

Sie dauert 2 Minuten. Wirklich. Danach weißt du, ob die Methode für dich funktioniert.

🎯 Übung: "Das erste Buzzing"
→ Ohne Instrument
→ Nur die Lippen
→ 2 Minuten

[Hier klicken für Video-Anleitung]

Mach es jetzt. Nicht später. Jetzt.

Und dann antworte mir einfach: "Fertig."

Das ist alles.

Mario

PS: Klingt zu einfach? Probier es aus. 90% unserer Schüler hören den ersten Ton innerhalb der ersten Woche.
```

---

### Template A3: Social Proof (Tag 3)

**Betreff:** "„Ich dachte, mit 45 ist es zu spät" – Peter"

```
Hallo [Name],

ich möchte dir Peter vorstellen.

Mit 45 Jahren hat er begonnen, Trompete zu lernen. Nach 3 Monaten spielte er seine ersten Songs.

Sein Kommentar: 
"Ich dachte, ich bin zu alt. Aber die 5-Minuten-Methode passt perfekt in meinen Arbeitstag."

Die häufigste Hürde am Anfang:
"Meine Lippen werden so schnell müde."

Das ist normal! Die Muskulatur braucht Zeit. Übe 5 Minuten, dann pausiere. Nach 2-3 Wochen merkst du den Unterschied.

[Hier geht's zu Peters kompletter Geschichte]

Frage an dich:
Was ist deine größte Sorge beim Trompete-Lernen?

Antworte einfach auf diese Mail. Ich lese alle Antworten persönlich.

Mario
```

---

### Template A5: Soft-Offer (Tag 5)

**Betreff:** "Das hat mir am Anfang gefehlt"

```
Hallo [Name],

als ich angefangen habe, Trompete zu lernen, gab es keine strukturierte Methode.

Ich habe:
• in Büchern gelesen (trocken)
• YouTube-Videos geschaut (unvollständig)
• versucht, selbst zu üben (Frustration)

Heute gibt es Trumpetstar – die Methode, die ich mir damals gewünscht hätte.

Sie beinhaltet:
✓ Schritt-für-Schritt Anleitungen
✓ Video-Tutorials zu jeder Übung
✓ App mit Fortschritts-Tracking
✓ Persönlicher Support

Falls du bereit bist, systematisch zu lernen:
👉 [Mehr über den Pro-Kurs erfahren]

Kein Druck. Nur falls du merkst, dass die kostenlosen Inhalte nicht mehr reichen.

Mario

PS: 30-Tage-Geld-zurück-Garantie. Ohne Fragen. Falls es nicht passt, erstattet.
```

---

### Template A7: Deadline (Tag 7)

**Betreff:** "Letzte Chance: Bonus-Lektionen (heute Abend)"

```
Hallo [Name],

in den letzten 7 Tagen hast du dich mit der Materie beschäftigt.

Du weißt jetzt:
• Wie die Star-Methode funktioniert
• Dass Erwachsene schneller lernen
• Dass 5 Minuten täglich reichen

Heute ist der letzte Tag, an dem du den Pro-Kurs mit Bonus-Lektionen bekommst:

🎁 Bonus bei Anmeldung bis heute 23:59:
• „Erste 30 Tage" detaillierter Plan
• Exklusive Live-Q&A mit mir
• Download: Übeplan-Template

[Nur heute: Pro-Kurs mit Bonus sichern]

Nach heute sind die Bonus-Lektionen nicht mehr verfügbar.

Mario

PS: Falls du noch unsicher bist: Schreib mir einfach. Ich beantworte alle Fragen persönlich.
```

---

## 6) Dashboard-Integration (Supabase)

### Neue Tabellen

```sql
-- E-Mail-Sequenzen
CREATE TABLE email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- "7-Tage-Willkommen"
  segment text NOT NULL, -- "adult", "parent", "teacher"
  description text,
  is_active boolean DEFAULT true
);

-- Einzelne E-Mails in Sequenz
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES email_sequences(id),
  day_number integer NOT NULL, -- 0, 1, 3, 5, 7
  subject_line text NOT NULL,
  body_html text NOT NULL,
  body_text text NOT NULL,
  cta_link text,
  personalisation_tags text[], -- ["first_name", "instrument"]
  ab_test_variant text -- "A", "B"
);

-- Lead-E-Mail-Verlauf (1:1 Tracking)
CREATE TABLE lead_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  email_template_id uuid REFERENCES email_templates(id),
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  clicked_link text,
  replied_at timestamptz,
  reply_content text,
  bounced boolean DEFAULT false,
  unsubscribed boolean DEFAULT false
);

-- Lead-Aktivitäts-Score
CREATE TABLE lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  activity_type text, -- "email_open", "email_click", "page_view", "video_watch"
  activity_data jsonb,
  score_value integer,
  created_at timestamptz DEFAULT now()
);

-- Bot-Entscheidungen (für Audit)
CREATE TABLE bot_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  decision_type text, -- "subject_change", "timing_adjust", "objection_handler"
  reason text,
  original_template_id uuid,
  adjusted_template_id uuid,
  created_at timestamptz DEFAULT now()
);
```

### Dashboard-Views

1. **Lead-Journey-View:**
   - Alle E-Mails pro Lead chronologisch
   - Öffnungen, Klicks, Antworten
   - Aktueller Status in Sequenz

2. **Segment-Performance:**
   - Öffnungsraten pro Segment
   - Click-Through-Rate
   - Conversion-Rate

3. **Bot-Performance:**
   - Welche Anpassungen hat Valentin gemacht?
   - Hat es die Conversion verbessert?
   - A/B-Test Ergebnisse

4. **Echtzeit-Monitor:**
   - Aktive Leads in Sequenz
   - Wer öffnet gerade?
   - Wer ist bei Tag X?

---

## 7) Valentin-Integration

### Automation-Rules (für Valentin)

```yaml
rule: "No Open After 24h"
condition: lead_email.sent_at > 24h ago AND lead_email.opened_at IS NULL
action: send_followup_shorter
priority: high

rule: "Click But No Purchase"
condition: lead_email.clicked_at IS NOT NULL AND lead.purchased = false
action: send_objection_handler
delay: 24h

rule: "High Activity Score"
condition: lead.activity_score >= 3
action: accelerate_offer
priority: medium

rule: "Teacher B2B"
condition: lead.segment = 'teacher' AND lead.email_clicked = true
action: schedule_sales_call
notify: mario@trumpetstar.com
```

### Valentin-Tasks (täglich)

1. **Morgens (9:00):**
   - Check neue Leads über Nacht
   - Segmentiere automatisch
   - Sende Willkommens-E-Mails

2. **Mittags (12:00):**
   - Prüfe Öffnungen
   - Optimiere Betreffzeilen (A/B)
   - Sende Reminders

3. **Abends (18:00):**
   - Analysiere Klicks
   - Trigger Soft-Offers
   - Update Lead-Scores

4. **Wöchentlich (Sonntag):**
   - Performance-Report
   - A/B-Test Ergebnisse
   - Segment-Optimierung

---

## Nächste Schritte

1. [ ] Supabase-Tabellen erstellen
2. [ ] E-Mail-Templates in Datenbank einfügen
3. [ ] Valentin-Automation-Skripte schreiben
4. [ ] Dashboard-UI bauen
5. [ ] A/B-Test Framework
6. [ ] Test mit kleiner Gruppe
7. [ ] Live-Schaltung

---

**Fertig für Implementation!** 🚀
