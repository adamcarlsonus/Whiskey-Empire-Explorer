# Implementation Plan: Enhanced Whiskey List Browsing

**Branch**: `001-enhance-whiskey-list` | **Date**: 2026-06-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-enhance-whiskey-list/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a Chrome Manifest V3 extension that the visitor opens from a toolbar popup after selecting
the Whiskey Empire tab. The popup programmatically injects a TypeScript-built content script under
temporary `activeTab` access. That script discovers validated pagination exposed by the list, fetches pages
sequentially, extracts raw rows, normalizes entries, and renders an accessible inline panel
above the untouched source list. Search, category filtering, and sorting operate entirely on the
in-memory normalized collection. There is no backend, telemetry, account, persistent storage,
service worker, static content-script match, or persistent host permission.

## Technical Context

**Language/Version**: TypeScript 5.x targeting modern Chrome-supported ECMAScript

**Primary Dependencies**: Chrome Manifest V3 browser APIs; no runtime packages. Development-only:
TypeScript, esbuild, Chrome type declarations, and jsdom for DOM fixture tests.

**Storage**: In-memory `CollectionSession` owned by the injected content script; no
`chrome.storage` in v1.

**Testing**: Node built-in test runner for parser/sort/normalization tests; jsdom fixture tests for
extraction and rendering contracts; manual unpacked-extension validation on the live restaurant page.

**Target Platform**: Current stable desktop Google Chrome with Manifest V3 support

**Project Type**: Single browser-extension project

**Performance Goals**: Search, filter, and sort updates complete within 200 ms for 2,000 entries;
one progress update per processed page; one bounded scan of at most 20 pages or 2,000 accepted
entries; no duplicate panel or results update.

**Constraints**: Local-only processing; no analytics or remote code; pagination limited to the
restaurant page and its validated Untappd source-provider items path;
sequential page requests; no persistent host or background permission; original page remains usable;
valid rows require a name and displayed price; page markup may change.

**Scale/Scope**: One target drink-menu URL, one visitor role, up to 20 pages and 2,000 normalized
entries per activation, one injected panel per tab.

**Local Data Flow**: Active Whiskey Empire DOM -> scoped extractor -> `RawWhiskeyRecord[]`;
discovered validated page URL -> sequential credential-free `fetch` -> `DOMParser` -> scoped extractor;
raw records -> normalizer/price parser -> `WhiskeyEntry[]`; view criteria + entries -> pure selector ->
injected renderer. Session data is discarded on navigation, tab close, or panel teardown.

**Permissions/Host Access**: Manifest `permissions` contains only `activeTab` and `scripting`.
Opening the popup grants temporary active-tab access; the Scan button injects the bundled script and
styles. The manifest declares no `host_permissions`, `optional_host_permissions`, background worker,
or static `content_scripts`. The injected script validates the exact target URL before reading DOM or
following validated pagination exposed by the active list.

**Accessibility**: Semantic search, filter, sort, progress, status, table/list, retry, reset, and
close controls; complete keyboard operation; visible focus; live-region status without excessive
announcements; sufficient contrast; reflow at 200% zoom; no required animation; focus moves to the
panel heading on activation and returns predictably on close.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Pre-design | Post-design evidence |
|------|------------|----------------------|
| Privacy/local-only | PASS | No backend, telemetry, or persistent data; only validated source-menu pagination requests are made, without credentials or collected content. |
| Least privilege | PASS | Only `activeTab` and `scripting`; no persistent host, background, `tabs`, or storage permission. |
| Accessible enhancement | PASS | Inline panel contract preserves source DOM and defines keyboard, focus, semantics, reflow, and live status. |
| Performance | PASS | Sequential 20-page bound, idempotent injection, scoped extraction, batched render, and 200 ms interaction target. |
| Processing boundaries | PASS | Separate contracts for raw extraction, normalization/price parsing, selection, and rendering. |
| Maintainability | PASS | TypeScript and browser-native APIs with zero runtime dependencies; small development toolchain only. |

The pre-design and post-design evaluations both pass. No constitutional exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-enhance-whiskey-list/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── extension-messages.md
│   ├── extraction-contract.md
│   └── ui-contract.md
└── tasks.md                 # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)

```text
manifest.json
package.json
tsconfig.json
scripts/
└── build.mjs
src/
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.ts
├── content/
│   ├── bootstrap.ts
│   ├── scanner.ts
│   ├── pagination.ts
│   └── target-adapter.ts
├── domain/
│   ├── types.ts
│   ├── normalize.ts
│   ├── price-parser.ts
│   └── select-entries.ts
├── ui/
│   ├── panel.ts
│   ├── render.ts
│   └── panel.css
└── shared/
    ├── messages.ts
    └── target.ts
tests/
├── fixtures/
│   ├── whiskey-page-1.html
│   ├── whiskey-page-2.html
│   ├── whiskey-layout-variant.html
│   └── unsupported-page.html
├── unit/
│   ├── price-parser.test.ts
│   ├── normalize.test.ts
│   └── select-entries.test.ts
├── dom/
│   ├── extraction.test.ts
│   └── rendering.test.ts
└── manual/
    └── live-page-checklist.md
dist/                           # Generated unpacked extension; ignored by source control
```

**Structure Decision**: Use one small TypeScript project with entry points for the popup and the
programmatically injected content script. Domain modules have no DOM or Chrome dependencies.
`target-adapter.ts` owns all Westside-specific selectors and pagination interpretation; the UI owns
no scraping rules. esbuild emits browser-ready files into `dist/`, while Node tests compile or load
the same pure modules and jsdom fixtures.

## Complexity Tracking

No Constitution Check violations require justification.
