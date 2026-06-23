# Whiskey Empire West

A privacy-first Chrome Manifest V3 extension that adds full-list search, price/name sorting, and
category filtering to the Whiskey Empire tab on the Westside BloNo drink menu.

## Privacy and permissions

- Uses only `activeTab` and `scripting` after an explicit extension action and popup Scan.
- Has no persistent host permission, background worker, storage, analytics, telemetry, or backend.
- Reads only the active Whiskey Empire list and same-origin pagination URLs.
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
  selects Whiskey Empire, triggers the browser-owned extension action, uses the production popup Scan,
  and requires complete non-empty results, live-derived search, descending price sort, and cleanup.
- Live reports remain local under `test-results/live-extension/<run-id>/report.json`; only the newest
  ten are retained. They contain bounded status/count/origin evidence, not whiskey rows or page HTML.

The unpacked extension is emitted to `dist/`. Browser installation is explicit and never occurs as a
side effect of deterministic validation.

### Latest live result

**PASSED — 2026-06-21**. Run `2026-06-21T18-02-19-632Z-09233b4f` observed 100 normalized entries,
six live-derived search matches, `price-desc`, descending `aria-sort`, unchanged permissions, and
successful browser/profile cleanup. See [live-e2e-result.md](tests/manual/live-e2e-result.md).

## Install locally

1. Run `npm run build`.
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select this repository's `dist/` folder.
4. Open <https://thewestsideblono.com/drink/drink-menu/>.
5. Select **Whiskey Empire**, open the extension popup, and choose **Scan whiskey list**.

The inline panel appears above the original list. Closing it removes only extension UI and discards
all temporary data.

## Safe failure

If the target tab is inactive, page structure is unsupported, a pagination request fails, or a safety
limit is reached, the extension shows guidance or labeled partial results and leaves the restaurant
page intact. It never requests broader access as recovery.

See [the production quickstart](specs/001-enhance-whiskey-list/quickstart.md) and
[the live E2E quickstart](specs/002-live-extension-e2e/quickstart.md) for validation scenarios.
