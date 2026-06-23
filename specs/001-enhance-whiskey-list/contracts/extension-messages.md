# Contract: Popup and Injected Content Script

Messages are local extension messages between the popup and the active tab. They are never sent to a
server and contain no whiskey data unless returned directly to the requesting popup as aggregate
status.

## START_SCAN

Sent after the popup verifies that the active tab URL is the exact supported drink-menu page and
programmatically injects the bundled script and stylesheet.

```text
request:  { type: "START_SCAN" }
response: { ok: true, snapshot: SessionSnapshot }
       or { ok: false, error: PublicScanError }
```

Idempotency: if a session is already scanning or ready, return its snapshot and focus the existing
panel. Do not create a second host or repeat page requests.

## GET_STATUS

```text
request:  { type: "GET_STATUS" }
response: { ok: true, snapshot: SessionSnapshot }
       or { ok: false, error: { code: "NOT_INJECTED", message: string } }
```

The popup may poll only while open. The injected panel remains the authoritative status surface.

## CANCEL_SCAN

```text
request:  { type: "CANCEL_SCAN" }
response: { ok: true, snapshot: SessionSnapshot }
```

Cancellation aborts the active request, prevents new pagination requests, retains the original page,
and moves the session to `cancelled`.

## SessionSnapshot

```text
{
  status: SessionStatus,
  pagesDiscovered: number,
  pagesProcessed: number,
  entriesCollected: number,
  skippedCandidates: number,
  warning: { code: string, message: string } | null,
  error: PublicScanError | null
}
```

The popup does not receive row text, search queries, or full entries.

## Injection errors

The popup maps failures into: unsupported URL, Whiskey Empire tab not active, injection denied, or
content script unavailable. It never requests broader permissions as recovery.
