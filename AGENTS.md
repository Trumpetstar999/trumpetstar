# Architecture rules
- Derive membership lookup identity from a verified server-side session; payment imports require a database-backed admin role, and purchase notifications must authenticate before persistence or fulfillment.
- Verify original Digistore24 parameters with the official case-sensitive SHA-512 signature, strip credential fields before storage, keep order ownership immutable and recompute plans from active entitlements while preserving manual overrides.
- Keep level browsing in the LevelsPage flow, with a reusable LevelGrid for overview tiles; selecting a tile reuses existing video playback and usage checks.
- Serve the branded share image as a static public asset referenced by absolute URLs in the sitewide head so non-JavaScript social crawlers can load it.
- Resolve purchase destinations through the shared verified plan-and-billing-period checkout registry, never cached membership links or fallbacks, so unverified products fail closed without modifying existing entitlements.
- Keep password recovery public and exempt from mobile app redirects; preserve recovery intent before the auth client consumes callback tokens.
- Use Happy DOM for component tests to avoid native canvas requirements in the managed test sandbox.
- Keep operational mail templates and sync logs admin-only; audio metadata and review prompts require sign-in, and private course PDFs require exact document-to-object binding plus server-side plan entitlement.