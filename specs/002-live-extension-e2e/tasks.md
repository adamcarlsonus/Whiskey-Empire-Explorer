# Tasks: Live Extension End-to-End Testing

**Input**: Design documents from `/specs/002-live-extension-e2e/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: The specification requires deterministic harness tests, seeded failure checks, and a real
network/browser run against the production page and production extension package.

**Organization**: Tasks are grouped by user story so the passing live proof, diagnostics, and safe
repeatability can be implemented and verified as distinct increments.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and has no incomplete dependency
- **[Story]**: Maps the task to US1, US2, or US3 from spec.md
- Every task names the exact file or directory it changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the authoritative automation runtime and establish separate live-test commands

- [X] T001 Replace `playwright-core` with lockfile-pinned `playwright` and add explicit `e2e:install`, deterministic harness-test, and live-run scripts in `package.json` and `pnpm-lock.yaml`
- [X] T002 [P] Add ignored timestamped report storage with a tracked retention note in `.gitignore` and `test-results/live-extension/.gitignore`
- [X] T003 [P] Create the ESM harness support layout and module responsibilities in `tests/e2e/support/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the stage, report, configuration, and bounded-diagnostics primitives used by every story

**⚠️ CRITICAL**: No user-story implementation begins until these contracts and deterministic tests pass.

- [X] T004 [P] Add failing contract tests for report shape, redaction, count limits, JSON persistence, and newest-ten retention in `tests/e2e/support/report.test.mjs`
- [X] T005 [P] Add failing tests for legal stage transitions, per-stage timeout classification, the 115-second work deadline, and cleanup reservation in `tests/e2e/support/stages.test.mjs`
- [X] T006 Implement ordered stage state, deadline racing, last-successful/first-failed tracking, and global timeout handling in `tests/e2e/support/stages.mjs`
- [X] T007 Implement the `LiveTestRun` report model, sanitizers, atomic JSON writer, schema-version field, and retention pruning in `tests/e2e/support/report.mjs`
- [X] T008 [P] Centralize the exact target URL, macOS platform guard, stage deadlines, evidence limits, report root, and production paths in `tests/e2e/support/config.mjs`
- [X] T009 Implement bounded frame-origin, request-provenance/origin, accessible-element, popup/panel-status, console, page-error, and failed-request capture without HTML, headers, cookies, traces, or whiskey-row payloads in `tests/e2e/support/diagnostics.mjs`
- [X] T010 Wire `report.test.mjs` and `stages.test.mjs` into the deterministic harness-test command in `package.json` and confirm they pass independently of network and Chromium availability

**Checkpoint**: The harness can classify a synthetic run, enforce deadlines, sanitize evidence, and
write a contract-shaped local report without launching a browser.

---

## Phase 3: User Story 1 - Prove a Real Scan Works (Priority: P1) 🎯 MVP

**Goal**: Run one production-path scenario in managed Chromium and succeed only after live non-empty
results, search, and sorting are observed.

**Independent Test**: With networking and managed Chromium available, run `npm run test:e2e:live`
from a clean build. It exits `0` only after selecting Whiskey Empire, opening the popup with
the browser-owned default action, clicking Scan, observing complete non-empty results, searching, and sorting.

### Tests for User Story 1

- [X] T011 [P] [US1] Add failing deterministic tests for complete-status recognition, positive count parsing, live-derived search-token selection, filtered-count assertions, and descending sort-state assertions in `tests/e2e/support/live-flow.test.mjs`

### Implementation for User Story 1

- [X] T012 [US1] Implement production manifest equality, stable `dist/` SHA-256 identity, temporary-profile creation, managed persistent Chromium launch with background-network suppression, and idempotent close/remove operations in `tests/e2e/support/browser.mjs`
- [X] T013 [US1] Verify the browser accepted exactly one enabled production extension by inspecting the open shadow DOM of `chrome://extensions/` for a matching `extensions-item`, record its ID/name/version before target navigation, and fail `extension-availability` if inspection or matching fails in `tests/e2e/support/browser.mjs`
- [X] T014 [US1] Implement exact-origin live navigation plus accessible cross-frame discovery, visibility checks, automatic click, and selected-state evidence for Whiskey Empire in `tests/e2e/support/live-flow.mjs`
- [X] T015 [US1] Implement focused-tab browser-owned `Extensions.triggerAction` activation, new extension-popup target discovery, production popup Scan enablement/click, and acknowledgement capture in `tests/e2e/support/live-flow.mjs`
- [X] T016 [US1] Implement open-shadow-root panel observation that rejects partial, unsupported, failed, cancelled, timed-out, and zero-entry states while accepting only complete positive results in `tests/e2e/support/live-flow.mjs`
- [X] T017 [US1] Implement live-derived search and `price-desc` interaction assertions, including matching count, selected option, and descending `aria-sort`, in `tests/e2e/support/live-flow.mjs`
- [X] T018 [US1] Replace the hard-coded installed-Chrome script with the staged managed-Chromium orchestration and strict exit-0 success path in `tests/e2e/live-extension.mjs`
- [X] T019 [US1] Run `npm run test:e2e:live` against `https://thewestsideblono.com/drink/drink-menu/`, require exit `0` with complete non-empty results/search/sort evidence and successful cleanup, and record the passing report identifier in `tests/manual/live-e2e-result.md`; leave this task incomplete if the run fails or is blocked

**Checkpoint**: User Story 1 is complete only when the installed production extension produces and
manipulates real live results; panel attachment or an error message cannot pass.

---

## Phase 4: User Story 2 - Diagnose Every Live Failure (Priority: P2)

**Goal**: Every unavailable prerequisite, timeout, browser/page/popup error, unsupported structure,
and scan failure terminates promptly with bounded local evidence and a meaningful nonzero exit.

**Independent Test**: Seed one missing prerequisite and one invalid-page condition. Each invocation
ends within its deadline, names the failed stage, exits nonzero, writes a sanitized report, and cleans up.

### Tests for User Story 2

- [X] T020 [P] [US2] Add failing tests for blocked-versus-failed classification, timeout exits, error truncation, request provenance/origin bounds, rejection of unexpected harness destinations, visible-element bounds, and mandatory failure report fields in `tests/e2e/support/failures.test.mjs`

### Implementation for User Story 2

- [X] T021 [US2] Add macOS, managed-browser, build, extension-loading, restaurant-origin-only target reachability, and action-command prerequisite classification with exit `2` for environmental blockers in `tests/e2e/support/prerequisites.mjs`
- [X] T022 [US2] After T018, attach browser, page, popup, console, web-error, request-provenance, failed-request, frame, and current-stage diagnostics; fail unexpected direct harness destinations and convert every stage timeout/error into a bounded report record in `tests/e2e/live-extension.mjs`
- [X] T023 [US2] After T018, guarantee report persistence and contract exit codes `1`, `2`, `124`, and `130` for thrown errors, blocked checks, global timeout, `SIGINT`, and `SIGTERM` in `tests/e2e/live-extension.mjs`
- [X] T024 [US2] Add deterministic harness-only seams covering all SC-007 classes—browser launch, extension installation, network/page, tab selection, action/popup, injection/messaging, scanner, and assertion failures—without modifying `manifest.json` or `dist/` in `tests/e2e/support/failure-fixtures.mjs`
- [X] T025 [US2] Execute every SC-007 seeded failure class and document each expected first-failed stage, exit code, report path, diagnostic discriminator, and cleanup outcome in `tests/manual/live-e2e-failure-matrix.md`

**Checkpoint**: User Story 2 independently proves that a broken environment or product flow cannot
hang, silently exit successfully, or produce an unclassified failure.

---

## Phase 5: User Story 3 - Run Safely and Repeatably (Priority: P3)

**Goal**: Repeated live runs use fresh isolated state, preserve production permissions, retain only
bounded local evidence, and clean up on every termination path.

**Independent Test**: Run the live command twice and confirm distinct profile/report identifiers,
unchanged manifest permissions, no remaining managed browser process or profile, and two attributable reports.

### Tests for User Story 3

- [X] T026 [P] [US3] Add failing tests for idempotent cleanup, profile-path non-disclosure, distinct run/profile IDs, production permission equality, and newest-ten report pruning in `tests/e2e/support/isolation.test.mjs`

### Implementation for User Story 3

- [X] T027 [US3] Route success, failure, timeout, and signal handling through one idempotent browser-close/profile-remove cleanup path with a five-second reserve in `tests/e2e/support/browser.mjs` and `tests/e2e/live-extension.mjs`
- [X] T028 [US3] Enforce source-versus-built manifest name/version/permission/host-permission equality and fail before navigation on drift in `tests/e2e/support/browser.mjs`
- [X] T029 [US3] Keep deterministic tests offline, prevent `validate` from invoking the live command, and include all harness unit tests in normal deterministic validation via `package.json`
- [X] T030 [US3] Run two consecutive live checks and document distinct run IDs, profile removal, process cleanup, permission equality, and retained reports in `tests/manual/live-e2e-repeatability.md`

**Checkpoint**: User Story 3 proves the live runner is repeatable without personal browser data,
permission expansion, leaked processes/profiles, or conflation with deterministic validation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Align documentation, privacy review, contracts, and final validation across all stories

- [X] T031 [P] Update installation, managed Chromium setup, deterministic-versus-live guarantees, report interpretation, and latest live outcome in `README.md`
- [X] T032 [P] Update the manual live checklist to require automatic tab selection, browser-owned default-action activation, successful non-empty results, search, sort, and unsupported-page rejection in `tests/manual/live-page-checklist.md`
- [X] T033 [P] Add deterministic validation of successful, failed, blocked, and malformed reports—including outcome-conditional stage and cleanup fields—against `specs/002-live-extension-e2e/contracts/diagnostic-report.schema.json` in `tests/e2e/support/schema.test.mjs`
- [X] T034 Audit the built manifest, direct harness request destinations, document-initiated origin evidence, report fields, retention, browser/profile cleanup, background-network suppression, and absence of test hooks against the constitution in `tests/manual/privacy-permissions-checklist.md`
- [X] T035 Run `npm run validate` and the full seeded harness suite, then record command outcomes and the under-120-second budget in `tests/manual/live-e2e-result.md`
- [X] T036 Execute the final `npm run test:e2e:live` quickstart scenario and update `README.md` with an explicit passed, failed, or blocked latest-live-run status and report identifier

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational and is the MVP.
- **User Story 2 (Phase 4)**: T020, T021, and T024 can start after Foundational. Orchestrator tasks
  T022 and T023 depend explicitly on US1 task T018; T025 follows their integration.
- **User Story 3 (Phase 5)**: Depends on Foundational; its full repeatability run requires the US1
  live flow and US2 termination handling.
- **Polish (Phase 6)**: Depends on all selected stories.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 (real passing flow)
                    -> US2 (diagnostic behavior)
                    -> US3 unit isolation checks
US1 + US2 ---------> US3 live repeatability check
US1 + US2 + US3 --> Polish and final validation
```

### Within Each User Story

- Write the story's deterministic tests first and observe them fail for the missing behavior.
- Implement shared model/helper behavior before top-level orchestration.
- Keep the production extension package unchanged; the harness observes public browser/UI boundaries.
- Complete the independent test before marking the story checkpoint done.

### Parallel Opportunities

- T002 and T003 can run alongside T001.
- T004 and T005 can run in parallel; T008 can proceed while their implementations are pending.
- T011 can be written while browser lifecycle work begins after Foundation.
- T020 and T026 can be drafted in parallel after Foundation because they use separate files.
- T031, T032, and T033 can proceed in parallel after story behavior stabilizes.

---

## Parallel Example: User Story 1

```text
Task T011: Write live success predicate and interaction tests in tests/e2e/support/live-flow.test.mjs
Task T012: Implement managed Chromium lifecycle in tests/e2e/support/browser.mjs
```

After T012, execute T013 sequentially in the same browser module. Execute T014 through T017
sequentially because they build one real user journey in `live-flow.mjs`, then integrate through T018.

## Parallel Example: User Stories 2 and 3

```text
Task T020: Write failure classification tests in tests/e2e/support/failures.test.mjs
Task T026: Write isolation and retention tests in tests/e2e/support/isolation.test.mjs
```

These test files can be prepared concurrently after Foundation, though live repeatability T030 waits
for the successful flow and termination handling.

---

## Implementation Strategy

### MVP First: User Story 1

1. Complete Setup and Foundation.
2. Implement T011-T018.
3. Run T019 against the real restaurant page.
4. Stop and diagnose the exact failed stage if the live run does not produce non-empty results.
5. Do not claim the MVP from fixture tests or an unsupported/error terminal state.

### Incremental Delivery

1. **Foundation**: Deterministic stages, reports, configuration, and bounded diagnostics.
2. **US1**: Genuine installed-extension live proof with search and sorting.
3. **US2**: Stage-specific failure reports and bounded termination.
4. **US3**: Cleanup, permission equality, retention, and two-run repeatability.
5. **Polish**: Documentation, schema conformance, privacy audit, and final live status.

## Notes

- `[P]` means different files and no dependency on an unfinished task.
- Every user-story task carries its story label; Setup, Foundation, and Polish tasks do not.
- Tests must fail for the absent behavior before their implementation task begins.
- The live runner must never import production scraper, normalizer, or renderer internals.
- Browser installation is explicit setup and must not occur silently inside the live test.
- A partial, unsupported, empty, failed, cancelled, timed-out, or cleanup-failed run is not success.
