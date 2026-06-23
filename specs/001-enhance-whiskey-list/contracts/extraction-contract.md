# Contract: Target Adapter and Normalizer

## TargetAdapter

The Westside-specific adapter is the only module allowed to know page selectors or pagination markup.

```text
locateActiveList(document) ->
  { ok: true, root: Element, canonicalPageUrl: URL }
  | { ok: false, code: "TAB_NOT_ACTIVE" | "UNSUPPORTED_STRUCTURE" }

extractPage(document, pageUrl) -> {
  records: RawWhiskeyRecord[],
  candidateCount: number,
  skippedCandidates: number,
  paginationUrls: URL[],
  advertisedTotal: number | null
}
```

Rules:

- Scope all row and pagination queries to the active Whiskey Empire root.
- Prefer semantic signals and repeated structure; keep fallback selectors together in the adapter.
- Treat reordered fields, wrapper changes, and moved elements as supported only while semantic labels,
  the selected tab relationship, and repeated row roles still identify the region and valid rows.
- Return strings and source positions only; never return or retain DOM nodes.
- Resolve pagination URLs, strip fragments, require HTTPS, and allow only the expected restaurant
  path or numeric Untappd location/theme/items source-provider path with a numeric section ID.
- Parse the source's advertised total when present so traversal can detect silent incompleteness.
- Never execute scripts from fetched documents or insert fetched HTML into the live page.
- An unsupported confidence result is an error, not an empty successful extraction.

## normalizeRecord

```text
normalizeRecord(raw: RawWhiskeyRecord) ->
  { ok: true, entry: WhiskeyEntry }
  | { ok: false, reason: "MISSING_NAME" | "MISSING_PRICE" }
```

Rules:

- Preserve meaningful display strings.
- Collapse whitespace and case-fold separate comparison strings.
- Include every visible source string in `searchText`.
- Parse cents only when exactly one comparable dollar amount is represented.
- Treat USD as the only comparable currency in v1. Accept whole-dollar and decimal amounts with an
  optional `$`, comma thousands separators, and surrounding labels; ranges, multiple amounts, other
  currencies, comma decimals, and unrelated numbers produce a null comparable price.
- Never infer missing category, proof, region, or brand.

## parsePrice

```text
parsePrice(displayPrice: string) -> {
  displayPrice: string,
  sortablePriceCents: number | null
}
```

Required fixtures include whole-dollar values, decimals, currency symbols, comma formatting, price
ranges, multiple pour sizes/prices, missing numeric values, and unrelated numbers such as proof.

## selectEntries

```text
selectEntries(entries: readonly WhiskeyEntry[], criteria: ViewCriteria) -> WhiskeyEntry[]
```

The function is pure, does not mutate input, applies category then query then stable sort, and always
places null sortable prices after numeric prices.
