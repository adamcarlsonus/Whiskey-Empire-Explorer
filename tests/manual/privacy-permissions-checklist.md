# Privacy and Permissions Validation

**Static audit date**: 2026-06-21  
**Live network audit**: PASSED in isolated Playwright Chromium.

- [x] Built manifest contains only `activeTab` and `scripting` permissions.
- [x] Built manifest contains no host, optional host, background, storage, or static content-script declaration.
- [x] Package contains only local code, styles, markup, and icons/assets.
- [x] Harness request provenance records direct requests only to the restaurant origin; document-owned
  CDN, Untappd, and site analytics subresources remain separately attributable to the host page.
- [x] Harness requests and local reports contain no search query text, filter values, whiskey rows,
  credentials, cookies, headers, interaction history, or externally uploaded extension identifiers.
- [x] Popup messages contain aggregate counts/status only, never full entries or queries.
- [x] Closing the panel, navigating away, or closing the tab leaves no stored extension data.
- [x] Source contains no analytics, telemetry, remote logging, advertising, or remote-code path.

## Static evidence

- `dist/manifest.json` declares only `activeTab`, `scripting`, and the popup action.
- `dist/` contains five local files: manifest, content bundle, popup markup, popup styles, and popup bundle.
- `src/shared/messages.ts` limits popup snapshots to aggregate counts, warning, and public error state.
- `src/shared/target.ts` and `src/content/pagination.ts` reject non-HTTPS, cross-origin, and wrong-path URLs.
- Searches across source and built manifest find no extension storage, background worker, persistent
  content script, host permission, analytics, telemetry, remote asset, or third-party endpoint.
- Chromium launches with background-network suppression and an isolated temporary profile.
- The live report records zero unexpected harness requests and remains local under `test-results/`.
- The production package retains no analytics, telemetry, remote logging, storage, or background path.
