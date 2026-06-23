# Live E2E Failure Matrix

The deterministic harness suite exercises all SC-007 classifications without modifying the
production manifest or bundle.

| Classification | First failed stage | Exit | Diagnostic discriminator | Cleanup |
|---|---|---:|---|---|
| Browser launch | `browser-launch` | 2 | Managed Chromium unavailable | No profile, or created profile removed |
| Extension install | `extension-availability` | 1 | Production extension not accepted | Browser closed; profile removed |
| Network/page | `live-page` | 2 | Restaurant page unreachable or redirected | Browser closed; profile removed |
| Tab selection | `whiskey-tab` | 1 | Whiskey Empire control unavailable | Browser closed; profile removed |
| Action/popup | `action-popup` | 1 | Default action or popup unavailable | Browser closed; profile removed |
| Injection/messaging | `scan-start` | 1 | Production popup did not acknowledge Scan | Browser closed; profile removed |
| Scanner | `scan-completion` | 1 | Unsupported, partial, failed, or empty scan | Browser closed; profile removed |
| Assertion | `search-assertion` | 1 | Search or sort evidence invalid | Browser closed; profile removed |

`npm run test:harness` passed the matrix, exit-classification, redaction, evidence-bound, and request-
provenance tests on 2026-06-21. A real earlier failure at `whiskey-tab` and another at `action-popup`
also produced stage-specific local reports and successful cleanup before the final passing run.
