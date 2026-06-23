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
    const normalized = normalizeRecords([{ rawName: "<b>Safe Name</b>", rawPrice: "$9", rawDistillery: "anCnoc", rawProof: "46% ABV", allVisibleText: "Safe Name anCnoc 46% ABV Kentucky", sourcePageUrl: dom.window.location.href, sourceRowIndex: 0 }]);
    const panel = createPanel(root, { onCriteria() {}, onReset() {}, onCancel() {}, onRetry() {}, onContinue() {}, onClose() {} });
    const session: CollectionSession = { sessionId: "test", status: "ready", pages: [], entries: normalized.entries, skippedCandidates: 0, startedAt: 0, completedAt: 1, warning: null, error: null };
    updatePanel(panel, session, { query: "safe", distillery: null, sort: "source" });
    assert.equal(dom.window.document.querySelectorAll(`#${PANEL_HOST_ID}`).length, 1);
    assert.equal(panel.host.nextElementSibling, root);
    assert.equal(panel.body.textContent?.includes("<b>Safe Name</b>"), true);
    assert.equal(panel.body.querySelector("b"), null);
    assert.deepEqual([...panel.shadow.querySelectorAll("th")].map((cell) => cell.textContent), ["Name", "Distillery", "Proof", "Price", "Notes"]);
    assert.deepEqual([...panel.body.querySelectorAll("td")].map((cell) => cell.textContent), ["<b>Safe Name</b>", "anCnoc", "46% ABV", "$9", "—"]);
    assert.equal(isExtensionRequest({ type: "START_SCAN" }), true);
  } finally { restore(); }
});
