<!--
Sync Impact Report
- Version change: template (unratified) -> 1.0.0
- Modified principles:
  - Placeholder Principle 1 -> I. Privacy by Construction (NON-NEGOTIABLE)
  - Placeholder Principle 2 -> II. Least Privilege
  - Placeholder Principle 3 -> III. Accessible Enhancement
  - Placeholder Principle 4 -> IV. Fast and Lightweight
  - Placeholder Principle 5 -> V. Explicit Processing Boundaries
- Added sections:
  - Technology and Scope Constraints
  - Development and Quality Gates
- Removed sections: none; placeholder sections were concretized
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ✅ reviewed; no changes required: .specify/templates/constitution-template.md
  - ✅ reviewed; no command templates present: .specify/templates/commands/*.md
  - ✅ reviewed; no changes required: AGENTS.md
- Follow-up TODOs: none
-->
# Whiskey Empire West Constitution

## Core Principles

### I. Privacy by Construction (NON-NEGOTIABLE)
The extension MUST NOT collect, transmit, sell, share, or persist browsing activity,
whiskey-list content, user interactions, or identifiers. All scraping, normalization,
preferences, and rendering MUST occur locally in the browser. Runtime analytics,
telemetry, tracking pixels, remote logging, and third-party data services are prohibited.
Any future proposal involving external communication or user data requires a major
constitution amendment before implementation. Privacy is a product guarantee, not a
configuration choice.

### II. Least Privilege
The manifest MUST request only the narrowest permissions and host access required to
enhance the supported whiskey-list page. Each permission MUST be tied to a documented,
user-visible requirement and reviewed whenever the manifest changes. Broad host patterns,
background execution, remote code, and permissions retained for hypothetical features are
prohibited. A feature that cannot justify its access MUST be redesigned or rejected.

### III. Accessible Enhancement
The original restaurant page MUST remain usable when the extension fails, is disabled, or
encounters unfamiliar markup. Added UI MUST support keyboard operation, visible focus,
semantic HTML, accessible names, sufficient contrast, zoom and reflow, and reduced-motion
preferences where animation exists. The extension MUST preserve the page's existing
meaning and MUST NOT remove or obscure essential content. Accessibility behavior MUST be
covered by acceptance criteria and manual or automated verification.

### IV. Fast and Lightweight
Enhancement MUST avoid perceptible disruption to page loading and interaction. Scraping
MUST be scoped to the smallest relevant DOM subtree, execute no more often than necessary,
and avoid repeated full-page scans. Rendering MUST batch DOM updates and prevent duplicate
injection. Dependencies, bundle size, observers, and persistent listeners MUST be justified
by measured need. Plans MUST define feature-specific performance budgets or measurable
latency targets, and verification MUST cover representative whiskey lists.

### V. Explicit Processing Boundaries
Page scraping, data normalization, and UI rendering MUST be separate modules with explicit
inputs and outputs. Scraping translates page markup into raw records; normalization turns
raw records into a stable domain model without DOM access; rendering consumes that model
without re-scraping or embedding parsing rules. Business logic MUST use maintainable
vanilla JavaScript or TypeScript and browser-native APIs by default. Module contracts and
normalization edge cases MUST be independently testable. This separation contains markup
changes, makes failures diagnosable, and keeps the small codebase easy to change.

## Technology and Scope Constraints

- The product is a small browser extension that progressively enhances an existing
  restaurant whiskey-list page; it MUST NOT become a replacement site or general-purpose
  browsing tool without a constitution amendment.
- Production logic MUST use vanilla JavaScript or TypeScript. A runtime framework or large
  dependency requires documented evidence that browser-native APIs cannot meet the need.
- Executable code and required assets MUST ship in the extension package. Remote code and
  runtime-loaded executable behavior are prohibited.
- Storage MUST be omitted unless a user-facing requirement needs it. If needed, stored data
  MUST be minimal, local, documented, user-clearable, and unrelated to browsing history.
- The extension MUST tolerate missing, malformed, reordered, and changed source markup by
  failing safely and leaving the host page functional.

## Development and Quality Gates

- Every feature specification MUST identify its local data flow, required permissions,
  accessibility behavior, failure behavior, and measurable performance outcome.
- Every implementation plan MUST document the scraper-normalizer-renderer boundaries and
  pass the Constitution Check before research and again after design.
- Tasks MUST include permission review, privacy/network verification, representative markup
  fixtures, normalization tests, rendering/accessibility verification, and performance
  validation when the feature touches those concerns.
- Changes to selectors or source-page interpretation MUST be verified against representative
  fixtures. Changes to the domain model MUST update its consumers and contract tests.
- Reviewers MUST reject unexplained network access, data collection, permission expansion,
  inaccessible interaction, unbounded DOM work, or coupling across processing boundaries.
  Any justified exception MUST appear in the plan's Complexity Tracking table.

## Governance

This constitution supersedes conflicting project practices and planning artifacts.
Amendments MUST be proposed in writing, explain their rationale and migration impact, update
dependent templates in the same change, and receive explicit maintainer approval.

Constitution versions follow semantic versioning: MAJOR for incompatible governance changes
or removed/redefined principles, MINOR for new principles or materially expanded obligations,
and PATCH for non-semantic clarification. Every feature plan and code review MUST verify
compliance. Reviewers MUST record unresolved violations in Complexity Tracking; undocumented
exceptions are not permitted. The current implementation plan is the runtime source of truth
for project structure, technologies, and commands, but it cannot override this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-20 | **Last Amended**: 2026-06-20
