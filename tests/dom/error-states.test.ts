import assert from "node:assert/strict";
import test from "node:test";
import type { CollectionSession } from "../../src/domain/types.js";
import { createPanel } from "../../src/ui/panel.js";
import { updatePanel } from "../../src/ui/render.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("presents unsupported and partial states without fabricated rows", async () => {
  const dom = await loadFixture("whiskey-page-1.html");
  const restore = installDomGlobals(dom);
  try {
    const root = document.querySelector("[data-whiskey-empire-list]")!;
    const panel = createPanel(root, { onCriteria() {}, onReset() {}, onCancel() {}, onRescan() {}, onClose() {} });
    const unsupported: CollectionSession = { sessionId: "x", status: "unsupported", pages: [], entries: [], skippedCandidates: 0, startedAt: 0, completedAt: 1, warning: null, error: { code: "UNSUPPORTED_STRUCTURE", message: "Unsupported page." } };
    updatePanel(panel, unsupported, { query: "", distillery: null, sort: "source" });
    assert.equal(panel.rescan.hidden, false);
    assert.equal(panel.body.childElementCount, 0);
    assert.equal(panel.warning.textContent, "Unsupported page.");
    updatePanel(panel, { ...unsupported, status: "partial", error: null, warning: { code: "PARTIAL_RESULTS", message: "Partial." } }, { query: "", distillery: null, sort: "source" });
    assert.equal(panel.rescan.hidden, false);
    assert.equal(panel.shadow.querySelector("#wew-retry"), null);
    assert.equal(panel.shadow.querySelector("#wew-continue"), null);
  } finally { restore(); }
});
