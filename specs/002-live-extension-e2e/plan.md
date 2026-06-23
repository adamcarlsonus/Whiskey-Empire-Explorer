# Implementation Plan: Live Extension End-to-End Testing

**Branch**: `002-live-extension-e2e` | **Date**: 2026-06-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-live-extension-e2e/spec.md`

## Summary

Replace the existing best-effort live script with a macOS Playwright runner that builds and loads
the unchanged `dist/` extension into Playwright-managed Chromium, verifies installation in browser
state, opens the live Westside page, selects Whiskey Empire, invokes the browser-owned extension
default action for that tab, clicks the production popup Scan control, and asserts successful panel results,
search, and sorting. A staged state machine enforces local deadlines, a 120-second global budget,
cleanup, and a sanitized JSON report on every outcome.

## Technical Context

**Language/Version**: Existing TypeScript 5.8 production code; Node.js 22-compatible ECMAScript
modules for the live runner

**Primary Dependencies**: Existing Chrome Manifest V3 APIs and esbuild; development-only
`playwright` package pinned through the lockfile for its managed Chromium runtime; Node built-ins for
filesystem, assertions, hashing, temporary directories, and signals

**Storage**: No extension storage. Per-run diagnostic JSON under `test-results/live-extension/` and
a temporary Chromium profile under the operating-system temporary directory, deleted on cleanup

**Testing**: Existing Node test runner and jsdom suite remain deterministic; one explicit
`npm run test:e2e:live` command performs the network-dependent production-path check

**Target Platform**: macOS developer desktop with Playwright-managed Chromium; branded Google
Chrome is neither required nor authoritative

**Project Type**: Single Manifest V3 browser extension with a development-only live E2E harness

**Performance Goals**: Runner reserves cleanup time and always exits within 120 seconds; each stage
has a shorter deadline; diagnostic summaries are bounded to 50 relevant elements, 20 errors, and
20 frame origins; no tracing or unbounded HTML capture

**Constraints**: Real public page and production bundle only; headed browser permitted; no backend,
test-only manifest permissions, direct popup navigation as activation, macOS Accessibility control,
personal browser profile, remote artifact upload, or success on partial/unsupported/empty results

**Scale/Scope**: One target origin and URL, one extension package, one macOS browser runtime, one
serial live scenario, at most one report directory per invocation

**Local Data Flow**: Live restaurant resources, including visible Untappd pagination responses -> production scraper -> production normalizer ->
production shadow-DOM renderer; Playwright observes browser UI/page state -> bounded sanitizer ->
local JSON report. No whiskey record payload is persisted; reports retain counts, selected labels,
status text, sort state, request provenance/origins, and errors only.

**Permissions/Host Access**: Production manifest remains exactly `activeTab` plus `scripting`, with
no host permissions. The injected script follows only validated HTTPS pagination links exposed by the active Whiskey Empire list; the current source provider is `business.untappd.com`, fetched under normal page-origin/CORS rules without credentials. Chromium's browser-owned default-action operation targets the active restaurant
tab and supplies the action activation path. Direct harness navigation or prerequisite requests are restricted to the exact
restaurant URL or origin. Cross-origin page subresources are permitted only when initiated by the
loaded restaurant document or descendant frames, and are recorded separately from harness-initiated
requests. Build and browser installation are setup-time developer operations.

**Accessibility**: The runner locates the Whiskey Empire control and popup Scan button by accessible
role/name where possible, verifies the panel heading/status/count, performs search through its labeled
input, and verifies the selected sort option plus `aria-sort`. It does not hide or modify host content.

## Constitution Check

*GATE: Passed before research and re-checked after Phase 1 design.*

| Gate | Pre-design | Post-design evidence |
|------|------------|----------------------|
| Privacy/local-only | PASS | Direct harness requests are limited to the restaurant origin; the extension follows only validated source-menu pagination links and sends no collected content; document requests are provenance-recorded; bounded reports remain local and omit whiskey rows, cookies, headers, and page HTML. |
| Least privilege | PASS | The production manifest is unchanged and compared against the built package; no test permission, service worker, or host match is introduced. |
| Accessible enhancement | PASS | The live flow uses accessible names and asserts labeled search, visible status/count, selected sort state, and `aria-sort`; the source page remains intact. |
| Performance | PASS | Stage deadlines, a 120-second hard stop, bounded evidence, serial execution, and guaranteed cleanup prevent hangs and unbounded capture. |
| Processing boundaries | PASS | The harness treats production scraping, normalization, and rendering as black-box boundaries and observes their public DOM results without importing internals. |
| Maintainability | PASS | A small Node ESM runner uses Playwright and browser-native behavior; support modules separate stages, reporting, and diagnostics. |

The pre-design and post-design evaluations pass. No constitutional exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/002-live-extension-e2e/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── live-test-command.md
│   └── diagnostic-report.schema.json
└── tasks.md                 # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)

```text
manifest.json
package.json
scripts/
└── build.mjs
src/                         # Existing production extension; no E2E-only hooks
tests/
├── e2e/
│   ├── live-extension.mjs   # Top-level staged scenario and exit handling
│   └── support/
│       ├── browser.mjs      # Managed Chromium/profile/extension lifecycle
│       ├── config.mjs       # Target, deadlines, evidence bounds, local paths
│       ├── diagnostics.mjs  # Bounded page, frame, popup, and panel evidence
│       ├── failure-fixtures.mjs # Harness-only seeded failure controls
│       ├── live-flow.mjs    # Live page, action, popup, scan, search, sort
│       ├── prerequisites.mjs # Environment and browser capability checks
│       ├── report.mjs       # Report model, sanitization, persistence
│       ├── stages.mjs       # Deadlines, transitions, and failure classification
│       └── *.test.mjs       # Offline harness contract tests
└── manual/
    └── live-page-checklist.md
test-results/
└── live-extension/          # Ignored timestamped local reports
```

**Structure Decision**: Keep the production extension and deterministic tests in their current
single-project layout. Refactor only the development live harness into narrow ESM support modules.
The runner never imports production scraper, normalizer, or renderer modules; it proves their wired
behavior solely through the installed popup and injected panel.

## Complexity Tracking

No Constitution Check violations require justification.
