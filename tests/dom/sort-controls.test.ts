import assert from "node:assert/strict";
import test from "node:test";
import type { CollectionSession } from "../../src/domain/types.js";
import { createPanel } from "../../src/ui/panel.js";
import { updatePanel } from "../../src/ui/render.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("exposes sort state and non-comparable price text", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const root = document.querySelector("[data-whiskey-empire-list]")!;
    const panel = createPanel(root, { onCriteria() {}, onReset() {}, onCancel() {}, onRetry() {}, onContinue() {}, onClose() {} });
    const session = { sessionId: "x", status: "ready", pages: [], skippedCandidates: 0, startedAt: 0, completedAt: 1, warning: null, error: null, entries: [{ id: "1", sourceOrder: 0, name: "Range", normalizedName: "range", displayPrice: "$8-$12", sortablePriceCents: null, category: null, normalizedCategory: null, distillery: null, type: null, region: null, proof: null, notes: null, searchText: "range", source: { pageUrl: dom.window.location.href, rowIndex: 0, sourceHref: null } }] } satisfies CollectionSession;
    updatePanel(panel, session, { query: "", distillery: null, sort: "price-desc" });
    assert.equal(panel.priceHeader.getAttribute("aria-sort"), "descending");
    assert.match(panel.body.textContent ?? "", /not comparable/);
  } finally { restore(); }
});
