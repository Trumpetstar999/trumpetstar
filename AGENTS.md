# Architecture rules
- Keep level browsing in the LevelsPage flow, with a reusable LevelGrid for overview tiles; selecting a tile reuses existing video playback and usage checks.
- Serve the branded share image as a static public asset referenced by absolute URLs in the sitewide head so non-JavaScript social crawlers can load it.
- Resolve purchase destinations through the shared verified plan-and-billing-period checkout registry, never cached membership links or fallbacks, so unverified products fail closed without modifying existing entitlements.
- Keep password recovery public and exempt from mobile app redirects; preserve recovery intent before the auth client consumes callback tokens.
- Use Happy DOM for component tests to avoid native canvas requirements in the managed test sandbox.