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
  distilleryField: HTMLElement;
  distillery: HTMLInputElement;
  distilleryList: HTMLElement;
  sort: HTMLSelectElement;
  sortField: HTMLElement;
  sortButton: HTMLButtonElement;
  sortValue: HTMLElement;
  sortList: HTMLElement;
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
        <div class="actions">
          <a class="original-link nav-action" href="#" id="wew-original"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg><span>Original list</span></a>
          <button class="secondary nav-action" id="wew-close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg><span>Close</span></button>
        </div>
      </div>
      <p id="wew-status" class="status" role="status" aria-live="polite">Preparing scan…</p>
      <p id="wew-warning" class="warning" hidden></p>
      <div id="wew-controls" class="controls" hidden>
        <label>Search all visible text<input id="wew-query" type="search" autocomplete="off"></label>
        <div class="distillery-field" id="wew-distillery-field" hidden><label class="field-label" id="wew-distillery-label" for="wew-distillery">Distillery</label>
          <div class="combobox-shell"><input class="distillery-control" id="wew-distillery" type="search" autocomplete="off" placeholder="All distilleries" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-controls="wew-distillery-list" aria-labelledby="wew-distillery-label"><span class="chevron" aria-hidden="true"></span></div>
          <div class="sort-list distillery-list" id="wew-distillery-list" role="listbox" aria-labelledby="wew-distillery-label" hidden></div>
        </div>
        <div class="sort-field" id="wew-sort-field"><span class="field-label" id="wew-sort-label">Sort</span>
          <button class="sort-trigger" id="wew-sort-button" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="wew-sort-list" aria-labelledby="wew-sort-label wew-sort-value"><span id="wew-sort-value">Original order</span><span class="chevron" aria-hidden="true"></span></button>
          <div class="sort-list" id="wew-sort-list" role="listbox" aria-labelledby="wew-sort-label" hidden>
            <button class="sort-option" type="button" role="option" data-value="source" aria-selected="true">Original order</button>
            <button class="sort-option" type="button" role="option" data-value="name-asc" aria-selected="false">Name A–Z</button>
            <button class="sort-option" type="button" role="option" data-value="price-asc" aria-selected="false">Price low–high</button>
            <button class="sort-option" type="button" role="option" data-value="price-desc" aria-selected="false">Price high–low</button>
          </div>
          <select class="native-sort" id="wew-sort" tabindex="-1" aria-hidden="true"><option value="source">Original order</option><option value="name-asc">Name A–Z</option><option value="price-asc">Price low–high</option><option value="price-desc">Price high–low</option></select>
        </div>
        <button class="secondary nav-action" id="wew-reset" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg><span>Reset</span></button>
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
    controls: required("#wew-controls"), query: required("#wew-query"), distilleryField: required("#wew-distillery-field"),
    distillery: required("#wew-distillery"), distilleryList: required("#wew-distillery-list"),
    sort: required("#wew-sort"), sortField: required("#wew-sort-field"), sortButton: required("#wew-sort-button"),
    sortValue: required("#wew-sort-value"), sortList: required("#wew-sort-list"),
    reset: required("#wew-reset"), cancel: required("#wew-cancel"),
    retry: required("#wew-retry"), continueButton: required("#wew-continue"), close: required("#wew-close"),
    count: required("#wew-count"), body: required("#wew-body"), nameHeader: required("#wew-name-head"), priceHeader: required("#wew-price-head")
  };
  required<HTMLAnchorElement>("#wew-original").href = window.location.href;
  const emitCriteria = () => actions.onCriteria({ query: view.query.value, distillery: view.distillery.value || null, sort: view.sort.value as SortOrder });
  const distilleryOptions = () => [...view.distilleryList.querySelectorAll<HTMLButtonElement>(".distillery-option")];
  const filteredDistilleryOptions = () => {
    const query = view.distillery.value.trim().toLocaleLowerCase("en-US");
    const options = distilleryOptions();
    for (const option of options) {
      const value = option.dataset.value ?? "";
      option.hidden = Boolean(query && !value.toLocaleLowerCase("en-US").includes(query));
      option.setAttribute("aria-selected", String(Boolean(query) && value.toLocaleLowerCase("en-US") === query));
    }
    return options.filter((option) => !option.hidden);
  };
  const closeDistilleries = (restoreFocus = false) => {
    view.distilleryList.hidden = true;
    view.distillery.setAttribute("aria-expanded", "false");
    if (restoreFocus) view.distillery.focus();
  };
  const openDistilleries = () => {
    if (!filteredDistilleryOptions().length) return closeDistilleries();
    view.distilleryList.hidden = false;
    view.distillery.setAttribute("aria-expanded", "true");
  };
  const chooseDistillery = (option: HTMLButtonElement) => {
    view.distillery.value = option.dataset.value ?? "";
    closeDistilleries();
    emitCriteria();
    view.distillery.focus();
  };
  const sortOptions = () => [...view.sortList.querySelectorAll<HTMLButtonElement>(".sort-option")];
  const syncSort = () => {
    const selected = sortOptions().find((option) => option.dataset.value === view.sort.value) ?? sortOptions()[0];
    if (!selected) return;
    view.sortValue.textContent = selected.textContent;
    for (const option of sortOptions()) option.setAttribute("aria-selected", String(option === selected));
  };
  const closeSort = (restoreFocus = false) => {
    view.sortList.hidden = true;
    view.sortButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) view.sortButton.focus();
  };
  const openSort = () => {
    view.sortList.hidden = false;
    view.sortButton.setAttribute("aria-expanded", "true");
    (sortOptions().find((option) => option.getAttribute("aria-selected") === "true") ?? sortOptions()[0])?.focus();
  };
  const chooseSort = (option: HTMLButtonElement) => {
    view.sort.value = option.dataset.value ?? "source";
    syncSort();
    closeSort(true);
    emitCriteria();
  };
  view.query.addEventListener("input", emitCriteria);
  view.distillery.addEventListener("input", () => { emitCriteria(); openDistilleries(); });
  view.distillery.addEventListener("focus", openDistilleries);
  view.distillery.addEventListener("click", openDistilleries);
  view.distillery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openDistilleries();
      const options = filteredDistilleryOptions();
      options[event.key === "ArrowDown" ? 0 : options.length - 1]?.focus();
    } else if (event.key === "Escape") closeDistilleries();
  });
  view.distilleryList.addEventListener("click", (event) => {
    const option = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".distillery-option") : null;
    if (option) chooseDistillery(option);
  });
  view.distilleryList.addEventListener("keydown", (event) => {
    const option = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".distillery-option") : null;
    if (!option) return;
    const options = filteredDistilleryOptions();
    const index = options.indexOf(option);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      options[event.key === "Home" ? 0 : options.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeDistilleries(true);
    }
  });
  view.distilleryField.addEventListener("focusout", () => setTimeout(() => {
    if (!view.distilleryField.contains(view.shadow.activeElement)) closeDistilleries();
  }, 0));
  view.sort.addEventListener("change", () => { syncSort(); emitCriteria(); });
  view.sortButton.addEventListener("click", () => view.sortList.hidden ? openSort() : closeSort());
  view.sortButton.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); openSort(); }
    if (event.key === "Escape") closeSort();
  });
  for (const option of sortOptions()) {
    option.addEventListener("click", () => chooseSort(option));
    option.addEventListener("keydown", (event) => {
      const options = sortOptions();
      const index = options.indexOf(option);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        options[event.key === "Home" ? 0 : options.length - 1]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeSort(true);
      }
    });
  }
  view.sortField.addEventListener("focusout", () => setTimeout(() => {
    if (!view.sortField.contains(view.shadow.activeElement)) closeSort();
  }, 0));
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
