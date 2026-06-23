# Contract: Live Test Command

## Commands

```text
npx playwright install chromium
npm run test:e2e:live
```

Browser installation is explicit setup. `test:e2e:live` MUST NOT be called by `npm test` or
`npm run validate`.

## Preconditions

- Platform is macOS.
- Node dependencies and Playwright-managed Chromium are installed.
- The public target URL is reachable.
- No manual browser profile or extension installation is required.

## Required flow

1. Build `dist/` and compare source/built manifest identity and permissions.
2. Create a fresh temporary profile and launch headed Playwright Chromium with only `dist/` loaded.
3. Verify browser-owned extension state before opening the restaurant page.
4. Open the exact target URL and reject cross-origin redirects or interstitials.
   Record request provenance: direct harness requests are limited to the restaurant origin, while
   document-initiated subresources are retained only as bounded origin evidence.
5. Find and select the visible Whiskey Empire control without manual intervention.
6. Focus the page, run Chromium's browser-owned default action for the extension and active tab target,
   and observe the resulting extension popup target. If the toolbar bubble is not exposed as a page,
   open the unchanged production popup in a background extension tab only after action activation and
   keep the restaurant tab active.
7. Click the production popup's `Scan whiskey list` button.
8. Observe the injected production panel and require `Scan complete` plus a positive count.
9. Search with a token derived from an observed name and require a positive matching subset.
10. Select `price-desc` and require the selected value and descending price `aria-sort`.
11. Close Chromium, delete the temporary profile, retain the sanitized report, and prune reports
    older than the newest ten.

Opening the popup URL directly, injecting `content.js` from the test, importing production internals,
editing the manifest, or accepting partial/unsupported/zero-result status violates this contract.
Any direct harness request to analytics, logging, artifact hosting, or a non-restaurant runtime
destination also violates this contract.

## Stage deadlines

Every stage has its own deadline and all work stages share a 115-second deadline. Cleanup has a
reserved five seconds; the process hard-stops at 120 seconds. A timeout reports the active stage,
last successful stage, and cleanup outcome.

## Exit behavior

| Exit | Meaning |
|------|---------|
| `0` | All live assertions and cleanup passed |
| `1` | Product flow or assertion failed |
| `2` | Prerequisite/environment blocked the run |
| `124` | Global timeout elapsed |
| `130` | Interrupted; cleanup attempted |

Every exit writes a report conforming to `diagnostic-report.schema.json`. Console output includes the
report path, final outcome, last successful stage, first failed stage, and cleanup summary.
