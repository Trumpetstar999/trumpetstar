
## Problem

Die IPN-Funktion verarbeitet alles **synchron** bevor sie antwortet. Der kritische Flaschenhals ist `supabase.auth.admin.listUsers()` — dieser Aufruf lädt ALLE registrierten User, um dann per `.find()` einen einzelnen per E-Mail zu suchen. Mit wachsender Userzahl dauert das immer länger. Digistore24 hat ein kurzes Timeout (~5–10 Sek.) und wiederholt den IPN, wenn keine Antwort kommt — daher dieselbe Bestellung 8x.

## Lösung — 2 Änderungen in `supabase/functions/digistore24-ipn/index.ts`

### 1. User-Lookup beschleunigen (kritischste Änderung)

Ersetze `listUsers()` durch einen direkten GoTrue REST API-Aufruf mit E-Mail-Filter:

```diff
- const { data: existingUsers } = await supabase.auth.admin.listUsers();
- const existingUser = existingUsers?.users?.find(u => u.email === normalized.email);
+ // GoTrue admin search by email — O(1) statt O(n)
+ const userSearchRes = await fetch(
+   `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalized.email)}`,
+   { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
+ );
+ const { users: foundUsers } = await userSearchRes.json();
+ const existingUser = foundUsers?.[0];
```

### 2. 200 sofort zurückgeben — Verarbeitung danach (fire-and-forget)

Nachdem das Event gespeichert wurde, sofort `200 ok` an Digistore24 senden und die Verarbeitung danach im Hintergrund laufen lassen:

```diff
- // Process SYNCHRONOUSLY
- await processIpnEvent(...);
- return new Response("ok", { status: 200 });
+ // Antwort SOFORT — Digistore bekommt 200 bevor Timeout
+ const ipnResponse = new Response("ok", { status: 200, headers: ... });
+ // Hintergrundverarbeitung (fire-and-forget)
+ processIpnEvent(...).catch(err => console.error('[IPN async error]:', err));
+ return ipnResponse;
```

## Technische Details

- **Datei:** `supabase/functions/digistore24-ipn/index.ts` — nur 2 Stellen
- Die Idempotenz-Prüfung bleibt aktiv — doppelte Events werden weiterhin erkannt und übersprungen
- Deno Server hält die Funktion am Laufen bis `processIpnEvent` fertig ist (fire-and-forget ist in Deno sicher)
- Die Funktion wird nach der Änderung neu deployed
