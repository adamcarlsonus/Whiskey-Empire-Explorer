# Research: Live Extension End-to-End Testing

## Managed extension-capable browser

- **Decision**: Replace `playwright-core` plus an installed Chrome executable with the lockfile-pinned
  `playwright` package and its managed Chromium channel, launched through a persistent context.
- **Rationale**: Playwright's extension guidance requires a persistent Chromium context and states
  that branded Chrome and Edge removed the command-line flags needed to side-load extensions. The
  managed runtime is reproducible and matches the clarified authoritative-browser requirement.
- **Alternatives considered**: Installed stable Chrome is rejected because side-loading behavior is
  no longer reliable. Chrome for Testing with a separately managed binary adds lifecycle work without
  improving this single-platform scope. Reusing a personal profile violates isolation.
- **Source**: <https://playwright.dev/docs/chrome-extensions>

## Real `activeTab` activation

- **Decision**: Focus the live page and use Chromium's browser-level `Extensions.triggerAction` with
  the production extension ID and active tab target ID; require an observable extension popup target
  before proceeding.
- **Rationale**: Chrome documents both executing an action and executing a Commands API keyboard
  shortcut as gestures that enable `activeTab`. This exercises the production permission path while
  avoiding test-only host access.
- **Alternatives considered**: Playwright-generated `Command+Shift+Y` events remain renderer input and
  did not reach Chromium's command dispatcher in the live run. Directly navigating to
  `chrome-extension://.../popup.html` does not prove action activation or temporary access. macOS
  toolbar automation requires Accessibility permission. Internal module calls bypass the product boundary.
- **Sources**: <https://developer.chrome.com/docs/extensions/activeTab>,
  <https://developer.chrome.com/docs/extensions/reference/commands>,
  <https://chromedevtools.github.io/devtools-protocol/tot/Extensions/#method-triggerAction>

## Extension acceptance and identity

- **Decision**: Before visiting the restaurant page, open `chrome://extensions/` and inspect its open
  management-page shadow DOM for an enabled `extensions-item` whose name and version match the built
  manifest. Record that item's browser-assigned ID and compare the source and built manifest permission
  surfaces. Failure to inspect the manager or find exactly one match fails `extension-availability`.
- **Rationale**: This extension intentionally has no service worker, so waiting for a service-worker
  target cannot prove installation. Browser-owned extension state distinguishes installation failure
  from later action/popup failure.
- **Alternatives considered**: Treating a successful browser launch as installation proof caused the
  current silent false signal. Adding a service worker solely for tests violates the production design.
  Deriving an ID from a filesystem path does not prove that Chromium accepted the extension.

## Popup and injected-panel observation

- **Decision**: Discover the popup only after the shortcut through the browser context's page-target
  event/list, then click `#scan`. Observe the panel host on the restaurant page and its open shadow
  root for terminal state, results, search, and sorting.
- **Rationale**: Playwright reports popup pages as pages in their browser context. The production
  panel deliberately uses an open shadow root, allowing tests to assert rendered output without test
  hooks or imported internals.
- **Alternatives considered**: Calling `chrome.scripting` from the harness or invoking message
  handlers directly skips the action and popup. Treating any terminal message as success allowed
  unsupported and empty scans to pass.
- **Source**: <https://playwright.dev/docs/api/class-browsercontext#browser-context-event-page>

## Live assertions that tolerate changing inventory

- **Decision**: Require status matching a successful complete state, parse a positive total from the
  accessible count, derive a search token from the first rendered whiskey name, assert a nonzero
  matching subset, select price high-to-low, and verify both option state and descending `aria-sort`.
- **Rationale**: The assertions prove the feature while avoiding fixed names, prices, counts, or page
  numbers that normal restaurant updates would invalidate.
- **Alternatives considered**: Snapshotting the current inventory is brittle and would persist page
  content. Merely checking panel attachment does not prove scanning, normalization, or controls.

## Diagnostics, retention, and privacy

- **Decision**: Always write a timestamped JSON report to `test-results/live-extension/`; keep the
  most recent 10 reports and delete older ones. Store statuses, counts, origins, selected control
  metadata, and bounded errors, but no cookies, request/response bodies, headers, complete HTML,
  traces, or whiskey-row payloads.
- **Rationale**: Timestamped reports support repeatability and comparisons. A ten-run cap is enough
  for diagnosis while preventing indefinite local accumulation. Structured bounded evidence is safer
  and easier to review than browser traces.
- **Alternatives considered**: Overwriting one file loses consecutive-run evidence. Unlimited traces
  retain excessive page and network data. Remote artifact hosting violates the constitution.

## Network provenance boundary

- **Decision**: Label requests initiated directly by the runner separately from requests initiated by
  the loaded restaurant document or its descendant frames. Direct runner requests may target only the
  exact restaurant URL or origin. Record bounded origins for document-initiated subresources and fail
  if the runner initiates any other runtime destination. Launch Chromium with background-networking
  suppression suitable for extension testing, without intercepting or rewriting restaurant traffic.
- **Rationale**: The live page legitimately loads CDN and embedded resources from other origins, so a
  simple origin allowlist would misclassify normal page behavior. Provenance enforces that the harness
  itself adds no analytics, logging, or upload while leaving the production page unmodified.
- **Alternatives considered**: Allowing any observed destination cannot prove SC-008. Blocking all
  cross-origin subresources would change the live page and invalidate the production-path test.

## Timeout and cleanup model

- **Decision**: Model the run as named stages with individual deadlines, a 115-second work deadline,
  and a five-second cleanup reserve inside a 120-second hard limit. Handle normal completion, thrown
  errors, `SIGINT`, and `SIGTERM` through one idempotent cleanup path.
- **Rationale**: A global timer alone identifies neither the failed boundary nor the last successful
  stage. Reserved cleanup time prevents timeout handling from leaving Chromium or its profile behind.
- **Alternatives considered**: Unbounded Playwright defaults recreate the original hanging behavior.
  Per-stage timers without a global cap can exceed the success criterion.

## Dependency and command boundary

- **Decision**: Keep the live command separate from `test` and `validate`. The command builds first,
  checks the managed browser and live network prerequisites, and exits nonzero as `failed` or
  `blocked`; browser installation remains an explicit setup command.
- **Rationale**: Deterministic checks must work offline. Explicit browser installation avoids a test
  unexpectedly downloading a large binary and lets prerequisite failures remain intelligible.
- **Alternatives considered**: Auto-installing Chromium during every test hides setup mutation and
  complicates diagnosis. Adding the live run to `validate` makes normal development network-dependent.
