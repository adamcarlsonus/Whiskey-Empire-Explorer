# Quickstart: Validate the Live Extension Flow

## Prerequisites

- macOS with network access to the public Westside drink-menu page
- Project-supported Node.js and installed dependencies
- Playwright-managed Chromium installed explicitly

```bash
npm install
npx playwright install chromium
```

## Keep deterministic and live guarantees separate

Run the offline deterministic suite first:

```bash
npm run validate
```

This proves parsers, normalization, fixture extraction, UI behavior, accessibility contracts, and the
production build. It does not prove the current restaurant page or browser activation path.

## Run the live proof

```bash
npm run test:e2e:live
```

The command opens an isolated headed Chromium window. Do not select the Whiskey Empire tab or open
the extension manually; those actions are assertions in the scenario.

A passing run must report all of the following:

- the unchanged production extension was accepted by managed Chromium;
- the exact live page opened and Whiskey Empire was selected automatically;
- Chromium's browser-owned default action opened the production popup and Scan was clicked;
- the injected panel reached `Scan complete` with at least one result;
- a live-derived search returned a matching subset;
- price high-to-low became selected and exposed descending sort state;
- Chromium closed and its temporary profile was removed.

The process exits nonzero for unsupported, partial, empty, timed-out, blocked, or cleanup-failed runs.

## Inspect evidence

The command prints the report path under:

```text
test-results/live-extension/<run-id>/report.json
```

Interpret `outcome`, `lastSuccessfulStage`, `firstFailedStage`, `errors`, and `cleanup` using
[the command contract](contracts/live-test-command.md) and
[report schema](contracts/diagnostic-report.schema.json). Reports contain bounded status and control
evidence, not complete menu rows, HTML, cookies, headers, or network bodies. Only the newest ten are
retained locally.

## Seed diagnostic failures

- Temporarily disconnect networking before invocation: expect exit `2`, a blocked prerequisite or
  live-page stage, and successful cleanup.
- Temporarily rename the managed Chromium executable outside the runner: expect exit `2` at
  prerequisites, not a product-scan failure.
- Run with a deliberately invalid target URL supplied only through a harness test seam: expect exit
  `1` at live-page and a sanitized origin/structure summary.

Restore local setup after each seeded check. Never modify `manifest.json` or `dist/` to make a live
scenario pass.

## Repeatability check

Run the live command twice. Both runs must pass independently, show different profile identifiers,
leave no managed Chromium process or temporary profile behind, and produce distinct reports.
