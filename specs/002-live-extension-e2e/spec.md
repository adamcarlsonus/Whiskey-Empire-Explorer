# Feature Specification: Live Extension End-to-End Testing

**Feature Branch**: `002-live-extension-e2e`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "We need to be able to test the extension against the actual page. An
end-to-end test. Let's find a way to do that."

## Clarifications

### Session 2026-06-21

- Q: Which browser runtime is authoritative for the live end-to-end test? → A: Playwright-managed
  Chromium is the authoritative runtime.
- Q: Which operating systems must the first reliable live runner support? → A: macOS only.
- Q: How must the live test activate the extension action? → A: Invoke the manifest-declared
  `_execute_action` keyboard command using `Command+Shift+Y`.
- Implementation finding: Playwright-generated key events do not reach Chromium's browser-level
  command dispatcher. The authoritative automated equivalent is Chromium's browser-owned
  `Extensions.triggerAction` operation against the active tab; it runs the real default action and
  replaces the synthetic shortcut requirement. If the resulting toolbar bubble is not exposed as an
  automation page, the already-triggered action MAY be followed by opening the same production popup
  in a background extension tab for DOM interaction while the restaurant tab remains active; that
  page MUST NOT substitute for the prior action activation.
- Q: Is selecting the Whiskey Empire tab part of the automated test? → A: Yes; the runner must find
  and select the live tab without manual intervention.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prove a Real Scan Works (Priority: P1)

A developer runs one explicit live end-to-end check that installs the production extension into an
isolated browser session, opens the actual restaurant drink-menu page, selects Whiskey Empire,
activates the extension through its real browser action, starts a scan, and observes non-empty
enhanced results.

**Why this priority**: The current deterministic tests can pass while the installed extension does
nothing on the real page. The project needs direct evidence across every production boundary.

**Independent Test**: Run the live-test command with network access and no existing browser state.
The run succeeds only after the real page produces an injected extension panel with at least one
whiskey entry and a successful terminal scan status.

**Acceptance Scenarios**:

1. **Given** a fresh isolated browser profile and the current production extension build, **When**
   the live test runs, **Then** it opens the exact restaurant page, selects Whiskey Empire, activates
   the extension through a browser-recognized user gesture, and starts Scan from the real popup.
2. **Given** Scan has started on the real page, **When** collection finishes, **Then** the test
   observes the injected panel, a successful terminal status, and at least one normalized result.
3. **Given** real results are present, **When** the test searches using text from a collected entry
   and changes a sort option, **Then** it observes the expected filtered result and an acknowledged
   sort state in the installed extension UI.

---

### User Story 2 - Diagnose Every Live Failure (Priority: P2)

A developer receives a bounded, stage-specific failure instead of a silent hang when browser launch,
extension installation, page access, tab selection, activation, popup messaging, scanning, or result
observation fails.

**Why this priority**: A live test is useful only when it distinguishes product defects from browser,
network, policy, and automation-environment failures.

**Independent Test**: Deliberately make one prerequisite unavailable and confirm the run terminates
within its time budget with a failed stage, explanatory message, and locally saved diagnostic report.

**Acceptance Scenarios**:

1. **Given** the browser cannot start or accept the extension, **When** the relevant deadline expires,
   **Then** the run fails with the browser-launch or extension-install stage identified.
2. **Given** the restaurant page is unreachable, changed, iframe-isolated, or lacks the expected tab,
   **When** the test cannot proceed, **Then** it records the page URL, visible structure summary,
   browser/page errors, and the exact failed stage.
3. **Given** the extension reports unsupported content, returns an error, produces zero entries, or
   never reaches a terminal state, **When** the run ends, **Then** the overall test fails and preserves
   the popup/panel status and relevant browser console errors.

---

### User Story 3 - Run Safely and Repeatably (Priority: P3)

A developer can rerun the live test without changing their everyday browser profile, weakening the
production manifest, leaving browser processes behind, or confusing live validation with deterministic
unit tests.

**Why this priority**: Repeatability and isolation keep the live check trustworthy and prevent test
conveniences from bypassing the extension's privacy and least-privilege design.

**Independent Test**: Run the live check twice from a clean production build and verify that each run
uses fresh local state, the same production permissions, a distinct report, and complete cleanup.

**Acceptance Scenarios**:

1. **Given** an existing personal browser profile, **When** the live test runs, **Then** it uses a
   separate temporary profile and does not read or modify personal browsing data or installed extensions.
2. **Given** the live run completes or fails, **When** cleanup finishes, **Then** the isolated browser
   closes, temporary profile data is removed, and the diagnostic report remains locally available.
3. **Given** the normal deterministic test suite runs, **When** live network/browser prerequisites are
   absent, **Then** deterministic tests remain runnable and do not silently substitute for the live test.

### Edge Cases

- Playwright-managed Chromium is missing, cannot start with the isolated profile, or is restricted by
  local or enterprise policy.
- The browser no longer accepts command-line loading of unpacked extensions.
- The extension action shortcut conflicts with a browser or operating-system shortcut.
- The popup is browser UI that the automation driver cannot observe as a normal page target.
- Opening the popup directly does not grant the temporary active-page access required by production.
- The restaurant page redirects, times out, presents an interstitial, or detects automation.
- Multiple visible elements contain "Whiskey Empire," but only one controls the drink-menu panel.
- The menu is inside a same-origin or cross-origin iframe, shadow root, or dynamically loaded widget.
- The page changes after tab selection or while pagination is being scanned.
- The extension panel appears but stays in a nonterminal state, reports unsupported content, or has
  zero results.
- The current build is stale or differs from the files installed into the isolated browser.
- Cleanup begins after a crash, timeout, cancellation, or partially created browser profile.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST provide one clearly named command dedicated to live end-to-end testing;
  it MUST remain separate from deterministic unit and fixture tests.
- **FR-002**: The live test MUST build and install the same production extension package that a
  developer would load manually, including the production manifest, permissions, popup, and content
  bundle.
- **FR-003**: The live test MUST NOT add test-only host permissions, background execution, storage,
  auto-activation hooks, page code, or alternate content scripts to make the scenario pass.
- **FR-004**: The test MUST use a fresh isolated browser profile and MUST NOT reuse a developer's
  personal profile, cookies, browsing history, saved credentials, or installed extensions.
- **FR-005**: Before opening the page, the test MUST establish that the Playwright-managed Chromium
  runtime started and that the production extension was accepted and is available for activation.
- **FR-006**: The test MUST open `https://thewestsideblono.com/drink/drink-menu/` over the network and
  MUST treat a redirect to another origin, interstitial, access denial, or unavailable page as a failed
  live-page stage.
- **FR-007**: The test MUST identify and select the visible Whiskey Empire tab through the live user
  interface without manual intervention and MUST record which page/frame element was used.
- **FR-008**: The test MUST invoke the real extension default action against the active restaurant tab
  through Chromium's browser-owned `Extensions.triggerAction` operation, which exercises the action
  and temporary active-page access path. If Chromium does not expose its toolbar popup bubble as an
  automation page, the test MAY then open the unchanged production popup in a background extension
  tab for interaction while keeping the restaurant tab active. Renderer-synthetic keyboard events,
  opening the popup URL without the prior action, calling internal extension modules, or using macOS
  Accessibility UI automation do not satisfy this requirement.
- **FR-009**: The test MUST interact with the production popup to request Scan and MUST record whether
  injection and scan messaging were acknowledged.
- **FR-010**: The test MUST observe the production page for the injected panel and its open shadow-root
  status/results surfaces; mock documents, copied HTML, and module-level return values cannot satisfy
  this observation.
- **FR-011**: A successful run MUST reach a successful terminal scan state, parse the source list's
  advertised total, and observe exactly that many normalized whiskey entries. Unsupported, failed,
  cancelled, timed-out, zero-entry, incomplete, or partial-only outcomes MUST fail the end-to-end
  test while remaining diagnostic evidence.
- **FR-012**: After collection, the test MUST derive a query from an observed entry, submit that query
  through the production search control, and observe a matching result.
- **FR-013**: After collection, the test MUST change at least one production sort option and observe
  the corresponding visible/accessible sort state.
- **FR-014**: The live test MUST assign separate bounded deadlines to browser launch, extension
  availability, page access, tab selection, popup activation, scan start, scan completion, and cleanup.
- **FR-015**: Every failed stage MUST terminate with a nonzero result and a message naming the failed
  stage; a hang, missing result file, or successful exit without assertions is prohibited.
- **FR-016**: Each run MUST write a local structured report containing start/end times, browser and
  extension identity, reached stages, current URL, observed tab/popup/panel status, result count,
  browser console/page errors, final outcome, and cleanup outcome.
- **FR-017**: On page-structure or scan failure, the report MUST include a bounded, sanitized summary
  of relevant visible elements and frame origins sufficient to distinguish main-document, iframe,
  shadow-root, and selector failures without storing unrelated browsing data.
- **FR-018**: Diagnostic artifacts MUST remain local, exclude credentials and unrelated browsing
  content, and be overwritten or separately timestamped according to a documented retention rule.
- **FR-019**: The test MUST close the isolated browser and remove its temporary profile after success,
  failure, timeout, or cancellation while preserving the local diagnostic report.
- **FR-020**: The test MUST perform a prerequisite check that reports browser availability, unpacked
  extension-loading capability, live-page network reachability, and action-activation support before
  claiming the product scan itself failed.
- **FR-021**: The project documentation MUST distinguish deterministic test guarantees from live-test
  guarantees and MUST state explicitly whether the most recent live run passed, failed, or was blocked.
- **FR-022**: The live test MUST preserve the extension's local-only privacy model. Harness-initiated
  runtime requests MUST be limited to the exact restaurant URL or its origin; additional browser page
  requests are permitted only when initiated by that loaded document or its descendant frames for
  normal subresources. The harness MUST fail on any unexpected direct request it initiates and MUST
  add no analytics, remote logging, or external result upload.

### Key Entities *(include if feature involves data)*

- **Live Test Run**: One isolated attempt with timestamps, configuration, reached stages, outcome,
  cleanup state, and references to local diagnostics.
- **Test Stage**: A bounded operation such as browser launch, extension availability, live-page access,
  tab selection, action activation, popup Scan, panel observation, result assertion, or cleanup.
- **Production Extension Identity**: The built package location, manifest version, declared permissions,
  and browser-assigned extension identity used by the run.
- **Diagnostic Report**: Sanitized local evidence containing stage outcomes, visible statuses, frame
  origins, errors, counts, and final classification without private browser data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a supported developer machine with live-page access, one command completes the real
  browser-to-extension-to-page scenario and reports success only after the result count equals the
  live list's advertised total.
- **SC-002**: 100% of successful runs demonstrate production action activation, production popup Scan,
  injected panel observation, advertised-total completeness, live search, and sort-state observation.
- **SC-003**: 100% of failed or blocked runs produce a nonzero result and name the last successful and
  first failed stages in a local report.
- **SC-004**: No stage can wait indefinitely; every run terminates or self-aborts within two minutes
  and records whether cleanup completed.
- **SC-005**: Two consecutive successful runs use distinct isolated profiles, leave no test browser
  running, and produce independently attributable reports.
- **SC-006**: Permission comparison finds no difference between the package tested live and the
  production package produced by the normal build.
- **SC-007**: Diagnostic review can distinguish browser-launch, extension-install, network/page,
  tab-selection, action/popup, injection/messaging, scanner, and assertion failures in every seeded
  failure scenario.
- **SC-008**: Automated request-provenance checks and a static harness audit find zero harness-initiated
  transmissions to analytics, remote logging, artifact hosting, or any destination other than the
  restaurant origin; document-initiated subresources are recorded by origin but are not treated as
  harness destinations.

## Assumptions

- The authoritative browser runtime is the Playwright-managed Chromium version pinned by the
  project's automation dependency; installed branded Google Chrome is not required for a valid run.
- The initial supported environment is a developer-controlled desktop with permission to install or
  reuse that managed Chromium runtime and start an isolated browser process; version one supports
  macOS only.
- The restaurant page is public and requires no login, CAPTCHA, payment, or personal information.
- The live test is an explicit network-dependent command and is not silently included in the default
  deterministic test command.
- A visible browser window is acceptable when browser security prevents extension action testing in
  headless mode.
- The extension's current production permission model remains `activeTab` plus script injection; the
  test adapts to that model rather than weakening it.
- Temporary browser files may be created locally during the run but are removed during cleanup.
- Live restaurant inventory and prices may change; assertions use observed data and structural
  outcomes rather than fixed whiskey names, counts, or prices.
- CI execution is optional for the first version; reliable local developer execution is required.
