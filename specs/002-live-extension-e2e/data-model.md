# Data Model: Live Extension End-to-End Testing

## LiveTestRun

One invocation of the live command.

| Field | Type | Validation |
|-------|------|------------|
| `schemaVersion` | literal `1` | Required |
| `runId` | string | UTC timestamp plus random suffix; unique locally |
| `startedAt`, `finishedAt` | ISO-8601 strings | `finishedAt >= startedAt` |
| `targetUrl` | URL string | Exact configured Westside HTTPS URL |
| `platform` | string | Must be `darwin` for v1 |
| `outcome` | `passed \| failed \| blocked` | `passed` only when every assertion stage passed |
| `lastSuccessfulStage` | StageName or `null` | Must name the latest passed stage |
| `firstFailedStage` | StageName or `null` | Required unless outcome is `passed` |
| `browser` | BrowserIdentity | Required after browser discovery |
| `extension` | ProductionExtensionIdentity | Required after extension acceptance |
| `stages` | TestStage[] | Ordered, nonempty, unique terminal record per attempted stage |
| `observations` | Observations | Sanitized public UI evidence only |
| `errors` | DiagnosticError[] | Maximum 20 |
| `cleanup` | CleanupOutcome | Always present |

## TestStage

| Field | Type | Validation |
|-------|------|------------|
| `name` | StageName | One of the ordered stage names below |
| `status` | `pending \| running \| passed \| failed \| blocked \| skipped` | Terminal at report write except interrupted `running`, which becomes `failed` |
| `startedAt`, `finishedAt` | ISO-8601 or `null` | Required for attempted stages |
| `deadlineMs` | positive integer | Less than the global 120-second budget |
| `summary` | string | Sanitized and at most 500 characters |

Ordered `StageName` values:

1. `prerequisites`
2. `build-identity`
3. `browser-launch`
4. `extension-availability`
5. `live-page`
6. `whiskey-tab`
7. `action-popup`
8. `scan-start`
9. `scan-completion`
10. `search-assertion`
11. `sort-assertion`
12. `cleanup`

Only the current stage may be `running`. A failed or blocked stage skips later work stages and moves
directly to cleanup. A run becomes `passed` only after `sort-assertion` and cleanup both pass.

## BrowserIdentity

| Field | Type | Validation |
|-------|------|------------|
| `provider` | literal `playwright` | Required |
| `browserName` | literal `chromium` | Required |
| `version` | string | Nonempty |
| `headless` | boolean | Recorded; headed is the expected first choice |
| `profileId` | string | Random identifier only; never persist the temporary path |

## ProductionExtensionIdentity

| Field | Type | Validation |
|-------|------|------------|
| `id` | string | Browser-observed extension ID |
| `name`, `version` | string | Must match source and built manifests |
| `manifestVersion` | literal `3` | Required |
| `permissions` | string[] | Exact set equality with source and built production manifests |
| `hostPermissions` | string[] | Exact set equality; expected empty |
| `buildDigest` | string | SHA-256 over stable relative paths and bytes in `dist/` |

## Observations

Stores proof without retaining inventory.

- `currentUrl`, `pageTitle`, and up to 20 distinct frame origins.
- Up to 20 document-initiated request origins, the count of direct harness requests, and an
  `unexpectedHarnessRequests` count that must be zero for a passing run.
- Whiskey tab accessible name, role/selector description, frame origin, selected-state evidence, and
  the positive total advertised by the source list.
- Popup URL origin, visible Scan label, enabled state, acknowledgement status, and status text.
- Panel presence, final status text, positive result count, search query token length, filtered count,
  selected sort value, and observed `aria-sort`.
- On failure only, up to 50 relevant visible-element summaries containing tag, role, accessible-name
  snippet, and state attributes. No `innerHTML`, arbitrary body text, or whiskey row values.

## DiagnosticError

| Field | Type | Validation |
|-------|------|------------|
| `source` | `runner \| browser \| page \| popup \| network` | Required |
| `stage` | StageName | Required |
| `message` | string | Sanitized, maximum 1,000 characters |
| `urlOrigin` | string or `null` | Origin only; query and fragment removed |

Secrets, cookies, authorization values, request/response bodies, filesystem profile paths, and stack
traces outside repository-owned runner frames are excluded.

## CleanupOutcome

| Field | Type | Validation |
|-------|------|------------|
| `browserClosed` | boolean | Must be true for a passing run |
| `profileRemoved` | boolean | Must be true for a passing run |
| `finishedAt` | ISO-8601 string | Always present |
| `message` | string | Bounded cleanup result |

Cleanup is idempotent: repeated calls cannot recreate state or overwrite an earlier cleanup failure.
