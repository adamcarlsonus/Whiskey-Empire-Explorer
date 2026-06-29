# Feature Specification: Enhanced Whiskey List Browsing

**Feature Branch**: `001-enhance-whiskey-list`

**Created**: 2026-06-20

**Status**: Draft

**Input**: User description: "Enhance a paginated restaurant whiskey list with full-list
search, sorting, distillery filtering, progress feedback, local-only processing, and clear
unsupported-page errors."

## Clarifications

### Session 2026-06-20

- Q: Which source should be authoritative for the v1 page structure? → A: The live Westside
  drink-menu page, after the visitor opens the Whiskey Empire tab.
- Q: How should the extension collect remaining pagination pages? → A: Load discovered pagination
  pages exposed by the active list, including its Untappd source-provider links, in the background
  without changing the visible restaurant page.
- Q: Which whiskey fields are required for a valid collected entry? → A: Require a recognizable
  name and displayed price; capture all other visible fields when present.
- Q: Where should the enhanced interface appear? → A: Insert an inline panel above the original
  Whiskey Empire list and leave the original content intact below it.
- Q: Which Chrome permissions and activation model should v1 use? → A: Require a toolbar click
  and use only temporary active-page access plus script-injection permission.

### Session 2026-06-23

- Q: Must the visitor select Whiskey Empire before scanning? → A: No. Scan MUST select the
  Whiskey Empire tab automatically, wait for its list to become available, and then collect it.
- Q: How should source category codes and results be presented? → A: Remove opaque hash codes such
  as `#BOU` and `#RYE`, preserve the readable type, and use a spacious menu-style table layout.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search the Complete List (Priority: P1)

A visitor opens the restaurant's whiskey list, activates the enhancement, and uses an inline
panel above the original Whiskey Empire list to watch pages being collected and search all
collected entries without manually moving through pagination.

**Why this priority**: Discovering a desired whiskey across the complete list is the primary
value and removes the largest burden in the existing experience.

**Independent Test**: Use a list with matches on multiple pages, activate the enhancement,
search for terms present in name, distillery, type, region, proof, and descriptive text, and verify
that every matching entry from the collected pages is shown.

**Acceptance Scenarios**:

1. **Given** a supported whiskey list with multiple pages, **When** the visitor activates the
   enhancement, **Then** progress is announced until every linked list page is processed and
   the combined view reports the number of collected entries.
2. **Given** the complete list has been collected, **When** the visitor enters a search term,
   **Then** entries matching any visible whiskey text are shown regardless of their original
   page, and non-matching entries are hidden.
3. **Given** a search has no matches, **When** the results update, **Then** the visitor sees a
   clear no-results message and can clear the search.

---

### User Story 2 - Sort Whiskeys (Priority: P2)

A visitor sorts the collected list by price or whiskey name to compare options without
working through the restaurant's original page order.

**Why this priority**: Price comparison and alphabetical discovery are explicit gaps in the
existing list and become valuable once all pages are combined.

**Independent Test**: Use entries with varied prices and names, choose each sort order, and
verify the resulting order while confirming that entries with unavailable values remain
visible.

**Acceptance Scenarios**:

1. **Given** entries with valid prices, **When** the visitor selects price low-to-high or
   high-to-low, **Then** priced entries appear in the requested numeric order.
2. **Given** collected entries, **When** the visitor selects alphabetical sorting, **Then**
   entries are ordered by whiskey name without regard to letter case.
3. **Given** entries whose displayed prices cannot be reduced to one unambiguous sortable amount,
   **When** a price sort is applied, **Then** those entries remain visible after sortable entries
   and are clearly marked as lacking a comparable price.

---

### User Story 3 - Filter by Distillery (Priority: P3)

A visitor narrows the combined list by distillery using the producer metadata exposed by the
restaurant, while retaining search and sort controls.

**Why this priority**: Distillery filtering speeds exploration across the large collection.

**Independent Test**: Use a list containing several visible producers, select or type a distillery,
and verify that only matching entries remain while search and sorting still work.

**Acceptance Scenarios**:

1. **Given** the source identifies producers, **When** collection completes, **Then** the
   enhancement offers the distinct visible distilleries through a searchable combobox.
2. **Given** an active distillery filter, **When** the visitor searches or sorts, **Then** both
   operations apply only to the filtered entries and the active filter remains apparent.
3. **Given** no producer metadata is visible, **When** collection completes, **Then** no
   distillery control is shown and search and sorting remain fully usable.

---

### User Story 4 - Recover from Unsupported Content (Priority: P4)

A visitor receives clear, actionable feedback when the enhancement cannot reliably read the
current page, while the restaurant's original page remains available and usable.

**Why this priority**: Restaurant markup can change, so failures must be safe and understandable
rather than producing an empty or misleading list.

**Independent Test**: Activate the enhancement on unsupported and partially malformed fixtures
and verify that it reports the problem, does not replace original content, and offers a route
back to the original page.

**Acceptance Scenarios**:

1. **Given** the current page lacks a recognizable whiskey list, **When** the visitor activates
   the enhancement, **Then** a clear unsupported-page message appears and original content is
   unchanged.
2. **Given** one linked page fails during collection, **When** scanning ends, **Then** the visitor
   is told the collection is incomplete, sees clearly labeled partial results, and may start a
   fresh scan from the panel navigation.
3. **Given** the enhanced view is open, **When** the visitor chooses the original-page link or
   close action, **Then** the restaurant's original list is available at its canonical location.

### Edge Cases

- Pagination contains duplicate links, cycles, disabled controls, or a next link that repeats
  the current page.
- The restaurant changes pagination labels or moves fields while retaining recognizable list
  content.
- Entries are duplicated across pages or differ only in formatting and capitalization.
- Prices contain currency symbols, ranges, multiple pour sizes, decimals, or non-price text.
- A candidate entry lacks a recognizable name or displayed price and is skipped with a collection
  warning; optional category, proof, region, or description fields may be absent.
- The list is empty, contains a single page, or changes while collection is in progress.
- Collection is interrupted by navigation, a page-load failure, access denial, or rate limiting.
- The visitor changes or clears search and filters while results are still loading.
- The list is large enough that rapid typing, sorting, or filtering could create noticeable delay.
- The pagination set exceeds 20 pages or the collected list exceeds 1,000 valid entries.
- The enhanced interface is used with only a keyboard, at 200% zoom, with reduced motion, or
  with assistive technology.

## Requirements *(mandatory)*

### Definitions and Operational Boundaries

- **Canonical UI terms**: The **popup** is the toolbar-owned activation and compact-status surface.
  The **inline panel** is the single injected results surface placed above the original Whiskey
  Empire list. "Enhanced view" and "overlay" refer to this inline panel and do not describe a modal,
  replacement page, or separate tab.
- **Active Whiskey Empire tab**: The supported drink-menu URL is active, the restaurant's Whiskey
  Empire tab control reports its selected state, and its associated content region is visible. Scan
  selects this tab automatically and waits for the associated content before extraction.
- **Recognizable name**: A non-empty trimmed string taken from the candidate row's primary name
  element or, if that selector moved, the first text element occupying the same repeated row-name
  role. Category headings, prices, proof values, controls, and surrounding section text cannot serve
  as a name.
- **Displayed price**: Non-empty text from the candidate row's price field that contains at least one
  USD amount. A label without a USD amount is not a displayed price and invalidates the candidate.
  A **comparable price** exists only when the field expresses exactly one USD amount; ranges and
  multiple pour amounts retain their display text but have no comparable price.
- **Entry-visible text**: Text contained within a candidate whiskey row plus the explicit category
  heading or field associated with that row. Pagination controls, tab labels, neighboring rows, and
  unrelated drink-menu sections are excluded.
- **Distillery**: The visible producer value from `.item-producer` or its supported semantic fallback.
  Distilleries are never inferred from the whiskey name, notes, or external data.
- **Supported structure**: The active Whiskey Empire region is identifiable and contains a repeated
  row pattern from which at least one valid name-and-price entry can be extracted. Reordered fields,
  wrapper changes, and moved elements are minor changes when semantic labels and repeated row roles
  still establish those facts. Missing/ambiguous region identity, no repeated row pattern, or zero
  valid entries is unsupported.
- **Allowed pagination target**: An HTTPS URL resolved from a pagination control inside the active
  Whiskey Empire region, either on the exact restaurant drink-menu path or the validated
  `business.untappd.com/locations/{id}/themes/{id}/items` source-provider path with numeric page and
  section identifiers, with its fragment removed. Any other origin/path, credentials, malformed
  target, out-of-range page, or repeated canonical URL is unsafe.
- **Active view lifetime**: Begins when Scan is accepted. It ends when the inline panel is closed,
  the tab navigates away from the document, or the tab closes. Ending the active view aborts requests
  and discards entries, queries, criteria, warnings, errors, timestamps, and the in-memory session ID.

### Functional Requirements

- **FR-001**: The v1 product MUST target the Whiskey Empire tab on the live Westside drink-menu
  page at `https://thewestsideblono.com/drink/drink-menu/`. After the visitor clicks Scan, it MUST
  select Whiskey Empire automatically and wait for its associated content before collection.
- **FR-002**: The product MUST identify and process the full finite set of whiskey-list pages
  reachable through pagination exposed by the currently viewed list, loading discovered pages
  in the background without changing the visible restaurant page. Discovery MUST support numbered
  page links, a Next-only sequence, and an initially unknown total.
- **FR-003**: Page access MUST remain limited to the restaurant list and its validated Untappd
  source-provider pagination targets and MUST apply the allowed-pagination-target definition before
  each request. Repeated, cyclic, malformed, unrelated cross-origin, wrong-path, or otherwise unsafe
  targets MUST be ignored and reported when they make the collection incomplete.
- **FR-004**: The product MUST show accessible collection progress, including pages processed or
  another determinate status when a total is available, and MUST announce completion or failure.
  For an unknown total it MUST report processed and newly discovered page counts; progress MUST also
  expose accepted entries and skipped candidates. At most one progress announcement occurs per page.
- **FR-005**: A valid collected entry MUST have a recognizable name and displayed price. The product
  MUST preserve all other meaningful visible text and capture category, distillery, type, region, proof, description,
  and source link when present; candidates missing either required field MUST be skipped and counted
  in a collection warning.
- **FR-006**: The product MUST normalize whitespace, capitalization used for comparison, prices,
  categories, and duplicate entries while retaining meaningful display text and scalar source
  context. Opaque source hash codes matching `#[A-Z0-9]{2,5}` MUST be omitted from display and search
  text while their readable type remains. Source context MUST NOT retain DOM nodes or executable page content.
- **FR-007**: Extraction, normalization, searching, sorting, filtering, and rendering MUST remain
  separate processing stages with defined entry inputs and outputs.
- **FR-008**: The visitor MUST be able to search the complete collected list using a case-insensitive
  match across all visible text associated with each entry.
- **FR-009**: Search results MUST update as the query changes and MUST expose both the result count
  and a clear no-results state.
- **FR-010**: The visitor MUST be able to sort entries by numeric price low-to-high, numeric price
  high-to-low, and whiskey name alphabetically.
- **FR-011**: Price sorting MUST handle valid prices numerically and place entries without one
  unambiguous sortable price after validly priced entries without discarding them. Equal numeric
  prices MUST be ordered by normalized name then original source order; non-comparable prices MUST
  follow comparable prices in both price directions. Name sorting MUST be case-insensitive and stable.
- **FR-012**: When producer metadata is visible, the visitor MUST be able to filter it through a
  searchable distillery combobox; when none is visible, the distillery control MUST be omitted.
- **FR-013**: Search, distillery filtering, and sorting MUST compose predictably, and the interface
  MUST visibly identify all active criteria and provide a one-step reset.
- **FR-014**: The enhanced view MUST preserve a visible link to the canonical restaurant list and
  MUST appear as an inline panel above the original Whiskey Empire list, which MUST remain intact
  and reachable below the panel. Each result MUST also offer an explicit Google Search link using
  only its displayed name and type, opening in a new tab with opener and referrer isolation.
- **FR-015**: If the page is unsupported, collection is incomplete, or no reliable entries can be
  extracted, the product MUST show a clear error or warning with appropriate rescan and
  return-to-original actions. Wrong URL and inactive tab offer guidance and Close; unsupported
  structure and zero valid entries offer Close and original-page access; request/parse failures offer
  Rescan; a failed middle page or safety limit retains labeled partial results and offers Rescan,
  Close, and original-page access without a separate continue action.
- **FR-016**: A collection or rendering failure MUST NOT remove, corrupt, or prevent use of the
  restaurant's original page.
- **FR-017**: Added controls and status messages MUST support keyboard use, visible focus, semantic
  structure, accessible names, sufficient contrast, 200% zoom and reflow, and reduced-motion
  preferences where motion is present.
- **FR-018**: The product MUST use only temporary access to the visitor's active tab plus permission
  to inject the enhancement after a toolbar click. It MUST NOT request persistent site access,
  background execution, storage, tab-history access, or access to unrelated browsing. Pagination
  requests MUST originate from the injected page context under normal web-origin and CORS rules.
- **FR-019**: Collected page content, browsing activity, queries, and interactions MUST NOT be sent
  to analytics, logging, crash reporting, advertising, or any other external data service. Permitted
  pagination requests contain only the URL and headers Chrome would normally send; cross-origin
  source-provider requests omit credentials. The extension MUST NOT add collected content, queries, criteria,
  interaction events, session IDs, or identifiers. The sole user-initiated exception is clicking a
  visible Google Search link, which deliberately navigates a new tab with that product's name/type query;
  the extension makes no search request until the visitor clicks and sends no other session data.
- **FR-020**: Collected data MUST exist only for the active enhanced view and MUST be discarded when
  that page or view ends; no account, server storage, browsing-history store, or cross-site profile
  may be created. No local, session, synchronized, IndexedDB, cache, or file persistence is permitted
  in v1.
- **FR-021**: After collection, search, sorting, and filtering MUST use the locally collected list
  and MUST NOT require further page access.
- **FR-022**: Collection MUST avoid duplicate page processing and MUST stop with a clear warning at
  20 processed pages or 2,000 accepted entries rather than scan indefinitely. Reaching either limit
  produces labeled partial results; SC-001's completeness guarantee applies only within both limits.
- **FR-023**: A session MUST follow `idle -> validating -> scanning -> normalizing -> ready`, with
  terminal alternatives `partial`, `failed`, `unsupported`, or `cancelled`. Cancel aborts the active
  request and starts no new requests. Rescan creates a fresh attempt and clears stale results; repeated
  Start while scanning or ready focuses and reports the existing session without duplicate requests.
- **FR-024**: The popup MUST provide target guidance, Scan/Focus Panel, compact aggregate status, and
  privacy copy; it MUST NOT contain whiskey results. The inline panel MUST remain authoritative for
  progress, results, criteria, warnings, recovery, original-page access, and close behavior even when
  the popup closes.
- **FR-025**: All executable code, styles, icons, and required assets MUST ship in the extension
  package. Runtime-loaded code, remote UI assets, analytics, telemetry, and runtime dependencies on
  third-party services are prohibited.

### Key Entities *(include if feature involves data)*

- **Whiskey Entry**: One normalized listing with required original visible text, recognizable name,
  and display price; an optional sortable price, category, brand, type, region, proof, description,
  and source reference are retained when those values exist.
- **Source Page**: One page in the current restaurant list's pagination set, identified by its
  canonical location and collection state.
- **Collection Session**: The temporary, local-only activity that tracks discovered pages,
  processed pages, entries, progress, warnings, completion, and failure for the active view.
- **View Criteria**: The visitor's current search query, category selection, sort order, and
  resulting entry count within the active view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On representative supported lists of up to 20 pages and 2,000 entries, 100% of entries
  visible across reachable pagination pages appear in the combined view without manual pagination.
- **SC-002**: In usability testing, at least 95% of visitors can activate the enhancement, search
  the complete list, and identify a matching whiskey on their first attempt without assistance.
- **SC-003**: Search, filter, and sort changes visibly update within 200 milliseconds for lists of
  up to 2,000 collected entries on a representative consumer device.
- **SC-004**: Price sorting places 100% of entries with recognized numeric prices in correct
  ascending or descending order across representative price formats.
- **SC-005**: During every multi-page collection, visitors receive visible and assistive-technology
  compatible progress feedback at least once per processed page and a final completion or failure
  status.
- **SC-006**: Unsupported-page and interrupted-collection tests produce a clear explanatory message
  and leave the original restaurant page usable in 100% of tested cases.
- **SC-007**: All primary actions can be completed using only a keyboard at 200% zoom, with no loss
  of information or focus visibility, across the supported interaction flows.
- **SC-008**: Privacy verification finds zero transmissions of collected whiskey data, search terms,
  interaction data, or browsing activity to any destination other than normal requests for the
  restaurant list's validated pagination pages.
- **SC-009**: Permission review confirms that the enhancement uses only temporary active-tab access
  and script injection after a toolbar click, with no persistent host or background permission.

### Measurement Conditions

- **Collection fixture**: SC-001 and SC-005 use a deterministic 20-page fixture totaling 2,000 valid
  entries, with numbered and Next-only pagination, duplicate/cyclic links, optional fields, skipped
  candidates, and unique entries on the first, middle, and final pages.
- **Usability study**: SC-002 uses at least 20 first-time participants given only the supported URL
  and the task "find a whiskey matching this term across the complete list." At least 19 must activate,
  search, and identify the specified entry without facilitator help.
- **Performance baseline**: SC-003 is measured in current stable desktop Chrome on a machine with at
  least four logical CPU cores and 8 GB RAM, after collection completes. Timing begins at the search,
  filter, or sort input event and ends after the results/count update is committed; the 95th percentile
  across 20 changes MUST be at most 200 milliseconds.
- **Price corpus**: SC-004 covers USD whole-dollar and decimal amounts with optional `$`, comma
  thousands separators, and surrounding price labels, plus non-comparable ranges, multiple pour
  amounts, blank labels, and unrelated proof numbers. Other currencies and locale-specific comma
  decimals are outside v1 scope and remain non-comparable.
- **Accessibility matrix**: SC-007 covers every popup and inline-panel control and every validating,
  scanning, ready, partial, empty-search, unsupported, failed, and cancelled state using keyboard-only
  operation, visible focus, polite status announcements, WCAG 2.2 AA text/control contrast, 200% zoom,
  control reflow without two-dimensional scrolling, and reduced motion.

## Requirements Traceability

| Requirement group | Primary scenario | Measurable outcome |
|-------------------|------------------|--------------------|
| FR-001, FR-018, FR-024 | US1 activation | SC-002, SC-009 |
| FR-002–FR-004, FR-022–FR-023 | US1 collection; US4 recovery | SC-001, SC-005, SC-006 |
| FR-005–FR-007 | US1 complete searchable list | SC-001, SC-008 |
| FR-008–FR-009, FR-013 | US1 search | SC-002, SC-003 |
| FR-010–FR-011 | US2 sorting | SC-003, SC-004 |
| FR-012 | US3 distillery filtering | SC-003, SC-007 |
| FR-014, FR-016–FR-017 | US1 panel; US4 safe failure | SC-006, SC-007 |
| FR-015 | US4 recovery | SC-006 |
| FR-019–FR-021, FR-025 | Cross-cutting privacy | SC-008, SC-009 |

## Assumptions

- The authoritative v1 source structure is the live Westside drink-menu page after the extension
  opens the Whiskey Empire tab.
- Each collection session begins with an explicit toolbar Scan click while the target page is active;
  that action authorizes automatic Whiskey Empire tab selection.
- The target restaurant exposes a finite set of whiskey-list pages through links or controls that
  can be traced from the active Whiskey Empire list.
- "Currently viewed restaurant page" includes the whiskey list's validated Untappd source-provider
  pagination set, but not other restaurant pages, other sites, or unrelated browsing history.
- Loading another pagination page may make the same normal request that a visitor would trigger by
  following that pagination link; these requests occur in the background, and no collected content
  or interaction data is added to them.
- Distillery filtering is conditional because not every source row provides producer metadata.
- If multiple pour prices appear for one entry, they remain in original display text; a price is
  sortable only when one unambiguous comparable amount can be identified.
- Duplicate entries with the same normalized identity and source context are presented once; entries
  that differ materially remain separate.
- The enhanced data is session-only. Persisted preferences and cross-session caching are outside the
  initial feature scope.
- Accounts, analytics, recommendations, purchasing, inventory guarantees, and edits to restaurant
  content are outside scope.
