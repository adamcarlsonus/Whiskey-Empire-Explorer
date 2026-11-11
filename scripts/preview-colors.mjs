import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const source = await readFile(new URL('../src/ui/panel-styles.ts', import.meta.url), 'utf8');
const styles = source.slice(source.indexOf('`') + 1, source.lastIndexOf('`'));
const themes = [
  ['1', 'Charcoal', '#101113', '#27292d', '#45484f', '#f4f4f5', '#bfc1c7', '#aebbd3'],
  ['2', 'Midnight blue', '#101a29', '#1e3047', '#3e5875', '#f1f6fc', '#b9c9dc', '#8fc9ff'],
  ['3', 'Forest', '#101e19', '#22392f', '#426452', '#f1f8f3', '#b8cec0', '#a2dcb6'],
  ['4', 'Bourbon amber', '#211a14', '#392b20', '#73583e', '#fff5e8', '#d4bfa6', '#f0bb78'],
  ['5', 'Burgundy', '#24171d', '#3d2731', '#775365', '#fff1f6', '#d8bdc9', '#eeadc4'],
  ['6', 'Warm ivory', '#faf6ef', '#eee5d8', '#b3a28c', '#30281e', '#665746', '#80551f'],
];
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Whiskey Empire — six color options</title>
<style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#e2e3e5;font:18px/1.5 system-ui;color:#202124}h1{margin:0;font-size:30px}body>p{margin:6px 0 22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.theme>h2{font-size:22px;margin:0 0 8px}.preview{display:block}@media(max-width:1000px){.grid{grid-template-columns:1fr}}</style>
<h1>Error message · Color options</h1><p>20px error text · Original panel colors · Choose a number from 1–6</p><div class="grid">${themes.map(([n,name])=>`<section class="theme"><h2>${n}. ${name}</h2><div class="preview" data-theme="${n}"></div></section>`).join('')}</div>
<script>
const styles=${JSON.stringify(styles)};
const themes=${JSON.stringify(themes)};
for(const [n,name,bg,surface,border,text,muted,accent] of themes){
const host=document.querySelector('[data-theme="'+n+'"]');const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML='<style>'+styles+':host{margin:0}.panel{min-height:365px}.header{align-items:center}.error{background:'+surface+';border-color:'+accent+';color:'+text+'}.header .nav-action{font-size:16px}</style>'+ 
'<section class="panel"><div class="header"><h2>Whiskey Empire Explorer</h2><button class="nav-action" type="button">↻ Rescan</button></div><p class="status">Menu unavailable for scanning.</p><p class="error">The Whiskey Empire menu could not be found. Untappd may block some VPN connections. If you use a VPN, try pausing it or allowing this site outside the VPN, then reload the restaurant page and scan again once the menu is visible. A network problem or menu change can also cause this; the extension cannot detect whether a VPN is active.</p></section>';
}
</script></html>`;
const directory = new URL('../previews/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('color-options.html', directory), html);
const browser = await chromium.launch();
try {
 const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 await page.setContent(html);
 await page.screenshot({path:new URL('color-options.png', directory).pathname,fullPage:true});
} finally { await browser.close(); }
console.log('Created previews/color-options.html and previews/color-options.png');
