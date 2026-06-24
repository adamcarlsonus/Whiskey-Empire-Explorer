import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { installDomGlobals } from "../helpers/dom.js";

test("popup injects content, starts the scan, and closes after a successful handoff", async () => {
  const html = await readFile("src/popup/popup.html", "utf8");
  const dom = new JSDOM(html, { url: "chrome-extension://test/popup/popup.html", pretendToBeVisual: true });
  const restore = installDomGlobals(dom);
  const calls: string[] = [];
  let closed = false;
  dom.window.close = () => { closed = true; };
  const previousChrome = Reflect.get(globalThis, "chrome");
  Reflect.set(globalThis, "chrome", {
    tabs: {
      query: async () => [{ id: 7, url: "https://thewestsideblono.com/drink/drink-menu/" }],
      sendMessage: async (_tabId: number, message: { type: string }) => {
        calls.push(message.type);
        if (message.type === "GET_STATUS") throw new Error("not injected yet");
        return { ok: true, snapshot: { status: "scanning", pagesDiscovered: 1, pagesProcessed: 0, entriesCollected: 0, skippedCandidates: 0, warning: null, error: null } };
      }
    },
    scripting: { executeScript: async () => { calls.push("INJECT"); } }
  });
  try {
    await import("../../src/popup/popup.js");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const button = document.querySelector<HTMLButtonElement>("#scan")!;
    assert.equal(button.disabled, false);
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(calls.filter((call) => call !== "GET_STATUS"), ["INJECT", "START_SCAN"]);
    assert.equal(closed, true);
  } finally {
    dom.window.dispatchEvent(new dom.window.Event("unload"));
    if (previousChrome === undefined) Reflect.deleteProperty(globalThis, "chrome"); else Reflect.set(globalThis, "chrome", previousChrome);
    restore();
  }
});
