---

description: "Implementation tasks for Enhanced Whiskey List Browsing"
---

# Tasks: Enhanced Whiskey List Browsing

**Input**: Design documents from `/specs/001-enhance-whiskey-list/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and
`quickstart.md`

**Tests**: Required by the feature plan and constitution for price parsing, sorting, normalization,
DOM extraction fixtures, rendering/accessibility, performance, and failure behavior. Within each
story, write the listed tests first and confirm they fail for the missing behavior before implementation.

**Organization**: Shared setup and foundation precede phases organized by user story. Requested work
areas—extension shell, page scraping, pagination, normalization, overlay UI, search/sort/filter,
errors, tests, and manual validation—are explicit subsections within those phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it uses different files and has no dependency on an incomplete task.
- **[Story]**: Maps a task to US1, US2, US3, or US4 from `spec.md`.
- Every task names the exact file or files it creates or changes.

## Phase 1: Setup

**Purpose**: Initialize the TypeScript Manifest V3 project and buildable extension shell.

- [X] T001 Create npm scripts and pin development-only TypeScript, esbuild, Chrome types, and jsdom dependencies in `package.json`
- [X] T002 [P] Configure strict browser and test TypeScript compilation in `tsconfig.json`
- [X] T003 Create deterministic popup/content entry-point builds and static asset copying in `scripts/build.mjs`
- [X] T004 [P] Create the Manifest V3 declaration with only `activeTab` and `scripting`, a popup action, and no host/background/storage permissions in `manifest.json`
- [X] T005 [P] Create the popup document and base styles with target guidance, Scan action, status region, and privacy copy in `src/popup/popup.html` and `src/popup/popup.css`
- [X] T006 [P] Exclude generated bundles, dependencies, coverage, and temporary fixture captures in `.gitignore`

**Checkpoint**: `npm install`, type checking, and a production build can produce a loadable `dist/` shell.

---

## Phase 2: Foundational Extension Shell and Contracts

**Purpose**: Establish shared contracts, target boundaries, fixtures, and test infrastructure that
block all user-story work.

**⚠️ CRITICAL**: No user-story implementation begins until this phase is complete.

### Shared data and messaging

- [X] T007 Define `RawWhiskeyRecord`, `WhiskeyEntry`, `SourcePage`, `CollectionSession`, `ViewCriteria`, warning, error, and status types from `data-model.md` in `src/domain/types.ts`
- [X] T008 [P] Define typed `START_SCAN`, `GET_STATUS`, `CANCEL_SCAN`, `SessionSnapshot`, and response unions from the messaging contract in `src/shared/messages.ts`
- [X] T009 [P] Define the exact supported URL, origin/path guards, canonicalization helpers, and 20-page/1,000-entry limits in `src/shared/target.ts`

### Fixtures and test harness

- [ ] T010 [P] Capture and sanitize representative active Whiskey Empire markup for first-page, later-page, layout-variant, and unsupported fixtures in `tests/fixtures/whiskey-page-1.html`, `tests/fixtures/whiskey-page-2.html`, `tests/fixtures/whiskey-layout-variant.html`, and `tests/fixtures/unsupported-page.html`
- [X] T011 [P] Create jsdom fixture loading, DOM cleanup, fake fetch, and accessibility-query helpers in `tests/helpers/dom.ts`
- [X] T012 Add build, typecheck, and empty-suite smoke validation for source and test entry points in `tests/unit/toolchain.test.ts`

**Checkpoint**: Shared types match the design contracts, target rules are centralized, and fixtures are reproducible.

---

## Phase 3: User Story 1 — Search the Complete List (Priority: P1) 🎯 MVP

**Goal**: From the popup, collect the complete supported pagination set into an accessible inline
panel and provide full-text search across every normalized entry.

**Independent Test**: With a multi-page fixture containing unique terms on different pages, start one
scan, observe page-by-page progress, search name and optional visible fields, receive complete and
no-results states, and retain the untouched source list below one injected panel.

### Tests for User Story 1 — write first and confirm failure

- [X] T013 [P] [US1] Add fixture contract tests for active-list recognition, required fields, optional visible text, skipped candidates, and unsupported markup in `tests/dom/extraction.test.ts`
- [X] T014 [P] [US1] Add pagination tests for discovery, canonicalization, same-origin/path rejection, duplicates, cycles, sequential progress, and the 20-page boundary in `tests/unit/pagination.test.ts`
- [X] T015 [P] [US1] Add normalization tests for whitespace, case-folded search text, optional fields, deterministic identity, and duplicate handling in `tests/unit/normalize.test.ts`
- [X] T016 [P] [US1] Add pure selection tests for case-insensitive all-visible-text search, source order, result counts, input immutability, and no-results behavior in `tests/unit/select-entries.test.ts`
- [X] T017 [P] [US1] Add integration tests for popup messages, idempotent injection, multi-page progress, panel placement, source preservation, live status, reset, and close focus in `tests/dom/full-scan-search.test.ts`

### Page scraping

- [X] T018 [US1] Implement active Whiskey Empire root detection, scoped row extraction, optional-field capture, skip counts, source references, and pagination discovery in `src/content/target-adapter.ts`

### Pagination traversal

- [X] T019 [P] [US1] Implement canonical URL queueing, same-origin/path guards, sequential fetch with `DOMParser`, deduplication, abort support, and safety limits in `src/content/pagination.ts`

### Data normalization and search

- [X] T020 [P] [US1] Implement DOM-free record validation, display-value preservation, search corpus construction, source normalization, and deduplication in `src/domain/normalize.ts`
- [X] T021 [P] [US1] Implement pure query filtering, source-order selection, result counts, and reset criteria in `src/domain/select-entries.ts`

### Overlay UI

- [X] T022 [P] [US1] Implement one idempotent inline Shadow DOM panel host above the active list with semantic heading, status, progress, controls, results region, original-page link, cancel, reset, and close in `src/ui/panel.ts`
- [X] T023 [US1] Implement batched safe-text result presentation, query events, no-results state, counts, progress announcements, source preservation, and focus management in `src/ui/render.ts` and `src/ui/panel.css`

### Extension shell and scan orchestration

- [X] T024 [US1] Implement the in-memory scan pipeline from active DOM through page traversal, normalization, progress snapshots, and ready state in `src/content/scanner.ts`
- [X] T025 [P] [US1] Implement popup URL gating, content/style injection, typed scan/status messaging, compact progress, existing-panel focus, and privacy guidance in `src/popup/popup.ts`
- [X] T026 [US1] Implement the global idempotency guard, typed message listener, one-session lifecycle, panel integration, and teardown in `src/content/bootstrap.ts`

### Manual MVP validation

- [ ] T027 [US1] Execute the P1 live flow and record popup activation, first/middle/final-page spot checks, search coverage, duplicate-injection protection, source preservation, and observed selector notes in `tests/manual/live-page-checklist.md`

**Checkpoint**: US1 independently delivers complete-list collection and search without requiring US2,
US3, or US4 enhancements.

---

## Phase 4: User Story 2 — Sort Whiskeys (Priority: P2)

**Goal**: Sort all collected entries alphabetically or by comparable price while retaining entries
with non-comparable displayed prices.

**Independent Test**: With mixed whole-dollar, decimal, range, multi-pour, and nonnumeric price labels,
each sort order is stable and correct; non-comparable prices remain last and visibly identified.

### Tests for User Story 2 — write first and confirm failure

- [X] T028 [P] [US2] Add parser tests for whole-dollar, decimal, currency-symbol, comma, range, multi-pour, blank, and unrelated-number price labels in `tests/unit/price-parser.test.ts`
- [X] T029 [P] [US2] Add stable name/price ascending/price descending, tie-breaking, null-last, immutability, and `aria-sort` presentation tests in `tests/unit/sort-entries.test.ts` and `tests/dom/sort-controls.test.ts`

### Price parsing and sort behavior

- [X] T030 [US2] Implement unambiguous dollar-to-cents parsing with preserved display text and null for ranges or multiple prices in `src/domain/price-parser.ts`
- [X] T031 [US2] Extend pure entry selection with stable `name-asc`, `price-asc`, and `price-desc` ordering and deterministic tie breakers in `src/domain/select-entries.ts`
- [X] T032 [US2] Add keyboard-operable sort controls or sortable headers, visible sort state, `aria-sort`, and non-comparable-price labeling in `src/ui/panel.ts` and `src/ui/render.ts`

### Manual sorting validation

- [ ] T033 [US2] Record live-page spot checks for ascending/descending prices, alphabetical order, ties, multiple-pour labels, and non-comparable-price placement in `tests/manual/live-page-checklist.md`

**Checkpoint**: US2 sorting works against a pre-collected fixture independently of category filtering
and recovery enhancements.

---

## Phase 5: User Story 3 — Filter by Available Category (Priority: P3)

**Goal**: Offer a category filter only when reliable source categories exist and compose it with
search, sorting, counts, and reset.

**Independent Test**: With categorized fixtures, category choices are normalized and distinct,
filtering composes with query and sort, and reset clears all criteria; without categories, no category
control is present.

### Tests for User Story 3 — write first and confirm failure

- [X] T034 [P] [US3] Add normalization tests for category whitespace/case variants, absent categories, and distinct display values in `tests/unit/category-normalize.test.ts`
- [X] T035 [P] [US3] Add pure selection tests for category-only, category-plus-query, category-plus-sort, counts, and one-step reset in `tests/unit/category-filter.test.ts`
- [X] T036 [P] [US3] Add DOM tests for conditional category-control presence, accessible naming, active state, keyboard use, and persistence across query/sort changes in `tests/dom/category-controls.test.ts`

### Category normalization and filtering

- [X] T037 [US3] Extend record normalization to preserve display categories and produce stable normalized category keys in `src/domain/normalize.ts`
- [X] T038 [US3] Extend pure selection to apply category before query and stable sort without mutating entries or criteria in `src/domain/select-entries.ts`
- [X] T039 [US3] Add conditional category options, active-filter status, composed updates, and reset integration in `src/ui/panel.ts` and `src/ui/render.ts`

**Checkpoint**: US3 filtering works with the US1 collection and remains absent when the source provides
no reliable category.

---

## Phase 6: User Story 4 — Recover from Unsupported Content (Priority: P4)

**Goal**: Fail safely and clearly for wrong-page, inactive-tab, changed-markup, request, partial,
empty, cancellation, and safety-limit outcomes while preserving the restaurant page.

**Independent Test**: Unsupported and partially failing fixtures produce the specified error or
warning, offer only meaningful recovery actions, retain valid partial entries when allowed, and never
alter the original page.

### Tests for User Story 4 — write first and confirm failure

- [X] T040 [P] [US4] Add adapter tests for wrong target, inactive Whiskey Empire tab, changed selectors, missing required fields, no valid entries, and safe source preservation in `tests/dom/unsupported-page.test.ts`
- [X] T041 [P] [US4] Add scanner tests for request denial, parse failure, failed middle page, partial results, retry, cancellation, rate limiting, cyclic pagination, and page-limit warnings in `tests/unit/scanner-errors.test.ts`
- [X] T042 [P] [US4] Add popup/panel tests for public error mapping, warning persistence, meaningful Retry/Close/original-page actions, focus handling, and absence of fabricated rows in `tests/dom/error-states.test.ts`

### Error modeling and recovery

- [X] T043 [P] [US4] Implement target validation and structured `WRONG_URL`, `TAB_NOT_ACTIVE`, `UNSUPPORTED_STRUCTURE`, and `NO_VALID_ENTRIES` outcomes in `src/content/target-adapter.ts`
- [X] T044 [US4] Implement abortable request failures, terminal/partial session transitions, skipped-candidate and page-limit warnings, and retry attempt creation in `src/content/scanner.ts`
- [X] T045 [US4] Implement cancellation, duplicate-start handling, snapshot-safe retry, and stale-session teardown in `src/content/bootstrap.ts`
- [X] T046 [P] [US4] Implement accessible unsupported, failed, partial, cancelled, and warning panel states with safe action availability in `src/ui/panel.ts` and `src/ui/render.ts`
- [X] T047 [P] [US4] Implement unsupported URL, injection denial, missing content script, and aggregate scan error/status copy in `src/popup/popup.ts`

### Manual failure validation

- [ ] T048 [US4] Record unsupported fixture, inactive-tab, wrong-URL, failed-middle-page, retry, cancellation, repeated activation, cyclic/page-limit, and original-page preservation results in `tests/manual/live-page-checklist.md`

**Checkpoint**: All four stories are independently testable, and every failure path preserves source
content and local-only state.

---

## Phase 7: Polish, Tests, and Manual Release Validation

**Purpose**: Enforce cross-cutting constitution gates and finish release-facing validation.

- [X] T049 Add a 1,000-entry interaction benchmark with a 200 ms search/filter/sort budget and bounded one-replacement rendering assertions in `tests/unit/performance.test.ts`
- [X] T050 [P] Add cross-state keyboard, focus, semantic status, `aria-sort`, 200% reflow, and reduced-motion assertions in `tests/dom/accessibility.test.ts`
- [X] T051 [P] Audit allowed page-request destinations, message payloads, storage absence, telemetry absence, and in-memory teardown; document evidence in `tests/manual/privacy-permissions-checklist.md`
- [ ] T052 Refresh sanitized live first/middle/final-page and minor-layout fixtures after selector implementation in `tests/fixtures/whiskey-page-1.html`, `tests/fixtures/whiskey-page-2.html`, and `tests/fixtures/whiskey-layout-variant.html`
- [ ] T053 Execute every primary, alternate, exception, recovery, privacy, accessibility, and performance scenario from `quickstart.md` and record dated results in `tests/manual/live-page-checklist.md`
- [X] T054 Run and reconcile build, typecheck, and automated-test commands against documented expectations in `specs/001-enhance-whiskey-list/quickstart.md`
- [X] T055 Inspect the built package for only local assets, `activeTab` and `scripting` permissions, no host/background/storage declarations, and no duplicate or unused bundles; record findings in `tests/manual/privacy-permissions-checklist.md`
- [X] T056 Document installation, activation, privacy guarantees, supported page, commands, and known safe-failure behavior in `README.md`

**Final Checkpoint**: Automated tests pass, manual live validation is recorded, privacy and permission
audits are clean, accessibility criteria are met, and the unpacked `dist/` package follows the plan.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies.
- **Phase 2 — Foundation**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 — US1**: Depends on Phase 2 and is the MVP.
- **Phase 4 — US2**: Depends on normalized entries and the panel contract from US1.
- **Phase 5 — US3**: Depends on normalized entries and the panel contract from US1; it does not depend
  on US2 except when validating filter/sort composition.
- **Phase 6 — US4**: Depends on the US1 scan and panel lifecycle; it can proceed in parallel with most
  US2/US3 work after US1 is stable.
- **Phase 7 — Polish**: Depends on all selected user stories.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 (MVP)
                           ├──> US2 ──┐
                           ├──> US3 ──┼──> Polish/Release Validation
                           └──> US4 ──┘
```

### Within Each User Story

1. Write the story's tests and confirm failure for missing behavior.
2. Implement pure data/domain behavior before consumers.
3. Implement extraction/scanner or UI behavior against typed contracts.
4. Integrate the popup, content script, and panel as required by the story.
5. Pass automated tests and record the story's independent manual validation.

## Parallel Opportunities

### Setup and Foundation

- T002, T004, T005, and T006 can proceed in parallel after T001 establishes package metadata.
- T008, T009, T010, and T011 can proceed in parallel after the repository shell exists.

### User Story 1

```text
Parallel test batch: T013, T014, T015, T016, T017
Parallel implementation after contracts: T019, T020, T021, T022, T025
Join points: T018 + T019 + T020 -> T024; T021 + T022 -> T023; T023 + T024 + T025 -> T026
```

### User Story 2

```text
Parallel test batch: T028, T029
Implementation order: T030 -> T031 -> T032 -> T033
```

### User Story 3

```text
Parallel test batch: T034, T035, T036
Implementation order: T037 -> T038 -> T039
```

### User Story 4

```text
Parallel test batch: T040, T041, T042
Parallel implementation after tests: T043, T046, T047
Join points: T043 -> T044 -> T045; T044 + T045 + T046 + T047 -> T048
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Complete US1 tests and implementation.
3. Stop and validate the full pagination-plus-search journey independently.
4. Demonstrate a local-only searchable full list before adding sorting, category filtering, or
   advanced recovery.

### Incremental Delivery

1. **MVP**: US1 — popup activation, complete list collection, normalization, inline panel, search.
2. **Increment 2**: US2 — numeric and alphabetical sorting.
3. **Increment 3**: US3 — conditional category filtering and composition.
4. **Increment 4**: US4 — complete unsupported/partial/retry/cancel recovery.
5. **Release gate**: Cross-cutting privacy, permissions, accessibility, performance, and live-page
   validation.

## Notes

- `[P]` means distinct files and no dependency on unfinished work at that point in the phase.
- Story labels provide traceability to `spec.md`; setup, foundation, and polish tasks intentionally
  have no story label.
- Keep source selectors only in `src/content/target-adapter.ts`; keep domain modules DOM-free; keep UI
  modules free of extraction rules.
- Preserve original restaurant content and keep all collected state in memory for the active view.
- Do not add runtime dependencies, remote assets, analytics, persistent storage, host permissions, or
  a background worker without amending the plan and passing the Constitution Check again.
