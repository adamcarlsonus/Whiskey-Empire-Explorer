# Whiskey Empire West

A privacy-first Chrome Manifest V3 extension that opens the Whiskey Empire collection and adds
full-list search, price/name sorting, and searchable distillery filtering to the Westside BloNo menu.

## Privacy and permissions

- Uses only `activeTab` and `scripting` after an explicit extension action and popup Scan.
- Has no persistent host permission, background worker, storage, analytics, telemetry, or backend.
- Reads only the Whiskey Empire list and its validated Untappd pagination URLs.
- Keeps entries and search/filter state in memory until the panel or page closes.

## Development and validation

```bash
pnpm install
npm run e2e:install
npm run validate
npm run test:e2e:live
```

- `npm run validate` is deterministic and offline-capable. It runs TypeScript checks, unit/DOM
  fixtures—including the live Untappd layout contract—harness contract tests, and the production build.
- `npm run test:e2e:live` is an explicit network-dependent check. It launches a fresh Playwright-
  managed Chromium profile, loads the unchanged `dist/` package, opens the actual restaurant page,
  observes Whiskey Empire, triggers the browser-owned extension action, uses the production popup Scan,
  and requires complete non-empty results, live-derived search, descending price sort, and cleanup.
- Live reports remain local under `test-results/live-extension/<run-id>/report.json`; only the newest
  ten are retained. They contain bounded status/count/origin evidence, not whiskey rows or page HTML.

The unpacked extension is emitted to `dist/`. Browser installation is explicit and never occurs as a
side effect of deterministic validation.

### Latest live result

**PASSED — 2026-06-23**. Run `2026-06-23T23-25-19-431Z-7b1b010d` verified production selected
Whiskey Empire automatically and collected all 1,261 advertised entries, with live search,
`price-desc`, descending `aria-sort`, unchanged permissions, and successful cleanup.

## Install locally

1. Run `npm run build`.
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select this repository's `dist/` folder.
4. Open <https://thewestsideblono.com/drink/drink-menu/>.
5. Open the extension popup and choose **Scan whiskey list**. The extension selects **Whiskey Empire**.

The inline panel appears above the original list. Closing it removes only extension UI and discards
all temporary data.

## Safe failure

If Whiskey Empire cannot be opened, page structure is unsupported, a pagination request fails, or a safety
limit is reached, the extension shows guidance or labeled partial results and leaves the restaurant
page intact. It never requests broader access as recovery.

See [the production quickstart](specs/001-enhance-whiskey-list/quickstart.md) and
[the live E2E quickstart](specs/002-live-extension-e2e/quickstart.md) for validation scenarios.
