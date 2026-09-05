import { test, expect, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('#landscape-canvas')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  await expect(page.locator('[data-thumbnail].ready')).toHaveCount(4, { timeout: 60000 });
  await expect(page.locator('#loading-screen')).toHaveCSS('visibility', 'hidden');
}

const mapPosition = (page: Page) => page.locator('#minimap [data-player]').getAttribute('transform');

test('the 3D world supports navigation, rotation, walking, lighting, maps and tour controls', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await ready(page);
  await expect(page).toHaveTitle('山海漫遊 · 青島八大關');
  await page.screenshot({ path: '/tmp/badaguan-final-desktop.png' });
  await expect(page.locator('.place-card.selected')).toHaveAttribute('data-place', 'huashi');

  await test.step('all four destinations are real navigation actions', async () => {
    for (const id of ['avenue', 'beach', 'princess', 'huashi']) {
      const previous = await mapPosition(page);
      await page.locator(`[data-place="${id}"]`).click();
      await expect(page.locator('.place-card.selected')).toHaveAttribute('data-place', id);
      await expect.poll(() => mapPosition(page)).not.toBe(previous);
    }
  });

  await test.step('mouse rotation and keyboard motion change the actual camera', async () => {
    const canvas = await page.locator('#landscape-canvas').boundingBox();
    const before = await page.locator('#compass-needle').getAttribute('style');
    await page.mouse.move(canvas!.x + canvas!.width * .5, canvas!.y + canvas!.height * .72);
    await page.mouse.down();
    await page.mouse.move(canvas!.x + canvas!.width * .5 + 130, canvas!.y + canvas!.height * .72 - 25, { steps: 9 });
    await page.mouse.up();
    await expect.poll(() => page.locator('#compass-needle').getAttribute('style')).not.toBe(before);
    const position = await mapPosition(page);
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(700);
    await page.keyboard.up('KeyW');
    await expect.poll(() => mapPosition(page)).not.toBe(position);
  });

  await test.step('walking respects the villa boundary and resets to the overview', async () => {
    await page.locator('#walk-button').click();
    await expect(page.locator('#view-mode-label')).toHaveText('步行漫遊');
    await page.waitForTimeout(300);
    const before = await mapPosition(page);
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(2800);
    await page.keyboard.up('KeyW');
    await expect.poll(() => mapPosition(page)).not.toBe(before);
    const transform = (await mapPosition(page))!;
    const values = /translate\(([-.\d]+),([-.\d]+)\)/.exec(transform)!;
    const x = Number(values[1]) / 240 * 280 - 180;
    const z = Number(values[2]) / 176 * 450 - 240;
    expect(Math.hypot(x - 5, z)).toBeGreaterThanOrEqual(11.6);
    await page.keyboard.press('KeyR');
    await expect(page.locator('#view-mode-label')).toHaveText('自由探索');
  });

  await test.step('time, map and automatic tour controls update visible state', async () => {
    await page.locator('#time-button').click();
    await page.locator('[data-time="8.5"]').click();
    await expect(page.locator('#time-display')).toHaveText('08:30');
    await expect(page.locator('#time-slider')).toHaveValue('8.5');
    await page.locator('[data-time="16.5"]').click();
    await page.locator('#time-button').click();
    await page.locator('#map-button').click();
    await expect(page.locator('#minimap')).toBeHidden();
    await page.keyboard.press('KeyM');
    await expect(page.locator('#minimap')).toBeVisible();
    await page.locator('#tour-button').click();
    await expect(page.locator('#view-mode-label')).toHaveText('慢遊導覽中');
    await page.locator('#tour-button').click();
    await expect(page.locator('#view-mode-label')).toHaveText('自由探索');
    await page.locator('#expand-map-button').click();
    await page.locator('.map-place-list [data-map-place="princess"]').click();
    await expect(page.locator('.place-card.selected')).toHaveAttribute('data-place', 'princess');
    await expect(page.locator('#dialog')).not.toBeVisible();
  });

  await test.step('sound, settings and factual context are accessible', async () => {
    await page.locator('#sound-button').click();
    await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#sound-button').click();
    await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('#atmosphere-button').click();
    await page.locator('#leaves-toggle').click();
    await expect(page.locator('#leaves-toggle')).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Escape');
    await page.locator('#about-nav').click();
    await expect(page.locator('#dialog')).toContainText('並非一比一測繪復原');
    await expect(page.locator('.source-links a')).toHaveCount(3);
    await page.keyboard.press('Escape');
    await page.locator('#help-button').click();
    await expect(page.locator('#dialog')).toContainText('前後左右移動');
    await page.keyboard.press('Escape');
  });
  expect(errors).toEqual([]);
});

test('postcards capture the canvas, download, and persist in the journal', async ({ page }) => {
  await ready(page);
  await page.locator('#capture-button').click();
  await expect(page.locator('.postcard-preview img')).toBeVisible();
  const source = await page.locator('.postcard-preview img').getAttribute('src');
  expect(source).toMatch(/^data:image\/jpeg;base64,/);
  expect(source!.length).toBeGreaterThan(10000);
  await page.locator('#save-postcard').click();
  await expect(page.locator('#save-postcard')).toBeDisabled();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('badaguan-postcards')!));
  expect(stored).toHaveLength(1);
  expect(stored[0].name).toBe('花石樓');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-postcard').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^青島八大關-花石樓-.+\.jpg$/);
  await page.reload();
  await expect(page.locator('#landscape-canvas')).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  await page.locator('#journal-nav').click();
  await page.locator('#cards-tab').click();
  await expect(page.locator('.saved-postcard')).toHaveCount(1);
  await page.locator('.saved-postcard').click();
  await expect(page.locator('.postcard-preview img')).toHaveAttribute('src', source!);
});

test.describe('touch experience', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('the mobile guide and directional pad support touch walking without page overflow', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.locator('#mobile-places-toggle').tap();
    await expect(page.locator('.sidebar')).toBeVisible();
    await page.locator('[data-place="avenue"]').tap();
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('#current-place-name')).toHaveText('梧桐小徑');
    await page.locator('#mobile-places-toggle').tap();
    await page.locator('#walk-button').tap();
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('.mobile-movement')).toBeVisible();
    await expect(page.locator('#view-mode-label')).toHaveText('步行漫遊');
    const button = await page.locator('[data-move="KeyW"]').boundingBox();
    const session = await context.newCDPSession(page);
    const before = await mapPosition(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: button!.x + button!.width / 2, y: button!.y + button!.height / 2 }] });
    await page.waitForTimeout(850);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => mapPosition(page)).not.toBe(before);
    await page.waitForTimeout(300);
    const after = await mapPosition(page);
    await page.waitForTimeout(400);
    expect(await mapPosition(page)).toBe(after);
    await page.screenshot({ path: '/tmp/badaguan-mobile-tested.png' });
    expect(errors).toEqual([]);
  });
});
