# F1 Telemetry Archive

A desktop-first Formula 1 circuit exploration app built with Vite, vanilla ES modules, GSAP 3, ScrollTrigger, Flip, Lenis and SVG. No API key, backend or runtime data request is required. Fonts and map assets are served locally.

## Run

Requires Node.js 22.12+ (Node 24 also supported).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Use a desktop viewport at least 1024 px wide. For an environment that restricts network-interface enumeration, run `npm run dev -- --host 127.0.0.1`.

```sh
npm run check:data
npm run build
npm run preview
```

Do not open `index.html` with `file://`; modules require an HTTP server. The included `dist/` is a ready-built static distribution.

## Codebase structure

```text
f1-telemetry-archive/
  index.html                    Semantic shell, archive controls and native dialogs
  package.json                  Development, validation and build scripts
  package-lock.json             Reproducible dependency versions
  vercel.json                   Vite deployment settings and cache headers
  .github/workflows/build.yml   Build and dataset checks on push / PR
  src/
    main.js                     Rendering, search, filters, sorting, view state
    motion.js                   GSAP/Lenis integration, intro, cursor, scroll motion
    maps.js                     Vector rendering and keyboard-operable markers
    telemetry.js                Flip dossier, lap animation, tabs and layout selector
    styles.css                  Desktop telemetry theme and reduced-motion rules
    fonts.css                   Local font-face declarations
    data/
      circuits.json             78 sourced venue profiles and configuration records
      profiles.js               Six illustrative sim coaching profiles
  public/
    maps/                       160 historical SVG configuration diagrams
    fonts/                      Barlow Condensed, DM Sans and IBM Plex Mono
  scripts/
    check-data.mjs              Dataset integrity and asset validation
    import-data.py              Circuit registry, records and GeoJSON ingestion
    import-layouts.py           Historical layout archive join
  licenses/                     Font and diagram licences
  THIRD_PARTY_GEOMETRY_LICENSE.txt
  DATA_COVERAGE.md              Exact scope and known data gaps
  QA.md                         Checks performed and remaining limitations
  dist/                         Ready-built static assets
```

## Implemented experience

- A Monaco-outline intro, staggered title reveal, skip control and timeout fail-safe. The intro runs once per tab session.
- Dual-ring pointer with coordinate reticle and magnetic offset on small interactive targets. Keyboard use restores the native cursor. The reticle moves into the dialog top layer when a dossier opens.
- Lenis driven by the GSAP ticker, ScrollTrigger updates, pinned featured section, reversible SVG drawing, scroll parallax and clamped velocity skew.
- 78 circuits, case/accent-insensitive search, country and racing-decade filters, recent/historic classification, sorting, grid/list views, empty state and progressive display.
- Six featured circuit selections and a GSAP Flip map transition into a full-screen native dialog.
- Clickable and keyboard-operable corner notes for Spa, Monza, Suzuka, Monaco, Silverstone and the Nürburgring GP circuit. A schematic lap can be played and paused.
- Driving guide, configuration-specific published race records, history, elevation availability and sources tabs.
- 160 selectable historical diagrams, including the Nordschleife, old Monza banking layouts and historical Spa.
- Escape to close; focus restoration; arrow-key tab navigation; `/` to search; reduced-motion support. Sub-1024px screens display a desktop-use notice as requested.

## Data semantics — read before extending

The software is a functional archive; the dataset is **not a complete measured telemetry database**. See `DATA_COVERAGE.md`.

- Venue coverage is complete for the imported 78-row registry, dated 29 September 2026. This includes Indianapolis championship appearances under their contemporary regulations.
- Current dimensions refer to the last F1 layout in the registry. Geographic plans, historical diagrams and old records are different layers and must not be silently treated as identical configurations.
- Historical diagram eras come from the map source and can group revisions broadly. Championship appearances come from the registry; diagram era ranges are not proof of a race in every year.
- Published F1 race records are extracted only when the entry identifies F1 / Formula One as its category. Motorcycle, sports-car and EuroBOSS records are excluded from the displayed F1 list.
- Race records are separate from outright fastest official-session laps. Spa includes a sourced 2020 qualifying record. The other outright fields are explicitly unverified.
- Six hand-authored coaching profiles use **illustrative** dry modern-F1 gear/speed ranges. They are not measured telemetry, simulation-independent recommendations or braking-distance calculations. Map marker positions and coloured sector divisions are schematic.
- No surveyed elevation trace is fabricated. The elevation tab reports missing data; Spa also has an approximate vertical-range reference.
- Recent means the source registry lists an appearance in 2025 or later. It is not a claim of current calendar membership.

To add real telemetry, attach samples to an explicit `circuitId`, `layoutId`, simulator, car, weather, tyres and session. Keep distance in metres, speed in km/h, braking in a declared unit, and record provenance. Add validated corner positions and coaching data to `profiles.js`. Preserve the distinction between measured and illustrative values.

## Data refresh

The checked-in data makes builds deterministic. Import scripts are optional authoring tools and need network access plus Python 3, pandas and lxml. The base importer uses the current circuit registry and source circuit pages; review their changes before committing. It also downloads `bacinger/f1-circuits` geographic geometry. Then download the `julesr0y/f1-circuits-svg` repository and run:

```sh
python scripts/import-data.py
python scripts/import-layouts.py /absolute/path/to/f1-circuits-svg-main
npm run check:data
npm run build
```

The integrity check intentionally pins the 78-venue snapshot. When a newly raced venue is confirmed, review and update that assertion. Map sources are complementary: geographic plans are not survey-grade track boundaries, and historical diagrams are schematic.

## GitHub and Vercel

The codebase is repository-ready. Create or select your own GitHub repository, push these files and import it into Vercel. The included configuration uses `npm run build` and publishes `dist`. No environment variables are needed. The GitHub Actions workflow checks data, builds and uploads the static build artifact.

Alternatively, from an authenticated Vercel CLI:

```sh
npx vercel
```

This delivery does **not** create a GitHub repository or claim a Vercel deployment. No target repository/project was specified; the available Vercel deployment connector did not expose a working deployment action.

## Attribution

- Registry and circuit descriptions: [Wikipedia circuit list](https://en.wikipedia.org/wiki/List_of_Formula_One_circuits) and individual linked circuit articles. Adapted descriptive text: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Structured sporting facts retain per-entry source links.
- Geographic paths: [Tomislav Bacinger — f1-circuits](https://github.com/bacinger/f1-circuits), MIT. Longitude is scaled by latitude; points are fitted into a common SVG viewport.
- Historical diagrams and layout metadata: © 2024–2026 ROY Jules (julesr0y), [f1-circuits-svg](https://github.com/julesr0y/f1-circuits-svg), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Diagram colours are inverted for the dark interface; geometry is unchanged. Full licence included.
- Spa qualifying record: [Formula 1 — Hamilton’s record-breaking 2020 pole lap](https://www.formula1.com/en/latest/article/watch-hamiltons-record-breaking-pole-lap-at-spa-for-the-belgian-grand-prix.1Omiln4DYwzGhsJRq7Ibzm).
- Fonts: Barlow Condensed, DM Sans, IBM Plex Mono; SIL Open Font License. Licences included.

Independent fan archive. Not affiliated with Formula 1, the FIA or any team. Names and marks belong to their respective owners.
