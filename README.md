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

## Publish to the Chrome Web Store

Use these notes when preparing the extension for the Chrome Web Store developer catalog.

1. Run the release checks:

   ```bash
   npm run validate
   npm run test:e2e:live
   ```

2. Generate the Chrome Web Store listing image:

   ```bash
   npm run store:assets
   ```

   Upload-ready files are written to `assets/store/`:

   - Screenshots: `chrome-web-store-screenshot-*.png`, each 640×400, 24-bit PNG, no alpha.
   - Small promotional tile: `chrome-web-store-promo-440x280.png`, 440×280, 24-bit PNG, no alpha.
   - Marquee promotional tile: `chrome-web-store-marquee-1400x560.png`, 1400×560, 24-bit PNG, no alpha.

   Raw screenshot captures are preserved in `assets/store-source/` and should not be uploaded
   directly. The extension toolbar/store icon itself is already packaged through `manifest.json`
   from `assets/icons/`.
3. Review `manifest.json` before packaging. The store listing reads important metadata from the
   manifest, including `name`, `description`, `version`, and `icons`. Increment `version` for each
   uploaded release.
4. Build the production extension:

   ```bash
   npm run build
   ```

5. Zip the contents of `dist/` so `manifest.json` is at the root of the archive:

   ```bash
   cd dist
   zip -r ../whiskey-empire-west-chrome-web-store.zip .
   ```

6. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole),
   choose **Add new item**, and upload the zip file.
7. Complete the store listing with screenshots, a concise description, and test instructions. Suggested
   review note:

   > Open `https://thewestsideblono.com/drink/drink-menu/`, click the extension action, then click
   > **Scan whiskey list**. The extension selects Whiskey Empire automatically and renders the local
   > searchable/sortable panel above the restaurant list.

8. Complete the privacy and permission fields consistently with the implementation:

   - Single purpose: improve browsing of the Whiskey Empire list on the Westside BloNo drink menu.
   - Permissions: `activeTab` grants temporary access after the user clicks the extension; `scripting`
     injects the local bundled scanner and UI into the active tab.
   - Remote code: none. All extension JavaScript, CSS, and icons are packaged in `dist/`.
   - Data use: no analytics, accounts, backend, persistent storage, or sale/sharing of user data.
     Whiskey entries and search/filter state stay in memory and are discarded when the panel/page closes.
   - Network behavior: scanning reads the current restaurant page and validated Untappd pagination URLs;
     the optional Google Search link opens a new tab only when the user clicks it.

9. Publish [PRIVACY_POLICY.md](PRIVACY_POLICY.md) at a public URL and use that URL for the Chrome Web
   Store privacy policy field. Replace the Contact placeholder before submission.
10. Submit for review. If deferred publishing is selected, publish manually from the dashboard after
   review completes.

Official references: [prepare your extension](https://developer.chrome.com/docs/webstore/prepare),
[publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish), and
[fill out privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).

## Safe failure

If Whiskey Empire cannot be opened, page structure is unsupported, a pagination request fails, or a safety
limit is reached, the extension shows guidance or labeled partial results and leaves the restaurant
page intact. It never requests broader access as recovery.

See [the production quickstart](specs/001-enhance-whiskey-list/quickstart.md) and
[the live E2E quickstart](specs/002-live-extension-e2e/quickstart.md) for validation scenarios.
