# Research: Enhanced Whiskey List Browsing

## TypeScript with a minimal build

**Decision**: Use TypeScript 5.x, esbuild for two browser entry points, and no runtime dependencies.

**Rationale**: Typed contracts reduce breakage across extraction, normalization, messaging, and UI
without introducing a runtime framework. The content script must be emitted as one browser-ready
file for programmatic injection, which makes a small bundler appropriate. esbuild is development-only.

**Alternatives considered**:

- Vanilla JavaScript: smallest toolchain, but weaker contract safety around partial source data and
  session state.
- Framework UI: rejected because the panel is small and native DOM APIs satisfy the requirements.
- TypeScript compiler alone: suitable for popup modules, but awkward for a multi-module content
  script injected as a file.

## Activation and permissions

**Decision**: Declare only `activeTab` and `scripting`; open a popup on toolbar activation and inject
the content bundle only when the visitor presses Scan. Declare no persistent host permissions,
background worker, `tabs`, static content scripts, or storage permission.

**Rationale**: Chrome documents that opening an extension popup invokes temporary `activeTab`
access and that `activeTab` plus `scripting` permits programmatic injection. Access ends when the tab
navigates away or closes. This exactly matches explicit activation and the constitution's
least-privilege rule.

**Alternatives considered**:

- Static content-script match for the Westside site: rejected because it runs without an explicit
  scan request and requires persistent host access.
- Exact persistent host permission: narrower than a domain wildcard but still unnecessary.
- Service worker: rejected because the popup can inject and message the tab directly.

**Primary references**:

- [Chrome activeTab permission](https://developer.chrome.com/docs/extensions/activeTab)
- [Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/scripting/)
- [Inject scripts into the active tab](https://developer.chrome.com/docs/extensions/get-started/tutorial/scripts-activetab)

## Same-origin pagination traversal

**Decision**: Run pagination traversal inside the injected content script. Discover URLs only from
the active Whiskey Empire list, resolve them against the current document, require the same origin
and expected drink-menu path, deduplicate canonical URLs, and fetch sequentially with a 20-page cap.
Parse returned HTML with `DOMParser` and pass each document to the same extraction adapter.

**Rationale**: Chrome states that content-script requests act on behalf of the page origin and are
subject to the normal same-origin policy. The required pages share the active page's origin, so the
design needs no persistent host permission or extension-origin network broker. Sequential traversal
limits load and makes progress deterministic.

**Alternatives considered**:

- Extension-origin fetch from a service worker or popup: rejected because it requires host
  permission and expands architecture.
- Driving the visible Next control: rejected because it disrupts the host page and is harder to
  recover from.
- Parallel requests: rejected for avoidable load and less predictable failure/progress behavior.

**Primary reference**:

- [Chrome cross-origin network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)

## Target-page extraction strategy

**Decision**: Isolate all live-page assumptions in one `TargetAdapter`. It locates the active
Whiskey Empire region using stable semantic signals first (tab state, headings, link/control text,
and repeated row structure), then narrowly scoped fallback selectors. It emits raw text only and
never normalizes. Representative HTML captured from the live page becomes test fixtures.

**Rationale**: The public server-rendered page shell does not expose the whiskey rows to a basic
crawler, so implementation must validate the interactive live DOM before freezing selectors. One
adapter confines markup churn. A failed confidence check produces `unsupported`, never guessed data.

**Alternatives considered**:

- Page-wide heuristic scraping: rejected because unrelated drink sections could be misclassified.
- Selectors distributed through UI/domain code: rejected because layout changes would have a wide
  blast radius.
- Automatic activation of the Whiskey Empire tab: rejected by the clarified scope.

## Normalization and price semantics

**Decision**: Accept a row only when it has a recognizable name and non-empty displayed price.
Preserve raw visible text, parse exactly one comparable dollar amount when unambiguous, and store
`sortablePriceCents: null` for ranges, multiple pour prices, or nonnumeric labels. Normalize category
and search text separately from display values. Deduplicate by normalized name + displayed price +
category + source identity.

**Rationale**: This provides deterministic inclusion and sorting without inventing a price. Raw text
retention keeps search comprehensive and makes parser issues diagnosable locally.

**Alternatives considered**:

- Choose the first or lowest amount from multi-price rows: rejected because it changes meaning.
- Require every optional field: rejected because it is brittle across categories and layouts.
- Raw-text-only entries: rejected because numeric sorting needs a stable parsed value.

## Injected panel and rendering

**Decision**: Insert one idempotent host element immediately before the active Whiskey Empire list,
attach an open Shadow DOM for style isolation, and render semantic native controls and a results
table/list within it. Preserve the source DOM unchanged below. Use event delegation and batch each
results update into one DOM replacement.

**Rationale**: The panel needs substantially more space than the popup for hundreds of entries.
Shadow DOM protects both the restaurant styles and extension styles; native elements minimize custom
accessibility behavior. A stable host ID prevents duplicate injection.

**Alternatives considered**:

- Popup results: rejected because it is too small and disappears when focus changes.
- Full-screen modal: rejected because the clarified design keeps original content directly reachable.
- New extension tab: rejected because it separates results from their source context.

## Session state and messaging

**Decision**: Keep the collection session solely in content-script memory. Define small typed
messages for `START_SCAN`, `GET_STATUS`, and `CANCEL_SCAN`. The overlay is the authoritative progress
surface; the popup mirrors status only while open. Reinjection returns the existing session instead
of starting a duplicate scan.

**Rationale**: Session storage is unnecessary because state naturally ends with the page. This avoids
a permission and stale-data cleanup while still allowing popup-to-tab control.

**Alternatives considered**:

- `chrome.storage.session`: deferred unless implementation proves popup reconnection cannot obtain
  status directly from the content script.
- Local storage: prohibited because data is not needed across sessions.
- Background-owned state: rejected because no background worker is needed.

## Testing strategy

**Decision**: Use Node's built-in test runner for pure domain tests and jsdom for extraction/rendering
fixtures. Capture at least two live pagination pages, one minor-layout variant, and one unsupported
page. Keep a manual checklist for popup activation, live scanning, permissions, network destinations,
keyboard use, 200% zoom, and failure recovery.

**Rationale**: Pure parser/selector tests are fast; fixtures make source markup changes reproducible;
manual validation covers Chrome integration and the live page without brittle end-to-end automation.

**Alternatives considered**:

- Browser-only manual testing: rejected because parser and extraction regressions need repeatability.
- Full browser automation in v1: deferred because the live third-party page can change independently
  and the small extension benefits more from fixture contracts first.
