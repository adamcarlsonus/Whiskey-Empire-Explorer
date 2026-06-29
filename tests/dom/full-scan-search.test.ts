import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecords } from "../../src/domain/normalize.js";
import type { CollectionSession } from "../../src/domain/types.js";
import { isExtensionRequest } from "../../src/shared/messages.js";
import { createPanel, PANEL_HOST_ID } from "../../src/ui/panel.js";
import { updatePanel } from "../../src/ui/render.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("injects one panel above source and renders safe searchable results", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const root = dom.window.document.querySelector("[data-whiskey-empire-list]")!;
    const normalized = normalizeRecords([{ rawName: "<b>Safe Name</b> #BOU Bourbon", rawPrice: "$9", rawDistillery: "anCnoc", rawType: "#BOU Bourbon", rawProof: "46% ABV", allVisibleText: "Safe Name #BOU Bourbon anCnoc 46% ABV Kentucky", sourcePageUrl: dom.window.location.href, sourceRowIndex: 0 }]);
    const panel = createPanel(root, { onCriteria() {}, onReset() {}, onCancel() {}, onRescan() {}, onClose() {} });
    const session: CollectionSession = { sessionId: "test", status: "ready", pages: [], entries: normalized.entries, skippedCandidates: 0, startedAt: 0, completedAt: 1, warning: null, error: null };
    updatePanel(panel, session, { query: "safe", distillery: null, sort: "source" });
    assert.equal(dom.window.document.querySelectorAll(`#${PANEL_HOST_ID}`).length, 1);
    assert.equal(panel.host.nextElementSibling, root);
    assert.equal(panel.body.textContent?.includes("<b>Safe Name</b>"), true);
    assert.equal(panel.body.querySelector("b"), null);
    assert.deepEqual([...panel.shadow.querySelectorAll("th")].map((cell) => cell.textContent), ["Name", "Proof", "Distillery", "Notes", "Search", "Price"]);
    assert.equal(panel.body.querySelector('[data-label="Name"]')?.textContent, "<b>Safe Name</b> Bourbon");
    assert.equal(panel.body.querySelector('[data-label="Proof"]')?.textContent, "46% ABV");
    assert.equal(panel.body.querySelector('[data-label="Distillery"]')?.textContent, "anCnoc");
    const googleLink = panel.body.querySelector<HTMLAnchorElement>(".product-search")!;
    assert.equal(googleLink.textContent, "Google Search");
    assert.equal(new URL(googleLink.href).searchParams.get("q"), "<b>Safe Name</b> Bourbon");
    assert.equal(googleLink.target, "_blank");
    assert.equal(googleLink.rel, "noopener noreferrer");
    assert.equal(panel.body.querySelector(".price-value")?.textContent, "$9");
    assert.equal(isExtensionRequest({ type: "START_SCAN" }), true);
  } finally { restore(); }
});
