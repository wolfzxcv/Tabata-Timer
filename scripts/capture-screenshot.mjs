/**
 * Regenerate docs/screenshot.png for the README (mobile setup, dark theme).
 *
 * Optional maintainer tooling — not wired into package.json scripts.
 * See README → "Optional (maintainers only): Regenerate README screenshot".
 *
 * Requires: playwright (install locally with `npm install --no-save playwright`)
 *           + preview at http://127.0.0.1:4173/Tabata-Timer/
 */
import { chromium } from 'playwright';

const PREVIEW_URL = 'http://127.0.0.1:4173/Tabata-Timer/';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
});

try {
  await page.goto(PREVIEW_URL, { waitUntil: 'networkidle', timeout: 10_000 });
} catch {
  console.error(
    'Could not reach preview server. Run `npm run build` then `npm run preview` first.',
  );
  await browser.close();
  process.exit(1);
}

await page.evaluate(() => {
  localStorage.setItem(
    'tabata-settings',
    JSON.stringify({
      prepare: 10,
      work: 20,
      rest: 10,
      cycles: 8,
      sets: 1,
      setRest: 60,
      muted: false,
      theme: 'dark',
    }),
  );
});
await page.reload();
await page.getByRole('heading', { name: 'Tabata Timer' }).waitFor({
  state: 'visible',
});
await page.waitForTimeout(300);

await page.screenshot({
  path: 'docs/screenshot.png',
  fullPage: false,
});

console.log('Saved docs/screenshot.png');

await browser.close();
