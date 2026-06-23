# Live E2E Repeatability

Two consecutive production-path runs passed on 2026-06-21.

| Run ID | Profile ID | Result count | Permissions | Cleanup |
|---|---|---:|---|---|
| `2026-06-21T18-00-57-924Z-0cb4394d` | `a35da073-5520-4d48-b8ab-45cd1071914d` | 100 | `activeTab`, `scripting`; no host permissions | Browser closed; profile removed |
| `2026-06-21T18-01-12-100Z-2942252d` | `a0da0ed7-f373-4951-b5a6-944937df0ad5` | 100 | `activeTab`, `scripting`; no host permissions | Browser closed; profile removed |

The run IDs and profile IDs are distinct, both reports are independently attributable, both builds
have the same production permission surface, and both cleanup records are complete. Each run also
observed six live-derived search matches, `price-desc`, and descending `aria-sort`.

A subsequent seeded `browser-launch` prerequisite failure exited `2`, identified `browser-launch` as
the first failed stage, wrote a local blocked report, and required no browser/profile cleanup.
