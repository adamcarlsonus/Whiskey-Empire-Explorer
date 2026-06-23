import assert from "node:assert/strict";
import test from "node:test";
import { PANEL_HOST_ID } from "../../src/ui/panel.js";
import { installDomGlobals, loadFixture } from "../helpers/dom.js";

test("START_SCAN always responds and shows an explicit error for an embedded menu", async () => {
  const dom = await loadFixture("whiskey-iframe.html");
  const restore = installDomGlobals(dom);
  const previousChrome = Reflect.get(globalThis, "chrome");
  let listener: ((message: unknown, sender: unknown, reply: (response: unknown) => void) => boolean) | null = null;
  Reflect.set(globalThis, "chrome", { runtime: { onMessage: { addListener: (value: typeof listener) => { listener = value; } } } });
  try {
    await import("../../src/content/bootstrap.js");
    assert.ok(listener);
    const response = await Promise.race([
      new Promise<unknown>((resolve) => listener!({ type: "START_SCAN" }, {}, resolve)),
      new Promise((_, reject) => setTimeout(() => reject(new Error("START_SCAN did not respond")), 500))
    ]) as { ok: boolean; snapshot?: { status: string; error: { code: string } | null } };
    assert.equal(response.ok, true);
    assert.equal(response.snapshot?.status, "unsupported");
    assert.equal(response.snapshot?.error?.code, "UNSUPPORTED_STRUCTURE");
    const host = document.getElementById(PANEL_HOST_ID);
    assert.ok(host?.shadowRoot);
    assert.match(host.shadowRoot.querySelector("[role=status]")?.textContent ?? "", /not supported/i);
  } finally {
    if (previousChrome === undefined) Reflect.deleteProperty(globalThis, "chrome"); else Reflect.set(globalThis, "chrome", previousChrome);
    restore();
  }
});
