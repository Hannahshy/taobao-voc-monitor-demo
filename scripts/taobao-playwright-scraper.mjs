import fs from "node:fs/promises";
import path from "node:path";

const url = process.argv[2];

if (!url) {
  console.error('Usage: npm run scrape:taobao -- "https://item.taobao.com/item.htm?id=..."');
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright is not installed. Run npm install first.");
  process.exit(1);
}

const outDir = path.resolve("data");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1365, height: 820 },
  locale: "zh-CN"
});
const page = await context.newPage();

console.log("Opening Taobao page. Please log in manually if Taobao asks.");
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

console.log("After the review area is visible, press Enter here to capture visible text.");
await waitForEnter();

const snapshot = await page.evaluate(() => {
  const text = document.body.innerText || "";
  const html = document.documentElement.outerHTML || "";
  return { text, html };
});

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const textPath = path.join(outDir, `taobao-review-snapshot-${stamp}.txt`);
const htmlPath = path.join(outDir, `taobao-review-snapshot-${stamp}.html`);
await fs.writeFile(textPath, snapshot.text, "utf8");
await fs.writeFile(htmlPath, snapshot.html, "utf8");

console.log(`Saved text snapshot: ${textPath}`);
console.log(`Saved HTML snapshot: ${htmlPath}`);
console.log("Import the text snapshot in the app's scan page if direct parsing needs review.");

await browser.close();

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", () => resolve());
  });
}
