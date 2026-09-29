# Verification

Verified 29 September 2026 with a locally launched headless Chromium browser at 1440 × 1100, using Playwright after the agent-browser daemon could not start in this environment.

Passed:

- Production Vite build and Python importer syntax checks.
- Dataset integrity: 78 unique venues, all primary maps, valid SVG/PNG image signatures, positive lengths and turn counts, configuration-labelled record entries, six valid coaching profiles.
- Page title and initial 12 cards render; cinematic intro dismisses.
- Spa dossier opens; selecting T5 updates to Les Combes.
- Record tab separates 1:41.252 qualifying from configuration-labelled race records.
- Escape closes the dossier and returns to the archive.
- Searching `Nordschleife` resolves Nürburgring.
- No-result search exposes the empty state; reset restores results.
- 1950s filter returns 19 venues; Japan filter returns three.
- Grid/list view switch changes layout.
- Nürburgring historical selector loads `nurburgring-1.svg` for the Nordschleife.
- Brands Hatch historical primary map decodes successfully.
- Progressive loading displays all 78 cards.
- 800px viewport displays the requested desktop-only notice.
- No JavaScript page errors during the interaction sequence.
- Home, dossier and catalog screenshots visually inspected.

Not claimed: measured frame-rate benchmarks, cross-browser certification, survey-grade map geometry, exhaustively verified all-time records, or complete measured circuit telemetry. The source data and attribution links remain available in each dossier.
