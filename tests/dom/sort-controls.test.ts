import assert from "node:assert/strict";
import test from "node:test";
import type { CollectionSession, ViewCriteria } from "../../src/domain/types.js";
import { createPanel } from "../../src/ui/panel.js";
import { updatePanel } from "../../src/ui/render.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("exposes sort state and non-comparable price text", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const root = document.querySelector("[data-whiskey-empire-list]")!;
    let selectedCriteria: ViewCriteria | null = null;
    const panel = createPanel(root, { onCriteria(criteria) { selectedCriteria = criteria; }, onReset() {}, onCancel() {}, onRescan() {}, onClose() {} });
    const session = { sessionId: "x", status: "ready", pages: [], skippedCandidates: 0, startedAt: 0, completedAt: 1, warning: null, error: null, entries: [{ id: "1", sourceOrder: 0, name: "Range", normalizedName: "range", displayPrice: "$8-$12", sortablePriceCents: null, category: null, normalizedCategory: null, distillery: null, type: null, region: null, proof: null, notes: null, searchText: "range", source: { pageUrl: dom.window.location.href, rowIndex: 0, sourceHref: null } }] } satisfies CollectionSession;
    updatePanel(panel, session, { query: "", distillery: null, sort: "price-desc" });
    assert.equal(panel.priceHeader.getAttribute("aria-sort"), "descending");
    assert.equal(panel.sortValue.textContent, "Price high–low");
    assert.equal(panel.sortList.querySelector('[data-value="price-desc"]')?.getAttribute("aria-selected"), "true");
    panel.sortButton.click();
    assert.equal(panel.sortList.hidden, false);
    assert.equal(panel.sortButton.getAttribute("aria-expanded"), "true");
    panel.sortList.querySelector<HTMLButtonElement>('[data-value="price-asc"]')?.click();
    assert.equal(panel.sort.value, "price-asc");
    assert.equal(panel.sortValue.textContent, "Price low–high");
    assert.ok(selectedCriteria);
    assert.equal((selectedCriteria as ViewCriteria).sort, "price-asc");
    assert.equal(panel.sortList.hidden, true);
    assert.match(panel.body.textContent ?? "", /not comparable/);
  } finally { restore(); }
});
