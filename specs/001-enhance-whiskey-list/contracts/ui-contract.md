# Contract: Popup and Injected Panel UI

## Popup

The popup contains the extension name, target-page guidance, Scan/Focus Panel action, compact status,
and privacy statement. It does not display the whiskey results.

- On an unsupported URL: disable Scan and explain the required page.
- On the supported URL: Scan injects or focuses the panel and starts an idempotent session.
- While open: mirror aggregate progress from `SessionSnapshot`.
- Closing the popup does not cancel scanning.

## Injected panel

Exactly one panel host is inserted immediately before the active Whiskey Empire list. An open Shadow
DOM contains its styles and UI; the restaurant's original DOM remains unchanged below it.
Results retain semantic table markup and sort state while CSS presents each row as a menu item with
name/type, proof and distillery metadata, notes, a user-initiated Google Search action, and a dotted
price leader. Search actions open a new tab with `noopener noreferrer`.

Panel states:

| State | Required UI |
|-------|-------------|
| Validating/scanning | Heading, determinate counts when known, live status, Cancel, original-page link. |
| Ready | Search, optional searchable distillery combobox, sort control/columns, result count, Reset, Close, results. |
| Partial | Ready UI plus persistent warning and Rescan in the header navigation. |
| Empty search | Controls plus no-results message and Clear Search. |
| Unsupported/failed | Clear reason, Rescan when meaningful, Close, original-page link; no fabricated rows. |
| Cancelled | Cancellation status, collected-data policy, Rescan, Close. |

Error/action mapping:

| Outcome | Permitted actions |
|---------|-------------------|
| Wrong URL or Whiskey Empire activation failure | Guidance and Close |
| Unsupported structure or zero valid entries | Original Page and Close |
| Initial request/parse failure | Rescan, Original Page, and Close |
| Failed middle page or safety limit | Rescan, Original Page, and Close |
| Cancelled | Rescan, Original Page, and Close |

## Accessibility invariants

- All controls use native elements and accessible names.
- The panel heading receives programmatic focus after first injection; visible focus is never removed.
- Repeated activation focuses the existing panel heading. Progress, results, criteria, warning, and
  error updates never move focus automatically. Rescan focuses the panel heading when the new attempt
  begins; Close returns focus to the restaurant list heading or page body.
- Status changes use a polite live region; page-level progress is announced no more than once per page.
- Unknown-total progress states processed and discovered page counts; all progress states include
  accepted-entry and skipped-candidate counts and a final terminal status.
- Table headers communicate sortable state with text and `aria-sort` where column headers trigger sort.
- Category and sort controls expose their current values; Reset is one keyboard-reachable action.
- Text and control contrast meet WCAG 2.2 AA. The panel reflows at 200% zoom without two-dimensional
  scrolling for controls; result rows switch from table to stacked semantic groups when necessary.
- Motion is not required. Any optional transition is disabled under reduced-motion preference.
- Close removes only the extension host and returns focus to the restaurant list heading or the page
  body; it never removes or hides source content.

## Rendering invariants

- Rendering consumes `WhiskeyEntry[]` and `ViewCriteria`; it never queries source rows.
- One user action causes at most one batched results replacement.
- Text is inserted with text-content APIs, never interpreted as HTML.
- Repeated injection focuses the existing panel rather than creating a duplicate.
