# Architecture rules
- Keep level browsing in the LevelsPage flow, with a reusable LevelGrid for overview tiles; selecting a tile reuses existing video playback and usage checks.
- Serve the branded share image as a static public asset referenced by absolute URLs in the sitewide head so non-JavaScript social crawlers can load it.