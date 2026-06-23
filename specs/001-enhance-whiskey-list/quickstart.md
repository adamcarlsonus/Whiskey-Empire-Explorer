# Quickstart: Validate Enhanced Whiskey List Browsing

## Prerequisites

- Current stable desktop Google Chrome
- A supported Node.js release with npm
- Network access to `https://thewestsideblono.com/drink/drink-menu/` for live validation

## Install and build

```bash
npm install
npm run build
```

Expected result: `dist/` contains `manifest.json`, popup assets, and the bundled injected script with
its packaged panel styles. The manifest declares only `activeTab` and `scripting` permissions and no host permissions,
background worker, storage, or static content scripts.

## Run automated validation

```bash
npm test
npm run typecheck
```

Expected result:

- Price parsing covers sortable values, ranges, multiple pours, and unrelated numbers.
- Sorting is stable and always places unparseable prices last.
- Normalization requires name and displayed price while preserving optional visible text.
- DOM fixtures prove extraction, pagination URL validation, unsupported-layout failure, idempotent
  panel injection, and safe text rendering.

## Load the unpacked extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked** and select the repository's `dist/` directory.
4. Confirm Chrome shows no broad site-access warning.

## Validate the live primary flow

1. Open `https://thewestsideblono.com/drink/drink-menu/`.
2. Select the **Whiskey Empire** tab yourself.
3. Open the extension popup and choose **Scan**.
4. Confirm one inline panel appears above the original list and the original content remains intact.
5. Confirm progress changes once per page and the popup may close without stopping the panel scan.
6. Search for text found in name and optional fields on different pagination pages.
7. Sort by name, price low-to-high, and price high-to-low.
8. Filter by category when categories are exposed, then reset all criteria.
9. Confirm the combined count and spot-check entries from the first, middle, and final pages.

## Validate privacy and permissions

1. Inspect the installed manifest and confirm only `activeTab` and `scripting`.
2. In Chrome DevTools Network, confirm scan traffic goes only to the restaurant page and validated
   `business.untappd.com` items pagination URLs, with no credentials, query text, or collected rows transmitted.
3. Navigate away and confirm temporary page access and in-memory results end.
4. Confirm no local, session, or synchronized extension storage contains whiskey or interaction data.

## Validate accessibility

1. Complete Scan, search, filter, sort, reset, retry, and close using only the keyboard.
2. Confirm visible focus and sensible focus movement on panel open and close.
3. At 200% zoom, confirm controls reflow and results remain readable.
4. With a screen reader, confirm page progress, completion/failure, result counts, and sort state.
5. Enable reduced motion and confirm no required information depends on animation.

## Validate failure behavior

- Activate before selecting Whiskey Empire: show guidance without scraping other drink sections.
- Activate on another URL: popup disables Scan and requests no broader access.
- Use the unsupported fixture: show a clear error and preserve the source page.
- Simulate a failed middle page: retain labeled partial results and offer Retry.
- Simulate cyclic pagination and more than 20 pages: stop safely with a warning.
- Click Scan repeatedly: focus the existing panel without duplicate requests or UI.

Record live findings in `tests/manual/live-page-checklist.md`. If the live DOM differs from captured
fixtures, update only the target adapter and fixtures; do not move selector logic into domain or UI
modules.
