# Live E2E harness support

These development-only modules keep the real-browser scenario diagnosable without adding hooks to
the production extension:

- `config.mjs`: target, paths, deadlines, and evidence bounds.
- `stages.mjs`: ordered state transitions and bounded deadlines.
- `report.mjs`: sanitized report creation, persistence, and retention.
- `diagnostics.mjs`: bounded page, frame, request, popup, and panel evidence.
- `browser.mjs`: production package identity and isolated Chromium lifecycle.
- `prerequisites.mjs`: local platform, build, browser, command, and network checks.
- `live-flow.mjs`: live page, Whiskey tab, action popup, scan, search, and sort assertions.
- `failure-fixtures.mjs`: deterministic failure classifications; never imported by production code.

Files ending in `.test.mjs` run offline through `npm run test:harness`. The real network/browser flow
runs only through `npm run test:e2e:live`.
