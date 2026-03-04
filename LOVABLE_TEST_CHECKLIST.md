# ✅ Lovable Test-Checkliste

## Status: Warte auf SQL-Ausführung

### Schritt 1: SQL Ausführen (in Lovable)

1. Gehe zu **Supabase** (im Lovable-Interface)
2. Klicke auf **SQL Editor**
3. Füge den SQL-Code aus dem Prompt ein (Abschnitt "SCHRITT 1")
4. Klicke **Run**
5. Prüfe auf grüne "Success"-Meldung

**Wichtig:** SQL muss in EINER Session ausgeführt werden (nicht geteilt)

---

### Schritt 2: Daten Seeding (Templates)

Nach erfolgreicher Tabellen-Erstellung:

1. Füge den Seed-SQL ein (Abschnitt "SCHRITT 2")
2. Klicke **Run**
3. Prüfe: "7 rows affected" oder ähnlich

---

### Schritt 3: Verifizierung

Sobald SQL durch ist, kann ich testen:

```bash
# Ich werde dann prüfen:
- lead_segments: 3 Einträge (adult, parent, teacher)
- email_sequences: 3 Einträge
- email_templates: 5+ Einträge
- RLS Policies: Aktiviert
```

---

### Schritt 4: UI Komponenten

Erstelle dann:

1. **/admin/marketing** Seite
   - Stats-Cards (Leads, Open Rate, etc.)
   - Tabs: Leads / E-Mails / Sequenzen
   - Tabelle mit 1:1 Tracking

2. **/hilfe-center** Seite
   - Öffentliche FAQ
   - Suchfunktion
   - Kategorie-Filter

3. **Lead-Capture Form**
   - Onboarding mit Segment-Erkennung
   - Speichert in DB
   - Triggert Willkommens-E-Mail

---

### Aktueller Status

⏳ **Warte auf:** SQL-Ausführung durch Lovable

Sobald du "SQL ist ausgeführt" sagst, teste ich sofort!

---

### Fehlerbehebung

Falls SQL fehlschlägt:

| Fehler | Lösung |
|--------|--------|
| "Table already exists" | Lösche alte Tabellen erst |
| "RLS policy" | Führe RLS-Teil separat aus |
| "Syntax error" | Prüfe auf fehlende Semikolons |
| "Permission denied" | Nutze Service Role Key |

---

### Test nach SQL-Ausführung

Ich werde dann testen:
- ✅ Tabellen existieren
- ✅ Segmente korrekt geseedet
- ✅ Templates vorhanden
- ✅ RLS funktioniert
- ✅ INSERT möglich

**Sag Bescheid wenn SQL durch ist!** 🚀
