import { mkdir, readdir, readFile, rename } from "node:fs/promises";
import { basename, join } from "node:path";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url).pathname;
const sourceIcon = join(root, "The_Westside_BloNo_Icon-300x300.png");
const outputDir = join(root, "assets", "store");
const sourceCaptureDir = join(root, "assets", "store-source");

const screenshotSize = { width: 640, height: 400 };
const uploadAssets = [
  {
    kind: "hero",
    width: 640,
    height: 400,
    output: join(outputDir, "chrome-web-store-screenshot-640x400.png")
  },
  {
    kind: "hero",
    width: 440,
    height: 280,
    output: join(outputDir, "chrome-web-store-promo-440x280.png")
  },
  {
    kind: "hero",
    width: 1400,
    height: 560,
    output: join(outputDir, "chrome-web-store-marquee-1400x560.png")
  }
];

await mkdir(outputDir, { recursive: true });
await mkdir(sourceCaptureDir, { recursive: true });

async function preserveRawCaptures() {
  const files = await readdir(outputDir);
  for (const file of files) {
    if (/^Screenshot .+\.png$/u.test(file)) {
      await rename(join(outputDir, file), join(sourceCaptureDir, file));
    }
  }
}

function imageDataUri(base64) {
  return `data:image/png;base64,${base64}`;
}

function shellHtml({ width, height, contentCss, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: ${width}px;
        height: ${height}px;
        overflow: hidden;
        background: #050505;
      }
      body {
        color: #f6f4f2;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      ${contentCss}
    </style>
  </head>
  <body>${body}</body>
</html>`;
}

function heroHtml({ width, height, iconBase64 }) {
  const compact = width <= 500;
  const marquee = width >= 1000;
  const scale = width / 640;
  const logoSize = marquee ? 220 : compact ? 116 : 172;
  const iconSize = Math.round(logoSize * 0.8);
  const paddingX = marquee ? 120 : compact ? 30 : 44;
  const gap = marquee ? 64 : compact ? 20 : 28;
  const titleSize = marquee ? 72 : compact ? 36 : 44;
  const summarySize = marquee ? 28 : compact ? 17 : 20;
  const eyebrowSize = marquee ? 20 : compact ? 12 : 16;
  const pillSize = marquee ? 22 : compact ? 13 : 15;
  const maxText = marquee ? 720 : compact ? 240 : 350;

  return shellHtml({
    width,
    height,
    contentCss: `
      body {
        background:
          radial-gradient(circle at 12% 8%, rgba(236, 29, 49, 0.24), transparent 34%),
          linear-gradient(135deg, #050505 0%, #111111 52%, #24140f 100%);
      }
      main {
        align-items: center;
        display: grid;
        gap: ${gap}px;
        grid-template-columns: ${logoSize}px 1fr;
        height: 100%;
        padding: ${Math.round(height * (compact ? 0.12 : 0.11))}px ${paddingX}px;
        width: 100%;
      }
      .logo-card {
        background: #fff;
        border-radius: ${Math.round(logoSize * 0.22)}px;
        box-shadow: 0 ${Math.round(24 * scale)}px ${Math.round(80 * scale)}px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08);
        display: grid;
        height: ${logoSize}px;
        place-items: center;
        width: ${logoSize}px;
      }
      img {
        height: ${iconSize}px;
        object-fit: contain;
        width: ${iconSize}px;
      }
      .eyebrow {
        color: #ff4052;
        font-size: ${eyebrowSize}px;
        font-weight: 800;
        letter-spacing: .16em;
        margin: 0 0 ${compact ? 8 : 12}px;
        text-transform: uppercase;
      }
      h1 {
        font-size: ${titleSize}px;
        letter-spacing: -.07em;
        line-height: .95;
        margin: 0;
        max-width: ${maxText}px;
      }
      .summary {
        color: #cfc7c0;
        font-size: ${summarySize}px;
        line-height: 1.28;
        margin: ${compact ? 12 : 16}px 0 ${compact ? 18 : 24}px;
        max-width: ${marquee ? 660 : compact ? 250 : 320}px;
      }
      .controls {
        display: flex;
        flex-wrap: nowrap;
        gap: ${compact ? 7 : 8}px;
      }
      .pill {
        background: rgba(255, 255, 255, .08);
        border: 1px solid rgba(255, 255, 255, .16);
        border-radius: 999px;
        color: #f6f4f2;
        font-size: ${pillSize}px;
        font-weight: 750;
        line-height: 1;
        padding: ${compact ? "9px 10px" : marquee ? "15px 18px" : "11px 13px"};
      }
      .footer {
        bottom: ${compact ? 20 : marquee ? 58 : 34}px;
        color: #a8a09a;
        font-size: ${marquee ? 20 : compact ? 12 : 14}px;
        font-weight: 650;
        position: absolute;
        right: ${compact ? 30 : marquee ? 120 : 44}px;
      }
    `,
    body: `
      <main>
        <section class="logo-card" aria-label="Westside BloNo logo">
          <img src="${imageDataUri(iconBase64)}" alt="" />
        </section>
        <section>
          <p class="eyebrow">Chrome Extension</p>
          <h1>Whiskey Empire West</h1>
          <p class="summary">Search, filter, and sort the full Whiskey Empire list locally in Chrome.</p>
          <div class="controls" aria-label="Key features">
            <span class="pill">Search</span>
            <span class="pill">Price sort</span>
            <span class="pill">Distillery</span>
          </div>
        </section>
      </main>
      <div class="footer">No accounts · No analytics · Local-only</div>
    `
  });
}

function screenshotHtml({ width, height, captureBase64 }) {
  return shellHtml({
    width,
    height,
    contentCss: `
      body {
        align-items: center;
        background:
          radial-gradient(circle at 50% 10%, rgba(236, 29, 49, .16), transparent 32%),
          #050505;
        display: flex;
        justify-content: center;
      }
      img {
        display: block;
        height: 100%;
        object-fit: contain;
        width: 100%;
      }
    `,
    body: `<img src="${imageDataUri(captureBase64)}" alt="" />`
  });
}

async function renderPage(browser, html, outputPath, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.screenshot({ path: outputPath, type: "png", omitBackground: false });
  } finally {
    await page.close();
  }
}

await preserveRawCaptures();

const iconBase64 = await readFile(sourceIcon, "base64");
const browser = await chromium.launch();
const created = [];

try {
  for (const asset of uploadAssets) {
    await renderPage(browser, heroHtml({ ...asset, iconBase64 }), asset.output, asset.width, asset.height);
    created.push(asset.output);
  }

  const captureFiles = (await readdir(sourceCaptureDir))
    .filter((file) => /^Screenshot .+\.png$/u.test(file))
    .sort();

  for (const [index, file] of captureFiles.slice(0, 4).entries()) {
    const capturePath = join(sourceCaptureDir, file);
    const captureBase64 = await readFile(capturePath, "base64");
    const output = join(outputDir, `chrome-web-store-screenshot-${index + 2}-640x400.png`);
    await renderPage(browser, screenshotHtml({ ...screenshotSize, captureBase64 }), output, screenshotSize.width, screenshotSize.height);
    created.push(output);
  }
} finally {
  await browser.close();
}

for (const file of created) console.log(`Created ${file}`);
console.log(`Raw source captures are preserved in ${sourceCaptureDir}`);
