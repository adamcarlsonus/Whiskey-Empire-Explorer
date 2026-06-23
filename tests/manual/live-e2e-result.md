# Live E2E Result

**Latest outcome**: PASSED
**Run ID**: `2026-06-21T18-02-19-632Z-09233b4f`
**Browser**: Playwright Chromium 149.0.7827.55
**Duration**: 9.2 seconds
**Extension**: Whiskey Empire West 0.1.0, Manifest V3
**Permissions**: `activeTab`, `scripting`; no host permissions

The production `dist/` package was accepted by Chromium. The run selected Whiskey Empire, invoked
the browser-owned default action, opened the production popup, started Scan, observed 100 normalized
entries, filtered to six matches using a live-derived query, selected price high-to-low, observed
`aria-sort="descending"`, closed Chromium, and removed its isolated profile.

`npm run validate` also passed 28 production unit/DOM tests and 21 offline harness tests, including
the live Untappd fixture, failure matrix, schema conditions, privacy bounds, and cleanup isolation.
The final live run remained well below the 120-second hard budget, produced zero unexpected harness
requests, and its report validates against the JSON schema.

Local structured evidence is retained at
`test-results/live-extension/2026-06-21T18-02-19-632Z-09233b4f/report.json`.
