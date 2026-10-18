import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { startPreview } from './preview.mjs';

const out = resolve(
  process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : 'test/scratch/interaction',
);
const browserName = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const scenarios = [];
const errors = [];
const failedResources = [];
const externalRequests = [];
const measurements = [];
let browser;
let preview;
await mkdir(out, { recursive: true });

async function check(name, run) {
  try {
    await run();
    scenarios.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    scenarios.push({ name, passed: false, error: error.message });
    throw error;
  }
}

async function countHomes(page, expected) {
  await page.waitForFunction(
    (count) => document.querySelectorAll('.homes-grid > article').length === count,
    expected,
  );
  assert.equal(await page.locator('.homes-grid > article').count(), expected);
}

async function noOverflow(page) {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  assert.ok(sizes.content <= sizes.viewport + 1, `horizontal overflow: ${JSON.stringify(sizes)}`);
  return sizes;
}

async function audit(page, state) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  measurements.push({
    state,
    axeViolations: result.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      elements: nodes.map((node) => node.target),
    })),
    axeIncomplete: result.incomplete.map(({ id, nodes }) => ({
      id,
      count: nodes.length,
      elements: nodes.map((node) => node.target),
    })),
  });
  assert.deepEqual(
    result.violations.map(({ id }) => id),
    [],
    `${state}: accessibility violations`,
  );
}

try {
  preview = await startPreview();
  browser = await (browserName === 'webkit' ? webkit : chromium).launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    acceptDownloads: true,
  });
  context.setDefaultTimeout(10000);
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin !== new URL(preview.url).origin) {
      externalRequests.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400)
      failedResources.push({ path: new URL(response.url()).pathname, status: response.status() });
  });

  await check('Static export loads under /preview/ without external runtime requests', async () => {
    await page.goto(preview.url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await countHomes(page, 6);
    assert.equal(await page.title(), 'winkerl · Find your kind of corner');
    assert.equal(await page.locator('main').count(), 1);
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok(await page.evaluate(() => document.fonts.check('400 16px Manrope')));
    assert.ok(
      await page.evaluate(() =>
        [...document.fonts].some((face) => face.family === 'Manrope' && face.status === 'loaded'),
      ),
    );
    for (const selector of [
      'link[rel="icon"]',
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:image"]',
    ])
      assert.equal(await page.locator(selector).count(), 1);
    const imagePath = await page.locator('meta[property="og:image"]').getAttribute('content');
    const response = await page.request.get(new URL(imagePath, preview.url).href);
    assert.equal(response.status(), 200);
    const png = await response.body();
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  });

  await check('Responsive reflow at 320, 390, 650, 850, 1120 and 1440 CSS pixels', async () => {
    for (const width of [320, 390, 650, 850, 1120, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      const size = await noOverflow(page);
      measurements.push({
        width,
        ...size,
        columns: await page
          .locator('.homes-grid')
          .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
      });
    }
  });

  await check(
    'Rendered text, opaque photo labels and accent controls meet contrast thresholds',
    async () => {
      const pairs = await page.evaluate(() => {
        const parse = (color) => color.match(/[\d.]+/g).map(Number);
        const luminance = (channels) =>
          channels
            .slice(0, 3)
            .map((channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            })
            .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
        return [
          'h1',
          '.search-submit',
          '.search-note',
          '.way-step p',
          '.photo-label',
          '.save-button',
          '.home-feature',
          '.brand',
          '.saved-link > span:not(.saved-count)',
          '.saved-count',
        ].map((selector) => {
          const element = document.querySelector(selector);
          const style = getComputedStyle(element);
          let backgroundElement = element;
          while (
            backgroundElement.parentElement &&
            (parse(getComputedStyle(backgroundElement).backgroundColor)[3] ?? 1) === 0
          )
            backgroundElement = backgroundElement.parentElement;
          const background = getComputedStyle(backgroundElement).backgroundColor;
          const values = [luminance(parse(style.color)), luminance(parse(background))].sort(
            (a, b) => b - a,
          );
          return {
            selector,
            foreground: style.color,
            background,
            ratio: Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2)),
          };
        });
      });
      for (const pair of pairs) assert.ok(pair.ratio >= 4.5, `${pair.selector}: ${pair.ratio}:1`);
      measurements.push({ renderedContrast: pairs });
    },
  );

  await check(
    '390px first screen includes search and the first home’s photo, price and title',
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      for (const selector of [
        'h1',
        '.search-submit',
        '.home-card:first-child .home-photo',
        '.home-card:first-child .home-price',
        '.home-card:first-child .home-title',
      ]) {
        const box = await page.locator(selector).boundingBox();
        assert.ok(
          box && box.y >= 0 && box.y + box.height <= 844,
          `${selector} is not fully on the first screen: ${JSON.stringify(box)}`,
        );
        measurements.push({ firstScreen: selector, box });
      }
      await page.screenshot({ path: `${out}/390-first.webp`, type: 'webp', quality: 84 });
      await audit(page, '390px default');
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach((image) => {
          image.loading = 'eager';
        });
        await Promise.all([...document.images].map((image) => image.decode()));
      });
      await page.screenshot({
        path: `${out}/1440-full.webp`,
        fullPage: true,
        type: 'webp',
        quality: 80,
      });
      await audit(page, '1440px default');
    },
  );

  await check(
    'Keyboard search normalizes whitespace and filters by neighborhood and postcode',
    async () => {
      await page.getByRole('searchbox', { name: 'Neighborhood' }).fill('  Neubau  ');
      await page.getByRole('searchbox', { name: 'Neighborhood' }).press('Enter');
      await countHomes(page, 1);
      assert.equal(await page.locator('.home-card').getAttribute('data-home-id'), 'neubau-loft');
      assert.equal(
        await page.getByRole('searchbox', { name: 'Neighborhood' }).inputValue(),
        'Neubau',
      );
      await page.getByRole('searchbox', { name: 'Neighborhood' }).fill('1020');
      await page.getByRole('button', { name: 'Search homes', exact: true }).click();
      await countHomes(page, 1);
      assert.equal(
        await page.locator('.home-card').getAttribute('data-home-id'),
        'leopoldstadt-studio',
      );
    },
  );

  await check(
    'Unmatched and long searches have a recoverable empty state without overflow',
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      const query = 'A neighborhood that does not exist '.repeat(5);
      await page.getByRole('searchbox', { name: 'Neighborhood' }).fill(query);
      await page.getByRole('searchbox', { name: 'Neighborhood' }).press('Enter');
      await countHomes(page, 0);
      assert.ok(await page.getByRole('heading', { name: 'No homes match just yet.' }).isVisible());
      await noOverflow(page);
      await page.screenshot({ path: `${out}/390-empty.webp`, type: 'webp', quality: 80 });
      await page.getByRole('button', { name: 'Reset your search' }).click();
      await countHomes(page, 6);
      await page.waitForFunction(() => document.activeElement?.id === 'results-title');
    },
  );

  await check('All home-type controls filter the actual listing data', async () => {
    for (const [name, kind] of [
      ['Apartments', 'Apartment'],
      ['Lofts', 'Loft'],
      ['Houses', 'House'],
    ]) {
      await page.getByRole('button', { name, exact: true }).click();
      await countHomes(page, 2);
      assert.deepEqual(await page.locator('.home-card .photo-label').allTextContents(), [
        kind,
        kind,
      ]);
      assert.equal(
        await page.getByRole('button', { name, exact: true }).getAttribute('aria-pressed'),
        'true',
      );
    }
    await page.getByRole('button', { name: 'All homes', exact: true }).click();
    await countHomes(page, 6);
  });

  await check(
    'Filters combine rent, bedrooms and amenities; the count predicts applied results',
    async () => {
      await page.getByRole('button', { name: /^Filters/ }).click();
      const dialog = page.getByRole('dialog', { name: 'A home that fits' });
      await dialog
        .getByRole('combobox', { name: 'Monthly rent', exact: true })
        .selectOption('2500');
      await dialog.getByRole('combobox', { name: 'Bedrooms', exact: true }).selectOption('2');
      await dialog.getByLabel('Pets welcome', { exact: true }).check();
      await dialog.getByLabel('Workspace', { exact: true }).check();
      assert.ok(await dialog.getByRole('button', { name: 'Show 1 home', exact: true }).isEnabled());
      await page.screenshot({ path: `${out}/390-filters.webp`, type: 'webp', quality: 80 });
      await audit(page, '390px filters');
      await dialog.getByRole('button', { name: 'Show 1 home', exact: true }).click();
      await countHomes(page, 1);
      assert.equal(
        await page.locator('.home-card').getAttribute('data-home-id'),
        'wieden-apartment',
      );
      await page.getByRole('button', { name: 'Clear all', exact: true }).click();
      await countHomes(page, 6);
      await page.getByRole('button', { name: /^Filters/ }).click();
      await dialog
        .getByRole('combobox', { name: 'Monthly rent', exact: true })
        .selectOption('1500');
      await dialog.getByRole('combobox', { name: 'Bedrooms', exact: true }).selectOption('3');
      await dialog.getByRole('button', { name: 'Show 0 homes', exact: true }).click();
      await countHomes(page, 0);
      await page.getByRole('button', { name: 'Reset your search' }).click();
      await countHomes(page, 6);
    },
  );

  await check('Filter cancellation, backdrop, keyboard trap and focus return work', async () => {
    const trigger = page.getByRole('button', { name: /^Filters/ });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: 'Bedrooms', exact: true }).selectOption('3');
    for (let index = 0; index < 16; index++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog'))));
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.ok(await trigger.evaluate((element) => document.activeElement === element));
    await countHomes(page, 6);
    await trigger.click();
    await page.mouse.click(2, 2);
    assert.equal(await page.getByRole('dialog').count(), 0);
    await countHomes(page, 6);
  });

  await check('All sort modes reorder the displayed homes correctly', async () => {
    const sort = page.getByRole('combobox', { name: 'Sort homes' });
    for (const [value, expected] of [
      [
        'rent-asc',
        [
          'josefstadt-apartment',
          'neubau-loft',
          'mariahilf-home',
          'leopoldstadt-studio',
          'alsergrund-home',
          'wieden-apartment',
        ],
      ],
      [
        'rent-desc',
        [
          'wieden-apartment',
          'alsergrund-home',
          'leopoldstadt-studio',
          'mariahilf-home',
          'neubau-loft',
          'josefstadt-apartment',
        ],
      ],
      [
        'space',
        [
          'wieden-apartment',
          'alsergrund-home',
          'leopoldstadt-studio',
          'mariahilf-home',
          'neubau-loft',
          'josefstadt-apartment',
        ],
      ],
    ]) {
      await sort.selectOption(value);
      assert.deepEqual(
        await page
          .locator('.home-card')
          .evaluateAll((elements) => elements.map((element) => element.dataset.homeId)),
        expected,
      );
    }
    await sort.selectOption('recommended');
  });

  await check(
    'Listing details are honest, keyboard-accessible and save the selected home',
    async () => {
      await page.getByRole('button', { name: 'View The sun-drenched corner', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'The sun-drenched corner', exact: true });
      assert.ok(await dialog.getByText('1070 Neubau, Vienna', { exact: true }).isVisible());
      assert.ok(await dialog.getByText(/This is an illustrative home/).isVisible());
      const photo = await dialog.locator('.detail-photo').boundingBox();
      assert.ok(
        Math.abs(photo.width / photo.height - 1.4) < 0.01,
        'Mobile detail photo keeps its intended crop',
      );
      await page.screenshot({ path: `${out}/390-details-top.webp`, type: 'webp', quality: 80 });
      await dialog.getByRole('button', { name: 'Save this home', exact: true }).click();
      assert.equal(
        await dialog
          .getByRole('button', { name: 'Saved to your collection' })
          .getAttribute('aria-pressed'),
        'true',
      );
      await noOverflow(page);
      await page.screenshot({ path: `${out}/390-details.webp`, type: 'webp', quality: 80 });
      await audit(page, '390px listing details');
      await page.keyboard.press('Escape');
      assert.ok(
        await page
          .getByRole('button', { name: 'Unsave The sun-drenched corner', exact: true })
          .isVisible(),
      );
      assert.ok(
        await page
          .getByRole('button', { name: 'View The sun-drenched corner', exact: true })
          .evaluate((element) => document.activeElement === element),
      );
    },
  );

  await check(
    'Saved homes survive reload, open details and download a real shortlist',
    async () => {
      await page.reload({ waitUntil: 'networkidle' });
      const savedTrigger = page.getByRole('button', { name: 'Saved homes, 1', exact: true });
      await savedTrigger.click();
      const dialog = page.getByRole('dialog', { name: 'Your little collection' });
      assert.equal(await dialog.locator('.saved-row').count(), 1);
      await dialog.getByRole('button', { name: /Neubau.*The sun-drenched corner/ }).click();
      await page.getByRole('button', { name: 'Back to saved homes', exact: true }).click();
      await page.screenshot({ path: `${out}/390-saved.webp`, type: 'webp', quality: 82 });
      await audit(page, '390px saved collection');
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        dialog.getByRole('button', { name: 'Download shortlist', exact: true }).click(),
      ]);
      assert.equal(download.suggestedFilename(), 'winkerl-shortlist.txt');
      const downloaded = await readFile(await download.path(), 'utf8');
      assert.ok(downloaded.includes('The sun-drenched corner'));
      assert.ok(downloaded.includes('€1,450 / month'));
      assert.ok(downloaded.includes('not available to book'));
      await page.keyboard.press('Escape');
      assert.ok(await savedTrigger.evaluate((element) => document.activeElement === element));
    },
  );

  await check('Removing the final saved home reveals a useful empty collection', async () => {
    await page.getByRole('button', { name: 'Saved homes, 1', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('button', { name: 'Remove The sun-drenched corner from saved homes', exact: true })
      .click();
    assert.ok(
      await dialog.getByRole('heading', { name: 'Something will feel like home.' }).isVisible(),
    );
    await page.waitForFunction(() => document.activeElement?.textContent.includes('Explore homes'));
    await dialog.getByRole('button', { name: 'Explore homes', exact: true }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.ok(await page.getByRole('button', { name: 'Saved homes, 0', exact: true }).isVisible());
  });

  await check(
    'Corrupt saved data recovers and unavailable storage degrades to session-only saving',
    async () => {
      await page.evaluate(() => localStorage.setItem('winkerl.saved-homes.v1', '{not valid json'));
      await page.reload({ waitUntil: 'networkidle' });
      assert.ok(
        await page.getByRole('button', { name: 'Saved homes, 0', exact: true }).isVisible(),
      );
      const ephemeral = await context.newPage();
      await ephemeral.addInitScript(() => {
        Storage.prototype.setItem = () => {
          throw new DOMException('Storage unavailable', 'SecurityError');
        };
      });
      await ephemeral.goto(preview.url, { waitUntil: 'networkidle' });
      await ephemeral
        .getByRole('button', { name: 'Save The sun-drenched corner', exact: true })
        .click();
      await ephemeral.getByRole('button', { name: 'Saved homes, 1', exact: true }).click();
      assert.ok(
        await ephemeral
          .getByText('Saved for this visit. Browser storage is unavailable.', { exact: true })
          .isVisible(),
      );
      await ephemeral.close();
    },
  );

  await check(
    'Text enlarged to 200%, CSS zoom, and an RTL mirror reflow without horizontal overflow',
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
        window.scrollTo(0, 0);
      });
      await noOverflow(page);
      const overlap = await page.evaluate(() => {
        const label = document.querySelector('.neighborhood .field-label');
        const range = document.createRange();
        range.selectNodeContents(label);
        const button = document.querySelector('.search-submit').getBoundingClientRect();
        return [...range.getClientRects()].some(
          (rect) =>
            Math.min(rect.right, button.right) > Math.max(rect.left, button.left) &&
            Math.min(rect.bottom, button.bottom) > Math.max(rect.top, button.top),
        );
      });
      assert.equal(overlap, false, 'Enlarged neighborhood label overlaps the search button');
      await page.screenshot({ path: `${out}/390-text-200-first.webp`, type: 'webp', quality: 80 });
      await page.screenshot({
        path: `${out}/390-text-200.webp`,
        fullPage: true,
        type: 'webp',
        quality: 75,
      });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });
      await noOverflow(page);
      await page.evaluate(() => {
        document.body.style.zoom = '';
        document.documentElement.dir = 'rtl';
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await noOverflow(page);
      await page.screenshot({ path: `${out}/390-rtl.webp`, type: 'webp', quality: 75 });
      await page.evaluate(() => {
        document.documentElement.dir = 'ltr';
      });
    },
  );

  await check(
    'Reduced motion removes transitions and keyboard focus remains visible in forced colors',
    async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(
        await page
          .locator('.search-submit')
          .evaluate((element) => getComputedStyle(element).transitionDuration),
        '0s',
      );
      await page.emulateMedia({ forcedColors: 'active' });
      await page.keyboard.press('Tab');
      await page.getByRole('searchbox', { name: 'Neighborhood' }).focus();
      const focus = await page
        .getByRole('searchbox', { name: 'Neighborhood' })
        .evaluate((element) => ({
          width: getComputedStyle(element).outlineWidth,
          style: getComputedStyle(element).outlineStyle,
          visible: element.matches(':focus-visible'),
        }));
      assert.deepEqual(focus, { width: '2px', style: 'solid', visible: true });
      await page.screenshot({ path: `${out}/390-forced-focus.webp`, type: 'webp', quality: 80 });
      await page.emulateMedia({ forcedColors: 'none' });
      await page.screenshot({ path: `${out}/390-keyboard-focus.webp`, type: 'webp', quality: 80 });
    },
  );

  await check('Emulated touch can open a home, save it and close the dialog', async () => {
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    const touch = await mobile.newPage();
    await touch.goto(preview.url, { waitUntil: 'networkidle' });
    await touch.getByRole('button', { name: 'View The sun-drenched corner', exact: true }).tap();
    await touch.getByRole('button', { name: 'Save this home', exact: true }).tap();
    await touch.getByRole('button', { name: 'Close The sun-drenched corner', exact: true }).tap();
    assert.ok(await touch.getByRole('button', { name: 'Saved homes, 1', exact: true }).isVisible());
    await mobile.close();
  });

  await check('About, main navigation and return-to-top links work', async () => {
    await page.getByRole('button', { name: 'About this demo', exact: true }).click();
    assert.ok(
      await page
        .getByRole('dialog', { name: 'A little about winkerl' })
        .getByText(/There is no live availability/)
        .isVisible(),
    );
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('link', { name: 'The Winkerl way', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#our-way');
    await page.getByRole('link', { name: 'Find a home', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#homes');
    await page.getByRole('link', { name: 'winkerl home', exact: true }).first().click();
    assert.ok(await page.evaluate(() => window.scrollY < 2));
  });

  await check(
    'No script, console, local-resource or blocked external-request failures occurred',
    async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(failedResources, []);
      assert.deepEqual(externalRequests, []);
    },
  );
} catch (error) {
  console.error(`FAIL ${scenarios.at(-1)?.name || 'Browser startup'}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await preview?.stop();
  const report = {
    browser: browserName,
    passed: scenarios.filter((item) => item.passed).length,
    failed: scenarios.filter((item) => !item.passed).length,
    scenarios,
    measurements,
    errors,
    failedResources,
    externalRequests,
    limitations: [
      'No physical-device or assistive-technology session.',
      'Text enlargement and CSS zoom are not browser-native zoom.',
      'Automated accessibility scans do not establish full accessibility conformance.',
    ],
  };
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.passed}/${scenarios.length} scenarios passed. Report: ${out}/results.json`);
}
