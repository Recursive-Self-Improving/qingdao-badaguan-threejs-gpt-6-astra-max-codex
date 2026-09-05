import { chromium } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath();
if (!existsSync(executablePath)) {
  const cache = join(homedir(), '.cache/ms-playwright');
  const installed = existsSync(cache) ? readdirSync(cache).filter(name => /^chromium-\d+$/.test(name)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1])) : [];
  if (installed.length) executablePath = join(cache, installed[0], 'chrome-linux64/chrome');
}
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  window.__THREE_DEVTOOLS__ = new EventTarget();
  window.__sceneObjects = [];
  window.__THREE_DEVTOOLS__.addEventListener('observe', event => window.__sceneObjects.push(event.detail));
});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(process.env.BASE_URL || 'http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('[data-thumbnail].ready').length === 4, { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/badaguan-desktop.png' });
const performanceInfo = await page.evaluate(() => new Promise(resolve => {
  const start = performance.now();
  let frames = 0;
  function measure() {
    frames++;
    const elapsed = performance.now() - start;
    if (elapsed > 2500) resolve({ fps: Math.round(frames / elapsed * 1000), width: innerWidth, height: innerHeight });
    else requestAnimationFrame(measure);
  }
  requestAnimationFrame(measure);
}));
if (process.argv.includes('--profile-bench')) {
  const benchmark = await page.evaluate(async () => {
    const renderer = window.__sceneObjects.find(object => object.isWebGLRenderer);
    const scene = window.__sceneObjects.find(object => object.isScene);
    const sample = () => new Promise(resolve => {
      const start = performance.now(); let frames = 0;
      function tick() { frames++; if (performance.now() - start > 2200) resolve(Math.round(frames / (performance.now() - start) * 1000)); else requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    });
    const result = { draws: renderer.info.render.calls, triangles: renderer.info.render.triangles, pixelRatio: renderer.getPixelRatio() };
    scene.traverse(object => { if (object.material?.alphaTest > 0) object.visible = false; });
    result.withoutLeaves = await sample();
    scene.traverse(object => { if (object.geometry?.parameters?.width === 3600) object.visible = false; });
    result.withoutSea = await sample();
    scene.children.forEach(object => { if (!object.isLight && object.geometry?.parameters?.radius !== 1800) object.visible = false; });
    result.skyOnly = await sample();
    renderer.setPixelRatio(.5);
    result.skyLowResolution = await sample();
    return result;
  });
  console.log(JSON.stringify({ benchmark }, null, 2));
}
if (process.argv.includes('--all')) {
  for (const id of ['avenue', 'beach', 'princess']) {
    await page.locator(`[data-place="${id}"]`).click();
    await page.waitForTimeout(4500);
    await page.screenshot({ path: `/tmp/badaguan-${id}.png` });
  }
  await page.locator('[data-place="huashi"]').click();
  await page.waitForTimeout(4500);
  await page.locator('#walk-button').click();
  await page.waitForTimeout(4500);
  await page.screenshot({ path: '/tmp/badaguan-walk.png' });
  await page.locator('#walk-button').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: '/tmp/badaguan-mobile.png' });
}
console.log(JSON.stringify({ errors, performanceInfo, rendering: await page.locator('canvas').evaluate(canvas => ({ ...canvas.dataset, width: canvas.width, height: canvas.height })), screenshots: '/tmp/badaguan-*.png' }, null, 2));
await browser.close();
