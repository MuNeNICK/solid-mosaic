import { test, expect, Page } from '@playwright/test';

// ─── Helpers ───────────────────────────────────────────────

async function getTileTexts(page: Page): Promise<string[]> {
  // Select only the direct toolbar title (not the preview title)
  const tiles = page.locator('.mosaic-window-toolbar > div[title]');
  const texts: string[] = [];
  const count = await tiles.count();
  for (let i = 0; i < count; i++) {
    texts.push((await tiles.nth(i).getAttribute('title')) ?? '');
  }
  return texts.sort();
}

async function getTileCount(page: Page): Promise<number> {
  return page.locator('.mosaic-tile').count();
}

// ─── Initial Render ────────────────────────────────────────

test.describe('Initial Render', () => {
  test('renders 3 windows on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mosaic-tile')).toHaveCount(3);
  });

  test('windows have correct titles', async ({ page }) => {
    await page.goto('/');
    const titles = await getTileTexts(page);
    expect(titles).toEqual(['Window 1', 'Window 2', 'Window 3']);
  });

  test('mosaic root exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mosaic-root')).toBeVisible();
  });

  test('split bars exist between windows', async ({ page }) => {
    await page.goto('/');
    const splits = page.locator('.mosaic-split');
    expect(await splits.count()).toBeGreaterThanOrEqual(2);
  });
});

// ─── Resize (Split drag) ──────────────────────────────────

test.describe('Resize', () => {
  test('dragging a split bar changes the layout', async ({ page }) => {
    await page.goto('/');

    const split = page.locator('.mosaic-split.-row').first();
    const box = (await split.boundingBox())!;
    expect(box).toBeTruthy();

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    // Get initial tile sizes
    const tilesBefore = await page.locator('.mosaic-tile').first().boundingBox();

    // Drag using dispatchEvent to ensure the mousedown handler fires
    await split.dispatchEvent('mousedown', { button: 0, clientX: startX, clientY: startY });
    for (let i = 1; i <= 10; i++) {
      await page.dispatchEvent('html', 'mousemove', { clientX: startX + i * 10, clientY: startY });
      await page.waitForTimeout(40);
    }
    await page.dispatchEvent('html', 'mouseup', { clientX: startX + 100, clientY: startY });

    await page.waitForTimeout(100);

    // Tile size should have changed
    const tilesAfter = await page.locator('.mosaic-tile').first().boundingBox();
    expect(tilesAfter!.width).not.toBeCloseTo(tilesBefore!.width, 0);
  });
});

// ─── Toolbar Buttons ───────────────────────────────────────

test.describe('Toolbar Buttons', () => {
  test('Close button removes a window', async ({ page }) => {
    await page.goto('/');
    const before = await getTileCount(page);

    await page.locator('.close-button').first().click();

    const after = await getTileCount(page);
    expect(after).toBe(before - 1);
  });

  test('Split button adds a window', async ({ page }) => {
    await page.goto('/');
    const before = await getTileCount(page);

    await page.locator('.split-button').first().click();

    const after = await getTileCount(page);
    expect(after).toBe(before + 1);
  });

  test('Expand button changes split percentages', async ({ page }) => {
    await page.goto('/');

    const tileBefore = await page.locator('.mosaic-tile').first().boundingBox();

    await page.locator('.expand-button').first().click();

    const tileAfter = await page.locator('.mosaic-tile').first().boundingBox();
    expect(tileAfter!.width).toBeGreaterThan(tileBefore!.width);
  });

  test('Closing all windows shows zero state', async ({ page }) => {
    await page.goto('/');

    while ((await page.locator('.close-button').count()) > 0) {
      await page.locator('.close-button').first().click();
      await page.waitForTimeout(100);
    }

    await expect(page.locator('.mosaic-zero-state')).toBeVisible();
  });
});

// ─── Navbar Actions ────────────────────────────────────────

test.describe('Navbar Actions', () => {
  test('Add Window to Top Right adds a window', async ({ page }) => {
    await page.goto('/');
    const before = await getTileCount(page);

    await page.getByRole('button', { name: /Add Window/i }).click();

    const after = await getTileCount(page);
    expect(after).toBe(before + 1);
  });

  test('Auto Arrange rearranges without losing windows', async ({ page }) => {
    await page.goto('/');
    const titlesBefore = await getTileTexts(page);

    await page.getByRole('button', { name: /Auto Arrange/i }).click();

    const titlesAfter = await getTileTexts(page);
    expect(titlesAfter).toEqual(titlesBefore);
  });
});

// ─── Drag and Drop ─────────────────────────────────────────

test.describe('Drag and Drop', () => {
  test('dragging a window title bar initiates drag (window count preserved)', async ({ page }) => {
    await page.goto('/');
    const before = await getTileCount(page);
    const titlesBefore = await getTileTexts(page);

    const titleBar = page.locator('.mosaic-window-toolbar.draggable div[title]').first();
    const titleBox = (await titleBar.boundingBox())!;

    await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(titleBox.x + titleBox.width / 2 + 10, titleBox.y + titleBox.height / 2, { steps: 3 });
    await page.mouse.up();

    await page.waitForTimeout(200);

    const after = await getTileCount(page);
    const titlesAfter = await getTileTexts(page);
    expect(after).toBe(before);
    expect(titlesAfter).toEqual(titlesBefore);
  });

  test('drop targets exist (4 per window + 4 root)', async ({ page }) => {
    await page.goto('/');

    const dropTargets = page.locator('.drop-target');
    // 3 windows * 4 targets + 4 root targets = 16
    expect(await dropTargets.count()).toBe(16);
  });

  test('drop target containers become visible during drag', async ({ page }) => {
    await page.goto('/');

    // Before drag: window drop-target-containers should not be visible
    const windowContainers = page.locator('.mosaic-window > .drop-target-container');
    for (let i = 0; i < await windowContainers.count(); i++) {
      const display = await windowContainers.nth(i).evaluate(el => getComputedStyle(el).display);
      expect(display).toBe('none');
    }

    // Start native drag on a window title
    const titleBar = page.locator('.mosaic-window-toolbar.draggable div[title]').first();
    await titleBar.dispatchEvent('dragstart', {});
    await page.waitForTimeout(200);

    // Root drop-target-container should have -dragging class
    const rootContainer = page.locator('.mosaic > .drop-target-container');
    await expect(rootContainer).toHaveClass(/-dragging/);

    // Clean up
    await titleBar.dispatchEvent('dragend', {});
  });

  test('drop target highlights on hover during drag', async ({ page }) => {
    await page.goto('/');

    // Start drag
    const titleBar = page.locator('.mosaic-window-toolbar.draggable div[title]').first();
    await titleBar.dispatchEvent('dragstart', {});
    await page.waitForTimeout(200);

    // Simulate dragenter on a window to make its drop targets visible
    const targetWindow = page.locator('.mosaic-window').nth(1);
    await targetWindow.dispatchEvent('dragenter', {});
    await page.waitForTimeout(50);

    // The window should now have drop-target-hover class
    await expect(targetWindow).toHaveClass(/drop-target-hover/);

    // Hover over a specific drop target
    const targetDropTarget = page.locator('.mosaic-window:nth-child(2) .drop-target.left');
    if (await targetDropTarget.count() > 0) {
      await targetDropTarget.dispatchEvent('dragenter', {});
      await page.waitForTimeout(50);
      await expect(targetDropTarget).toHaveClass(/drop-target-hover/);
    }

    await titleBar.dispatchEvent('dragend', {});
  });
});

// ─── Edge Cases ────────────────────────────────────────────

test.describe('Edge Cases', () => {
  test('Replace button swaps window content', async ({ page }) => {
    await page.goto('/');

    const firstReplace = page.locator('.replace-button').first();
    // Get title via the title attribute on the draggable div
    const firstTitle = page.locator('.mosaic-window-toolbar > div[title]').first();
    const titleBefore = await firstTitle.getAttribute('title');

    await firstReplace.click();
    await page.waitForTimeout(100);

    const titleAfter = await firstTitle.getAttribute('title');
    expect(titleAfter).not.toBe(titleBefore);
  });

  test('multiple operations: add then close returns to original count', async ({ page }) => {
    await page.goto('/');
    const originalCount = await getTileCount(page);

    await page.getByRole('button', { name: /Add Window/i }).click();
    expect(await getTileCount(page)).toBe(originalCount + 1);

    await page.locator('.close-button').last().click();
    await page.waitForTimeout(100);

    expect(await getTileCount(page)).toBe(originalCount);
  });
});
