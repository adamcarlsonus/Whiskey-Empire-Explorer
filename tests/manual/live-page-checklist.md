# Live Restaurant Page Validation

**Target**: https://thewestsideblono.com/drink/drink-menu/  
**Required state**: Fresh isolated browser profile; production Scan selects Whiskey Empire.  
**Result legend**: PASS / FAIL / BLOCKED with dated notes and evidence.

**2026-06-21 automation note**: PASSED — Playwright-managed Chromium loaded the production `dist/`
package and completed the real action → popup → Scan → panel → search → sort flow.

## Automated live gate

- [x] Harness leaves the default tab active and production Scan selects Whiskey Empire.
- [x] Browser-owned `Extensions.triggerAction` runs the real default action for the restaurant tab.
- [x] Production popup enables and acknowledges **Scan whiskey list** after action activation.
- [x] Scan reaches a complete state with 100 normalized live results; partial, unsupported, empty,
  failed, cancelled, and timed-out states are rejected.
- [x] A query derived from a live result produces a positive matching subset.
- [x] Price high-to-low exposes selected `price-desc` and descending `aria-sort`.
- [x] The unsupported/error path remains a nonzero result with stage-specific evidence.
- [x] Browser and temporary profile cleanup are reported after success and failure.

## MVP collection and search

- [ ] Popup enables Scan only on the exact target URL.
- [ ] Scan with Whiskey Empire active inserts one panel immediately above the unchanged source list.
- [ ] Progress updates once per page and reports pages, entries, and skipped candidates.
- [ ] First, middle, and final source-page entries appear in the combined results.
- [ ] Name, category, proof, region, brand/type, and notes text can each be found when present.
- [ ] Repeated Scan focuses the existing panel without duplicate requests or UI.
- [ ] Empty search, Reset, Original List, and Close have clear outcomes.

## Sorting and categories

- [ ] Name A–Z, price low–high, and price high–low match source spot checks.
- [ ] Equal prices use name order and multi-pour/range values remain last.
- [ ] Category choices match explicit source categories; no inferred category appears.
- [ ] Category, search, and sort compose and one Reset clears all criteria.

## Failure and recovery

- [ ] Inactive tab and wrong URL give guidance without broader permission.
- [ ] Unsupported fixture leaves original content intact and shows no fabricated rows.
- [ ] Failed middle page yields labeled partial results and a Rescan action.
- [ ] Cancel aborts collection; Rescan starts a fresh attempt; page/entry limits stop safely.
- [ ] Cyclic and duplicate pagination URLs are not requested twice.

## Accessibility

- [ ] All popup/panel controls are operable by keyboard with visible focus.
- [ ] Focus enters the panel heading and returns to source content on Close.
- [ ] A screen reader announces progress no more than once per page and announces terminal status.
- [ ] At 200% zoom controls reflow without two-dimensional scrolling.
- [ ] Reduced-motion preference removes optional smooth movement.

## Live selector notes

- Date/browser/version: 2026-06-21 / Playwright Chromium 149.0.7827.55
- Active tab selector: `.tab-anchor[data-tab-id]` with active Whiskey Empire text
- List root selector: `.tab-content` whose `.menu-title` is Whiskey Empire
- Entry/name/price selectors: `.menu-item`, `.item-name`, `.price`
- Pagination selector and URL behavior: same-origin links only; current live menu exposes all rows in one tab panel
- Variations or failures: renderer-synthetic keyboard events cannot invoke browser commands; the harness
  uses Chromium's browser-owned default-action operation, then a background production popup page only
  when the toolbar bubble is not exposed to Playwright.
