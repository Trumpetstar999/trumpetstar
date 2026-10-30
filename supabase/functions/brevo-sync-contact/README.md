# App welcome voucher automation

`brevo-sync-contact` keeps existing contact synchronization. An authenticated `source: "app_user"` request uses the verified auth user's email, not the supplied email. The first reservation permanently captures the client language (`de`, `en`, `es`, `sl`, otherwise `de`) and first name. Existing app users changing language are eligible if they have no previous reservation; no bulk backfill runs.

## Current offer

New reservations use `WELCOME25-` codes with exactly 25% on the first payment; later rates remain 0%, upgrades excluded, one redemption, exactly 72 hours. All DE/EN/ES/SL subjects and messages reflect 25%. Existing sent production records are not changed or deleted. Existing unsent legacy reservations require reconciliation before delivery; never send a 25% mail against an old 15% voucher or create another voucher blindly.

### 25% deployment verification (2026-10-30)

39 checks passed (21 welcome rules/retries and 18 payment-security checks). Function redeployed. Protected `test_welcome` and `inspect_test_voucher` requests returned 401 because no usable preview admin session was injected; automatic self-session minting also had no matching auth user. Database still has exactly one singleton test row, `voucher_uncertain`, without a Brevo message ID. No ledger was reset, no production records changed, and no new voucher or mail was created in this run. Live 25% voucher values, Brevo delivery and successful live retry remain unverified. The existing legacy test requires provider reconciliation, not a second voucher.

## One-time admin E2E test

While signed in as a database-backed admin, invoke the existing function through the app's managed client:

```ts
await supabase.functions.invoke('brevo-sync-contact', {
  body: { test_welcome: true, language: 'de', first_name: 'Mario' }
});
```

The target is always `schulterm@me.com`; request email is ignored. The singleton test uses a reserved synthetic user ID, `is_test=true`, and the same unique email index as production. It neither consumes the admin's welcome entitlement nor changes contact lists. A second call cannot create a second voucher or email; successful repeat returns `alreadySent:true`. Do not delete/reset the test row. This is a **real voucher and real email**, not a simulated send.

## Verification

1. Cloud database: inspect `app_welcome_vouchers WHERE is_test=true`; expect `sent`, one code, exact creation + 72-hour expiry, `brevo_message_id`, and `sent_at`. Anon/authenticated clients cannot read or write this ledger.
2. Digistore24 account: find the stored code, confirm products `346007,575565`, first rate `25`, other rates `0`, upgrade policy `not_valid`, count limit `Y`, count left `1`, and timestamps. Check checkout prefill without completing a purchase. The documented parameter is `voucher`, as requested: https://help.digistore24.com/hc/en-us/articles/23640618463633-Pre-fill-order-form-with-GET-parameters .
3. Brevo transactional log: find `brevo_message_id`, verify recipient, sender `Trumpetstar GmbH <info@trumpetstar.com>`, language and delivery status. `sent` means Brevo accepted the send, not inbox receipt; confirm inbox separately.
4. Repeat the request; verify row count, voucher count and mail count remain one.

## Failure handling

Atomic database stage claims prevent parallel sends. Explicit provider rejections leave `voucher_failed` or `mail_failed`; repeat the original authenticated sync after correcting the failure. Mail retries reuse the original voucher/code/expiry/language. `voucher_creating`, `sending`, `voucher_uncertain`, `mail_uncertain` are **never automatically retried**: a timeout or worker crash may have happened after the provider accepted the action. Inspect provider records before service-role reconciliation to `voucher_created`, `mail_failed` (only if demonstrably not accepted), or `sent` with the real Brevo ID. No system can guarantee automatic exactly-once across non-idempotent external APIs and lost acknowledgements; this implementation chooses duplicate prevention over blind retries. Expired vouchers are not regenerated.

The caller sees welcome status even when a language contact list is missing or auto-sync is disabled. Welcome email is independent of newsletter lists. Currently EN/ES/SL lists are not configured; this does not block their welcome mail or create new lists.

## Required secrets

- `DIGISTORE24_API_KEY`: existing direct legacy API key, permission to create vouchers.
- `BREVO_API_KEY`: existing linked Brevo connector credential (gateway-backed, not a direct provider key).
- `LOVABLE_API_KEY`: existing gateway authentication.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: existing managed runtime values.

No new secret names are introduced. Provider permissions and verified sender still require live verification.

## Executed checks (October 30, 2026)

- 15 welcome business-rule/concurrency/retry tests and 18 existing payment-security tests passed.
- Schema applied; unique user, normalized email, voucher code and singleton-test indexes confirmed; latest application build OK.
- Deployed unauthenticated test returned 401. Authenticated admin test reached Digistore24; HTTP 200 did not contain the expected `result: success`, so the ledger is `voucher_uncertain`. A repeat kept the same row/status and did not send a mail.
- Admin-only read-only lookup (`inspect_test_voucher: true`) returned a successful provider envelope, but no positively identified coupon record. The test voucher creation and Brevo send are **not verified**. No success is claimed and uncertain state is not reset.
- Required named secrets are already configured. The remaining blocker is the provider createVoucher response/permission reconciliation, not an identified missing secret. Check the reserved code in Digistore24 before any retry. Inbox delivery and actual redemption still need verification.

## Follow-up correction

The current official reference at https://digistore24.com/api/docs/index.html (schemas `paths/createVoucher.yaml` and `paths/getVoucher.yaml`) documents `data.discount_code_id` plus `data.code` for creation and a top-level `coupon` for lookup. The implementation now accepts an identified creation result for the exact reserved code even without `result`, and reads the top-level coupon. Legacy form-urlencoded fields remain exactly as requested. Provider dates use documented ISO 8601 whole seconds with explicit `+00:00`, with new reservations also rounded to seconds to keep the 72-hour interval exact.

The earlier uncertain test reservation has not been reset. A fresh authenticated admin lookup is required; no active requester session was available for this follow-up, and automatic session minting could not match the requesting user's account. Sign in in the preview before rerunning `inspect_test_voucher: true`. The corrected code has unit coverage, but this is not a claim of a successful provider send.