export const panelStyles = String.raw`
:host { color-scheme: light; display: block; font: 16px/1.45 system-ui, sans-serif; margin: 1rem 0; }
* { box-sizing: border-box; }
.panel { background: #fffaf2; border: 3px solid #5a2e1b; border-radius: 10px; color: #21150f; padding: 1rem; }
.header, .controls, .actions { align-items: end; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: space-between; }
h2 { margin: 0; }
label { display: grid; font-weight: 700; gap: .25rem; }
.field-label { font-weight: 700; }
input, select, button, a { font: inherit; }
input, select { background-color: #fff; border: 1px solid #8b7569; border-radius: 8px; box-shadow: 0 1px 2px rgba(33, 21, 15, .08); min-height: 2.5rem; padding: .45rem .7rem; transition: border-color .15s ease, box-shadow .15s ease; }
input:hover, select:hover { border-color: #6b351d; }
select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, #5a2e1b 50%), linear-gradient(135deg, #5a2e1b 50%, transparent 50%); background-position: calc(100% - 15px) 50%, calc(100% - 10px) 50%; background-repeat: no-repeat; background-size: 5px 5px, 5px 5px; cursor: pointer; padding-right: 2.35rem; }
.sort-field { display: grid; gap: .25rem; min-width: 12rem; position: relative; }
.sort-trigger { align-items: center; background: #fff; border: 1px solid #8b7569; border-radius: 9px; box-shadow: 0 1px 2px rgba(33, 21, 15, .08); color: #21150f; display: flex; font-weight: 600; justify-content: space-between; min-width: 12rem; padding: .45rem .75rem; text-align: left; }
.sort-trigger:hover, .sort-trigger[aria-expanded="true"] { background: #fffdf9; border-color: #6b351d; }
.chevron { border-bottom: 2px solid currentColor; border-right: 2px solid currentColor; height: .55rem; margin-left: 1rem; transform: rotate(45deg) translateY(-.15rem); transition: transform .15s ease; width: .55rem; }
.sort-trigger[aria-expanded="true"] .chevron { transform: rotate(225deg) translate(-.1rem, -.1rem); }
.sort-list { background: #fff; border: 1px solid #d6c9c0; border-radius: 12px; box-shadow: 0 14px 35px rgba(45, 25, 15, .2), 0 3px 8px rgba(45, 25, 15, .12); display: grid; gap: .2rem; left: 0; min-width: 100%; padding: .4rem; position: absolute; top: calc(100% + .35rem); z-index: 20; }
.sort-option { background: transparent; border: 0; border-radius: 8px; color: #21150f; display: grid; font-weight: 600; gap: .55rem; grid-template-columns: 1rem 1fr; justify-items: start; min-height: 2.35rem; padding: .45rem .65rem; text-align: left; white-space: nowrap; }
.sort-option::before { content: ""; }
.sort-option[aria-selected="true"] { background: #f2e5d8; color: #4a2415; }
.sort-option[aria-selected="true"]::before { content: "✓"; font-weight: 900; }
.sort-option:hover, .sort-option:focus-visible { background: #6b351d; color: #fff; }
.native-sort { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
button, .original-link { border-radius: 5px; min-height: 2.5rem; padding: .45rem .7rem; }
button { background: #6b351d; border: 2px solid #6b351d; color: #fff; cursor: pointer; font-weight: 700; }
.secondary { background: transparent; color: #4a2415; }
:focus-visible { outline: 3px solid #006ddb; outline-offset: 2px; }
.status { margin: .75rem 0; }
.warning, .error { border-left: 5px solid #a54100; font-weight: 700; padding: .5rem .75rem; }
.error { border-color: #b00020; }
.results-wrap { max-width: 100%; }
table { border-collapse: collapse; width: 100%; }
.menu-list thead { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
.menu-list tbody { display: block; }
.menu-list tr { border-bottom: 1px solid #d6c9c0; display: grid; gap: .2rem .7rem; grid-template-columns: auto auto 1fr; padding: 1.15rem .25rem; }
.menu-list td { border: 0; padding: 0; text-align: left; vertical-align: top; }
.menu-list td[data-label="Name"] { font-size: 1.08rem; font-weight: 800; grid-column: 1 / -1; letter-spacing: .025em; text-transform: uppercase; }
.item-type { font-style: italic; font-weight: 500; }
.menu-list td[data-label="Distillery"], .menu-list td[data-label="Proof"] { color: #46372f; }
.menu-list td[data-label="Distillery"]::before { content: "• "; margin-right: .35rem; }
.menu-list td[data-label="Notes"] { color: #5f5149; grid-column: 1 / -1; }
.menu-list td[data-label="Price"] { align-items: center; display: grid; font-weight: 700; gap: .55rem; grid-column: 1 / -1; grid-template-columns: auto 1fr auto; margin-top: .55rem; }
.price-leader { border-bottom: 3px dotted #d6c9c0; min-width: 2rem; }
.price-value { white-space: nowrap; }
th button { background: transparent; border-color: transparent; color: #21150f; padding: .25rem; }
.muted { color: #5f5149; }
[hidden] { display: none !important; }
@media (max-width: 700px) {
  .menu-list tr { grid-template-columns: auto 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
`;
