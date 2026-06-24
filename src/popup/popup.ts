import { isSupportedUrl } from "../shared/target.js";
import type { ExtensionRequest, ExtensionResponse, SessionSnapshot } from "../shared/messages.js";

const scanButton = document.querySelector<HTMLButtonElement>("#scan");
const guidance = document.querySelector<HTMLElement>("#guidance");
const status = document.querySelector<HTMLElement>("#status");
let activeTabId: number | null = null;
let pollId: number | null = null;

function setStatus(message: string): void { if (status) status.textContent = message; }

function snapshotText(snapshot: SessionSnapshot): string {
  if (snapshot.error) return snapshot.error.message;
  const prefix = snapshot.status === "ready" ? "Complete" : snapshot.status === "partial" ? "Partial" : snapshot.status;
  return `${prefix}: ${snapshot.pagesProcessed}/${snapshot.pagesDiscovered} pages, ${snapshot.entriesCollected} entries.`;
}

async function send(message: ExtensionRequest): Promise<ExtensionResponse> {
  if (activeTabId === null) return { ok: false, error: { code: "NOT_INJECTED", message: "No active tab is available." } };
  return await new Promise<ExtensionResponse>((resolve) => {
    let settled = false;
    const finish = (response: ExtensionResponse) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(response);
    };
    const timeoutId = window.setTimeout(() => finish({
      ok: false,
      error: { code: "NOT_INJECTED", message: "The page did not answer the scan request. Reload the page and try again." }
    }), 10_000);
    void (chrome.tabs.sendMessage(activeTabId!, message) as Promise<ExtensionResponse>)
      .then(finish)
      .catch(() => finish({ ok: false, error: { code: "NOT_INJECTED", message: "The panel is not available in this tab." } }));
  });
}

async function poll(): Promise<void> {
  const response = await send({ type: "GET_STATUS" });
  if (response.ok) setStatus(snapshotText(response.snapshot));
}

async function initialize(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab?.id ?? null;
    const supported = Boolean(tab?.url && isSupportedUrl(tab.url));
    if (scanButton) scanButton.disabled = !supported;
    if (guidance) guidance.textContent = supported ? "Scan will open the Whiskey Empire collection automatically." : "Open the Westside drink menu to use this extension.";
    if (supported) {
      await poll();
      pollId = window.setInterval(() => void poll(), 750);
    }
  } catch {
    if (scanButton) scanButton.disabled = true;
    setStatus("Chrome could not inspect the active tab. Reload the page and reopen this popup.");
  }
}

scanButton?.addEventListener("click", async () => {
  if (activeTabId === null) return;
  scanButton.disabled = true;
  setStatus("Opening the explorer…");
  try {
    await chrome.scripting.executeScript({ target: { tabId: activeTabId }, files: ["content.js"] });
    const response = await send({ type: "START_SCAN" });
    setStatus(response.ok ? snapshotText(response.snapshot) : response.error.message);
  } catch {
    setStatus("Chrome could not open the explorer on this page. No broader permission was requested.");
  } finally {
    scanButton.disabled = false;
  }
});

window.addEventListener("unload", () => { if (pollId !== null) window.clearInterval(pollId); });
void initialize();
