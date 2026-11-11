import assert from "node:assert/strict";
import test from "node:test";
import type { CollectionSession } from "../../src/domain/types.js";
import { createPanel } from "../../src/ui/panel.js";
import { updatePanel } from "../../src/ui/render.js";
import { Scanner } from "../../src/content/scanner.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("missing menu shows VPN troubleshooting with rescan and no invented results", async () => {
  const dom = await loadFixture("unsupported-page.html");
  const restore = installDomGlobals(dom);
  try {
    let rescans = 0;
    const panel = createPanel(document.body.firstElementChild!, {
      onCriteria() {}, onReset() {}, onCancel() {}, onRescan() { rescans++; }, onClose() {}
    });
    const scanner = new Scanner();
    await scanner.start(document, session => updatePanel(panel, session, { query: "", distillery: null, sort: "source" }));
    assert.equal(scanner.current.error?.code, "TAB_NOT_ACTIVE");
    assert.equal(panel.warning.hidden, false);
    assert.match(panel.warning.textContent ?? "", /Untappd may block some VPN connections/);
    assert.equal(panel.status.textContent, "Menu unavailable for scanning.");
    assert.equal(panel.status.textContent?.includes("VPN"), false);
    assert.match(panel.warning.textContent ?? "", /reload the restaurant page/i);
    assert.equal(panel.body.childElementCount, 0);
    assert.equal(panel.rescan.hidden, false);
    panel.rescan.click();
    assert.equal(rescans, 1);
  } finally { restore(); }
});

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
