# QA Reports — Trumpetstar

Hier sammelt Seppl-Checker alle Reports. Automatisch befüllt vom Valentin Orchestrator.

## Struktur
```
qa_reports/
  README.md                         ← Diese Datei
  2026-10_weekly_full_check.md      ← KW10 Weekly Report
  2026-10_summary.json              ← KW10 JSON Summary
  2026-11_weekly_full_check.md      ← KW11 Weekly Report
  ...
  
release_gates/
  TEMPLATE_RC.md                    ← Vorlage
  RC_1.0_2026-03-03.md              ← Release Gate Decision
  ...
```

## Trigger-Befehle an Valentin

**Wöchentlicher Check (automatisch, jeden Montag 06:00 Wien):**
Cron-ID: `edf02ab3-46fb-4868-a710-6efa1c292a3b`

**Manuell triggern:**
Schreibe Valentin: `"Seppl-Checker: Run Release Check"` oder `"Seppl-Checker: Weekly Full-Check"`

**Release Gate:**
Schreibe Valentin: `"Run Release Check für Version X.Y"`

## GO/NO-GO Regeln
- **GO**: Keine P0/P1 Bugs, keine Security-Leaks, Mobile funktioniert
- **NO-GO**: Mind. 1 offener P0 oder Critical Security Finding

## Eskalation
Bei Critical/P0 → Sofort Telegram-Alert an Mario
