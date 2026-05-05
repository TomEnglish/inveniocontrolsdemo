/**
 * Capture screenshots of every page in the live ProjectControls app.
 *
 * Usage:
 *   npm install -D playwright
 *   npx playwright install chromium
 *   APP_URL=https://invenioprojectcontrols.netlify.app \
 *   APP_EMAIL=t.elliott.english@gmail.com \
 *   APP_PASSWORD='your-password' \
 *   node screenshots.js
 *
 * Writes PNGs into ./screenshots/.
 *
 * Re-run any time the UI changes — overwrites in place.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_URL = process.env.APP_URL || 'https://invenioprojectcontrols.netlify.app';
const APP_EMAIL = process.env.APP_EMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;

if (!APP_EMAIL || !APP_PASSWORD) {
  console.error('Set APP_EMAIL and APP_PASSWORD env vars before running.');
  process.exit(1);
}

const PAGES = [
  { path: '/', file: 'dashboard.png', wait: 'h2:has-text("Discipline Summary"), .is-stat-card' },
  { path: '/projects', file: 'projects.png', wait: 'text=/Project Setup/i' },
  { path: '/coa', file: 'coa.png', wait: 'text=/COA/i' },
  { path: '/roc', file: 'roc.png', wait: 'text=/Rules of Credit/i' },
  { path: '/budget', file: 'budget.png', wait: 'text=/Original Budget/i' },
  { path: '/progress', file: 'progress.png', wait: 'table' },
  { path: '/progress/upload', file: 'upload.png', wait: 'text=/Import progress data/i' },
  { path: '/progress/earned-value', file: 'earned-value.png', wait: 'text=/Earned %|Earned Value/i' },
  { path: '/progress/disciplines', file: 'disciplines.png', wait: 'text=/Discipline/i' },
  { path: '/snapshots', file: 'snapshots.png', wait: 'text=/Period snapshots|History/i' },
  { path: '/changes', file: 'changes.png', wait: 'text=/Change/i' },
  { path: '/reports', file: 'reports.png', wait: 'text=/Cost Variance|Variance analysis/i' },
];

const OUT_DIR = resolve('./screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2, // retina-quality screenshots
});
const page = await context.newPage();

console.log(`→ ${APP_URL}/login`);
await page.goto(`${APP_URL}/login`);
await page.fill('input[type="email"]', APP_EMAIL);
await page.fill('input[type="password"]', APP_PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(`${APP_URL}/`, { timeout: 15000 });
console.log('✓ signed in');

for (const p of PAGES) {
  const url = `${APP_URL}${p.path}`;
  console.log(`→ ${p.path}`);
  await page.goto(url, { waitUntil: 'networkidle' });
  // wait for a content-bearing element to appear, with a fallback timeout
  try {
    await page.waitForSelector(p.wait, { timeout: 8000 });
  } catch {
    console.warn(`  (selector not found, screenshotting anyway: ${p.wait})`);
  }
  await page.waitForTimeout(800); // let charts finish animating
  const out = resolve(OUT_DIR, p.file);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  ✓ ${p.file}`);
}

await browser.close();
console.log(`\nDone. ${PAGES.length} screenshots in ${OUT_DIR}`);
