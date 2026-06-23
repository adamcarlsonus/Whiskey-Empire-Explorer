# Data Model: Enhanced Whiskey List Browsing

All models are transient and local to one injected content-script instance. Domain models contain no
DOM nodes, Chrome API objects, or renderer state.

## RawWhiskeyRecord

Output of the target-page adapter before normalization.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `rawName` | string | yes | Visible candidate name; whitespace preserved until normalization. |
| `rawPrice` | string | yes | Visible price label; must be non-empty but need not be sortable. |
| `rawCategory` | string | no | Closest visible category heading or row field. |
| `rawBrand` | string | no | Visible brand when distinct from name. |
| `rawType` | string | no | Visible whiskey type. |
| `rawRegion` | string | no | Visible origin/region. |
| `rawProof` | string | no | Visible proof or ABV label. |
| `rawNotes` | string | no | Remaining description/notes. |
| `allVisibleText` | string | yes | Complete row text used to build the search corpus. |
| `sourcePageUrl` | string | yes | Canonical allowed restaurant or source-provider page URL. |
| `sourceRowIndex` | number | yes | Zero-based position within the extracted page. |

Validation: records missing a recognizable trimmed name or displayed price are rejected and counted
in `skippedCandidates`. Extraction MUST copy strings from the DOM and MUST NOT retain source nodes.

## WhiskeyEntry

Stable normalized domain record consumed by selection and rendering.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | string | yes | Deterministic key from normalized identity fields; not a user identifier. |
| `name` | string | yes | Trimmed display name. |
| `normalizedName` | string | yes | Case-folded, whitespace-normalized comparison value. |
| `displayPrice` | string | yes | Original meaningful price text. |
| `sortablePriceCents` | number \| null | yes | Integer cents only when one price is unambiguous. |
| `category` | string \| null | yes | Trimmed display category when present. |
| `normalizedCategory` | string \| null | yes | Case-folded filter key when present. |
| `brand` | string \| null | yes | Optional display value. |
| `type` | string \| null | yes | Optional display value. |
| `region` | string \| null | yes | Optional display value. |
| `proof` | string \| null | yes | Optional display value. |
| `notes` | string \| null | yes | Optional display text. |
| `searchText` | string | yes | Case-folded concatenation of all visible source text. |
| `source` | SourceReference | yes | Traceability to source page and row. |

Identity includes canonical source page and row position. Distinct source rows remain distinct even
when their normalized name, price, and category match.

## SourceReference

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `pageUrl` | string | yes | Allowed restaurant or validated source-provider pagination path. |
| `rowIndex` | number | yes | Non-negative integer. |
| `sourceHref` | string \| null | yes | Optional same-page or same-origin source link. |

## SourcePage

Tracks one discovered pagination page.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `url` | string | yes | Canonical allowed restaurant or source-provider URL. |
| `state` | PageState | yes | `discovered`, `loading`, `parsed`, or `failed`. |
| `entryCount` | number | yes | Accepted entries from this page; initially 0. |
| `skippedCandidates` | number | yes | Invalid candidate rows; initially 0. |
| `errorCode` | ScanErrorCode \| null | yes | Set only for `failed`. |

State transitions: `discovered -> loading -> parsed`; a request or parse problem yields
`loading -> failed`. A session-level Retry creates a new attempt rather than mutating a terminal page.

## CollectionSession

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `sessionId` | string | yes | Random in-memory correlation value; never transmitted or persisted. |
| `status` | SessionStatus | yes | See transitions below. |
| `pages` | SourcePage[] | yes | Unique by canonical URL; maximum 20. |
| `entries` | WhiskeyEntry[] | yes | Normalized source entries; target maximum 2,000. |
| `skippedCandidates` | number | yes | Sum across pages. |
| `startedAt` | number \| null | yes | Local monotonic timestamp for UI duration only. |
| `completedAt` | number \| null | yes | Set for terminal states. |
| `warning` | ScanWarning \| null | yes | Partial or safety-limit warning. |
| `error` | ScanError \| null | yes | Fatal unsupported/request/parse failure. |

Session transitions:

```text
idle -> validating -> scanning -> normalizing -> ready
                    |           |              -> partial
                    |           -> failed
                    -> unsupported
scanning -> cancelled
ready | partial | failed | unsupported | cancelled -> validating (explicit Retry)
```

Only one session may scan per tab. Repeated Start commands return the current snapshot.

## ViewCriteria

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `query` | string | yes | Raw visitor input; matching uses normalized form. |
| `category` | string \| null | yes | One normalized category or no filter. |
| `sort` | SortOrder | yes | `source`, `name-asc`, `price-asc`, or `price-desc`. |

Selection order: apply category, then text query, then stable sort. For either price sort,
`sortablePriceCents: null` always follows sortable values. Ties preserve normalized name then source
order. Reset restores empty query, no category, and source order.

## ScanError and ScanWarning

`ScanErrorCode` is one of `WRONG_URL`, `TAB_NOT_ACTIVE`, `UNSUPPORTED_STRUCTURE`, `REQUEST_FAILED`,
`PARSE_FAILED`, or `NO_VALID_ENTRIES`. Each error maps to safe user-facing copy and a Retry or Close
action. `ScanWarning` covers `PARTIAL_RESULTS`, `PAGE_LIMIT_REACHED`, and `SKIPPED_CANDIDATES` without
hiding valid entries.
