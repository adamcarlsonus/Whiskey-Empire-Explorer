import { panelStyles } from "./panel-styles.js";
import type { SortOrder, ViewCriteria } from "../domain/types.js";

export const PANEL_HOST_ID = "whiskey-empire-west-panel";

export interface PanelActions {
  onCriteria: (criteria: ViewCriteria) => void;
  onReset: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onContinue: () => void;
  onClose: () => void;
}

export interface PanelView {
  host: HTMLElement;
  shadow: ShadowRoot;
  heading: HTMLElement;
  status: HTMLElement;
  warning: HTMLElement;
  controls: HTMLElement;
  query: HTMLInputElement;
  distillery: HTMLInputElement;
  distilleryOptions: HTMLDataListElement;
  sort: HTMLSelectElement;
  reset: HTMLButtonElement;
  cancel: HTMLButtonElement;
  retry: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  close: HTMLButtonElement;
  count: HTMLElement;
  body: HTMLTableSectionElement;
  nameHeader: HTMLTableCellElement;
  priceHeader: HTMLTableCellElement;
}

export function focusPanel(view: PanelView): void { view.heading.focus(); }

export function createPanel(before: Element, actions: PanelActions): PanelView {
  const existing = document.getElementById(PANEL_HOST_ID) as HTMLElement | null;
  if (existing?.shadowRoot) {
    const heading = existing.shadowRoot.querySelector<HTMLElement>("#wew-heading");
    heading?.focus();
    throw Object.assign(new Error("Panel already exists"), { code: "PANEL_EXISTS" });
  }
  const host = document.createElement("section");
  host.id = PANEL_HOST_ID;
  host.setAttribute("aria-label", "Enhanced whiskey list");
  before.parentElement?.insertBefore(host, before);
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${panelStyles}</style>
    <section class="panel" aria-labelledby="wew-heading">
      <div class="header"><h2 id="wew-heading" tabindex="-1">Whiskey Empire Explorer</h2>
        <div class="actions"><a class="original-link" href="#" id="wew-original">Original list</a><button class="secondary" id="wew-close" type="button">Close</button></div>
      </div>
      <p id="wew-status" class="status" role="status" aria-live="polite">Preparing scan…</p>
      <p id="wew-warning" class="warning" hidden></p>
      <div id="wew-controls" class="controls" hidden>
        <label>Search all visible text<input id="wew-query" type="search" autocomplete="off"></label>
        <label id="wew-distillery-label" hidden>Distillery<input id="wew-distillery" type="search" list="wew-distillery-options" autocomplete="off" placeholder="All distilleries"><datalist id="wew-distillery-options"></datalist></label>
        <label>Sort<select id="wew-sort"><option value="source">Original order</option><option value="name-asc">Name A–Z</option><option value="price-asc">Price low–high</option><option value="price-desc">Price high–low</option></select></label>
        <button class="secondary" id="wew-reset" type="button">Reset</button>
      </div>
      <div class="actions"><button id="wew-cancel" type="button">Cancel scan</button><button id="wew-retry" type="button" hidden>Retry</button><button id="wew-continue" type="button" hidden>Continue with partial results</button></div>
      <p id="wew-count" aria-live="polite"></p>
      <div class="results-wrap"><table class="menu-list" hidden id="wew-table"><thead><tr><th id="wew-name-head" scope="col">Name</th><th scope="col">Proof</th><th scope="col">Distillery</th><th scope="col">Notes</th><th id="wew-price-head" scope="col">Price</th></tr></thead><tbody id="wew-body"></tbody></table></div>
    </section>`;

  const required = <T extends Element>(selector: string): T => {
    const element = shadow.querySelector<T>(selector);
    if (!element) throw new Error(`Missing panel element: ${selector}`);
    return element;
  };
  const view: PanelView = {
    host, shadow,
    heading: required("#wew-heading"), status: required("#wew-status"), warning: required("#wew-warning"),
    controls: required("#wew-controls"), query: required("#wew-query"), distillery: required("#wew-distillery"), distilleryOptions: required("#wew-distillery-options"),
    sort: required("#wew-sort"), reset: required("#wew-reset"), cancel: required("#wew-cancel"),
    retry: required("#wew-retry"), continueButton: required("#wew-continue"), close: required("#wew-close"),
    count: required("#wew-count"), body: required("#wew-body"), nameHeader: required("#wew-name-head"), priceHeader: required("#wew-price-head")
  };
  required<HTMLAnchorElement>("#wew-original").href = window.location.href;
  const emitCriteria = () => actions.onCriteria({ query: view.query.value, distillery: view.distillery.value || null, sort: view.sort.value as SortOrder });
  view.query.addEventListener("input", emitCriteria);
  view.distillery.addEventListener("input", emitCriteria);
  view.sort.addEventListener("change", emitCriteria);
  view.reset.addEventListener("click", actions.onReset);
  view.cancel.addEventListener("click", actions.onCancel);
  view.retry.addEventListener("click", actions.onRetry);
  view.continueButton.addEventListener("click", actions.onContinue);
  view.close.addEventListener("click", actions.onClose);
  required<HTMLAnchorElement>("#wew-original").addEventListener("click", (event) => {
    event.preventDefault();
    before.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    (before.querySelector<HTMLElement>("h1,h2,h3,[tabindex]") ?? before as HTMLElement).focus?.();
  });
  queueMicrotask(() => focusPanel(view));
  return view;
}
