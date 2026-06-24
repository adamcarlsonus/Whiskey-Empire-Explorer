import { resetCriteria } from "../domain/select-entries.js";
import type { CollectionSession, ViewCriteria } from "../domain/types.js";
import { isExtensionRequest, type ExtensionResponse } from "../shared/messages.js";
import { activateWhiskeyTab, locateActiveList } from "./target-adapter.js";
import { Scanner } from "./scanner.js";
import { createPanel, focusPanel, PANEL_HOST_ID, type PanelView } from "../ui/panel.js";
import { updatePanel } from "../ui/render.js";

interface RuntimeState {
  scanner: Scanner;
  panel: PanelView | null;
  criteria: ViewCriteria;
  listenerInstalled: boolean;
}

declare global { interface Window { __whiskeyEmpireWest?: RuntimeState } }

const state: RuntimeState = window.__whiskeyEmpireWest ?? { scanner: new Scanner(), panel: null, criteria: resetCriteria(), listenerInstalled: false };
window.__whiskeyEmpireWest = state;

function render(session: Readonly<CollectionSession>): void {
  if (state.panel) updatePanel(state.panel, session, state.criteria);
}

function createOrFocusPanel(): PanelView {
  if (state.panel && document.contains(state.panel.host)) {
    focusPanel(state.panel);
    return state.panel;
  }
  const located = locateActiveList(document);
  const anchor = located.ok ? located.root : document.body.firstElementChild ?? document.body;
  state.panel = createPanel(anchor, {
    onCriteria: (criteria) => { state.criteria = criteria; render(state.scanner.current); },
    onReset: () => {
      state.criteria = resetCriteria();
      if (state.panel) {
        state.panel.query.value = "";
        state.panel.distillery.value = "";
        state.panel.sort.value = "source";
      }
      render(state.scanner.current);
    },
    onCancel: () => state.scanner.cancel(render),
    onRetry: () => { state.scanner.reset(); void start(); },
    onContinue: () => state.scanner.continuePartial(render),
    onClose: () => {
      state.scanner.cancel();
      state.scanner.reset();
      const fallback = located.ok ? located.root.querySelector<HTMLElement>("h1,h2,h3,[tabindex]") : null;
      state.panel?.host.remove();
      state.panel = null;
      if (fallback) {
        if (!fallback.hasAttribute("tabindex")) fallback.tabIndex = -1;
        fallback.focus();
      }
    }
  });
  return state.panel;
}

async function start(): Promise<ExtensionResponse> {
  await activateWhiskeyTab(document);
  createOrFocusPanel();
  void state.scanner.start(document, render);
  return { ok: true, snapshot: state.scanner.snapshot() };
}

if (!state.listenerInstalled) {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse: (response: ExtensionResponse) => void) => {
    if (!isExtensionRequest(message)) return false;
    if (message.type === "START_SCAN") void start().then(sendResponse).catch(() => sendResponse({
      ok: false,
      error: { code: "NOT_INJECTED", message: "The explorer could not start. Reload the page and try again." }
    }));
    else if (message.type === "GET_STATUS") sendResponse({ ok: true, snapshot: state.scanner.snapshot() });
    else {
      state.scanner.cancel(render);
      sendResponse({ ok: true, snapshot: state.scanner.snapshot() });
    }
    return message.type === "START_SCAN";
  });
  state.listenerInstalled = true;
}

if (document.getElementById(PANEL_HOST_ID)) state.panel?.heading.focus();
