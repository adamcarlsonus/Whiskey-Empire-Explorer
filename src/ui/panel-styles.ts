export const panelStyles = String.raw`
:host {
  --wew-bg: #000;
  --wew-surface: #2f2f2f;
  --wew-surface-hover: #424242;
  --wew-border: #424242;
  --wew-text: #f2f2f2;
  --wew-muted: #b4b4b4;
  --wew-focus: #8ab4f8;
  color-scheme: dark;
  display: block;
  font: 16px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  margin: 1rem 0;
}
* { box-sizing: border-box; }
.panel { background: var(--wew-bg); border: 1px solid var(--wew-border); border-radius: 18px; box-shadow: 0 18px 50px rgba(0, 0, 0, .35); color: var(--wew-text); padding: 1.25rem; }
.header, .controls, .actions { align-items: end; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: space-between; }
h2 { font-size: 1.35rem; letter-spacing: -.025em; margin: 0; }
label { display: grid; font-weight: 600; gap: .35rem; }
.field-label { font-weight: 600; }
input, select, button, a { font: inherit; }
input, select { background: var(--wew-surface); border: 1px solid var(--wew-border); border-radius: 10px; box-shadow: none; color: var(--wew-text); min-height: 2.75rem; padding: .55rem .75rem; transition: background-color .15s ease, border-color .15s ease; }
input::placeholder { color: var(--wew-muted); opacity: 1; }
input:hover, select:hover { background: var(--wew-surface-hover); }
select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--wew-muted) 50%), linear-gradient(135deg, var(--wew-muted) 50%, transparent 50%); background-position: calc(100% - 15px) 50%, calc(100% - 10px) 50%; background-repeat: no-repeat; background-size: 5px 5px, 5px 5px; cursor: pointer; padding-right: 2.35rem; }
.sort-field { display: grid; gap: .35rem; min-width: 12rem; position: relative; }
.sort-trigger { align-items: center; background: var(--wew-surface); border: 1px solid var(--wew-border); border-radius: 10px; box-shadow: none; color: var(--wew-text); display: flex; font-weight: 500; justify-content: space-between; min-width: 12rem; padding: .55rem .8rem; text-align: left; }
.sort-trigger:hover, .sort-trigger[aria-expanded="true"] { background: var(--wew-surface-hover); }
.chevron { border-bottom: 2px solid currentColor; border-right: 2px solid currentColor; height: .5rem; margin-left: 1rem; transform: rotate(45deg) translateY(-.15rem); transition: transform .15s ease; width: .5rem; }
.sort-trigger[aria-expanded="true"] .chevron { transform: rotate(225deg) translate(-.1rem, -.1rem); }
.sort-list { background: var(--wew-surface); border: 1px solid var(--wew-border); border-radius: 14px; box-shadow: 0 18px 45px rgba(0, 0, 0, .55); display: grid; gap: .2rem; left: 0; min-width: 100%; padding: .4rem; position: absolute; top: calc(100% + .4rem); z-index: 20; }
.sort-option { background: transparent; border: 0; border-radius: 9px; color: var(--wew-text); display: grid; font-weight: 500; gap: .55rem; grid-template-columns: 1rem 1fr; justify-items: start; min-height: 2.4rem; padding: .5rem .65rem; text-align: left; white-space: nowrap; }
.sort-option::before { content: ""; }
.sort-option[aria-selected="true"] { background: var(--wew-surface-hover); }
.sort-option[aria-selected="true"]::before { content: "✓"; font-weight: 800; }
.sort-option:hover, .sort-option:focus-visible { background: #525252; }
.native-sort { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
button, .original-link { border-radius: 10px; min-height: 2.5rem; padding: .5rem .75rem; }
button { background: var(--wew-text); border: 1px solid var(--wew-text); color: #0d0d0d; cursor: pointer; font-weight: 600; }
button:hover { background: #d9d9d9; border-color: #d9d9d9; }
.secondary { background: var(--wew-surface); border-color: var(--wew-border); color: var(--wew-text); }
.secondary:hover { background: var(--wew-surface-hover); border-color: var(--wew-surface-hover); }
.original-link { color: var(--wew-text); display: inline-flex; align-items: center; }
:focus-visible { outline: 3px solid var(--wew-focus); outline-offset: 2px; }
.status { color: var(--wew-muted); margin: .85rem 0; }
.warning, .error { background: #2b2118; border-left: 4px solid #f2a33c; border-radius: 6px; font-weight: 600; padding: .6rem .8rem; }
.error { background: #2d1719; border-color: #ff6b72; }
.results-wrap { max-width: 100%; }
table { border-collapse: collapse; width: 100%; }
.menu-list thead { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
.menu-list tbody { display: block; }
.menu-list tr { border-bottom: 1px solid var(--wew-border); display: grid; gap: .25rem .7rem; grid-template-columns: auto auto 1fr; padding: 1.2rem .25rem; }
.menu-list td { border: 0; padding: 0; text-align: left; vertical-align: top; }
.menu-list td[data-label="Name"] { font-size: 1.08rem; font-weight: 750; grid-column: 1 / -1; letter-spacing: .015em; text-transform: uppercase; }
.item-type { color: var(--wew-muted); font-style: italic; font-weight: 450; }
.menu-list td[data-label="Distillery"], .menu-list td[data-label="Proof"] { color: var(--wew-muted); }
.menu-list td[data-label="Distillery"]::before { content: "• "; margin-right: .35rem; }
.menu-list td[data-label="Notes"] { color: var(--wew-muted); grid-column: 1 / -1; }
.menu-list td[data-label="Price"] { align-items: center; display: grid; font-weight: 650; gap: .55rem; grid-column: 1 / -1; grid-template-columns: auto 1fr auto; margin-top: .6rem; }
.price-leader { border-bottom: 2px dotted var(--wew-border); min-width: 2rem; }
.price-value { white-space: nowrap; }
th button { background: transparent; border-color: transparent; color: var(--wew-text); padding: .25rem; }
.muted { color: var(--wew-muted); }
[hidden] { display: none !important; }
@media (max-width: 700px) {
  .menu-list tr { grid-template-columns: auto 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
`;
