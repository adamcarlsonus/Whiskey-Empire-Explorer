import assert from "node:assert/strict";
import test from "node:test";
import { selectEntries } from "../../src/domain/select-entries.js";
import type { CollectionSession, WhiskeyEntry } from "../../src/domain/types.js";
import { createPanel } from "../../src/ui/panel.js";
import { updatePanel } from "../../src/ui/render.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("selects and sorts 1,000 entries within the 200 ms budget", () => {
  const entries: WhiskeyEntry[] = Array.from({ length: 1_000 }, (_, index) => ({
    id: String(index), sourceOrder: index, name: `Whiskey ${index}`, normalizedName: `whiskey ${index}`,
    displayPrice: `$${index + 1}`, sortablePriceCents: (index + 1) * 100,
    category: index % 2 ? "Rye" : "Bourbon", normalizedCategory: index % 2 ? "rye" : "bourbon",
    distillery: index % 2 ? "Beam" : "Buffalo Trace", type: null, region: null, proof: null, notes: null, searchText: `whiskey ${index}`,
    source: { pageUrl: "https://thewestsideblono.com/drink/drink-menu/", rowIndex: index, sourceHref: null }
  }));
  const start = performance.now();
  const result = selectEntries(entries, { query: "whiskey", distillery: "beam", sort: "price-desc" });
  const elapsed = performance.now() - start;
  assert.equal(result.total, 500);
  assert.ok(elapsed < 200, `selection took ${elapsed.toFixed(1)} ms`);
});

test("one criteria update performs one batched results replacement", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const root = document.querySelector("[data-whiskey-empire-list]")!;
    const panel = createPanel(root, { onCriteria() {}, onReset() {}, onCancel() {}, onRescan() {}, onClose() {} });
    let replacements = 0;
    const original = panel.body.replaceChildren.bind(panel.body);
    panel.body.replaceChildren = (...nodes: (Node | string)[]) => { replacements += 1; original(...nodes); };
    const entry: WhiskeyEntry = { id: "1", sourceOrder: 0, name: "A", normalizedName: "a", displayPrice: "$9", sortablePriceCents: 900, category: null, normalizedCategory: null, distillery: null, type: null, region: null, proof: null, notes: null, searchText: "a", source: { pageUrl: dom.window.location.href, rowIndex: 0, sourceHref: null } };
    const session: CollectionSession = { sessionId: "x", status: "ready", pages: [], entries: [entry], skippedCandidates: 0, startedAt: 0, completedAt: 1, warning: null, error: null };
    updatePanel(panel, session, { query: "", distillery: null, sort: "source" });
    assert.equal(replacements, 1);
  } finally { restore(); }
});
