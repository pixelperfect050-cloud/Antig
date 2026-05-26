import { expect } from '@playwright/test';

export function createIssueCollector(page) {
  const issues = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    badResponses: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      issues.consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  page.on('pageerror', error => {
    issues.pageErrors.push({ message: error.message, stack: error.stack });
  });

  page.on('requestfailed', request => {
    const url = request.url();
    const method = request.method();
    const failure = request.failure()?.errorText || 'failed';

    // Ignore logout aborts caused by immediate navigation after sign-out.
    if (method === 'POST' && url.includes('/auth/v1/logout') && failure === 'net::ERR_ABORTED') {
      return;
    }

    issues.requestFailures.push({ url, method, failure });
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/') && response.status() >= 400) {
      issues.badResponses.push({ url, status: response.status(), statusText: response.statusText() });
    }
  });

  return issues;
}

export async function assertNoPageIssues(issues) {
  expect(issues.consoleErrors, `Console errors detected: ${JSON.stringify(issues.consoleErrors, null, 2)}`).toEqual([]);
  expect(issues.pageErrors, `Page errors detected: ${JSON.stringify(issues.pageErrors, null, 2)}`).toEqual([]);
  expect(issues.requestFailures, `Request failures detected: ${JSON.stringify(issues.requestFailures, null, 2)}`).toEqual([]);
  expect(issues.badResponses, `API errors detected: ${JSON.stringify(issues.badResponses, null, 2)}`).toEqual([]);
}

export async function assertNoOverflow(page) {
  const overflowInfo = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const bodyWidth = document.body.scrollWidth;
    const overflowElements = [];
    document.querySelectorAll('body *').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > viewportWidth + 1 && rect.width > 100) {
        overflowElements.push({ tag: el.tagName, className: el.className, width: Math.round(rect.width), text: el.innerText?.slice(0, 120) });
      }
    });
    return { viewportWidth, bodyWidth, overflowElements: overflowElements.slice(0, 30) };
  });

  expect(overflowInfo.bodyWidth, `Body width should not overflow viewport`).toBeLessThanOrEqual(overflowInfo.viewportWidth + 1);
  expect(overflowInfo.overflowElements, `Overflowing elements found`).toEqual([]);
}

export async function assertNoBrokenButtons(page) {
  const brokenButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter(btn => btn.offsetParent !== null && !btn.disabled)
      .filter(btn => {
        const text = btn.innerText.trim();
        const aria = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        return !text && !aria && !title;
      })
      .map(btn => ({ tag: btn.tagName, className: btn.className, outerHTML: btn.outerHTML.slice(0, 140) }));
  });

  expect(brokenButtons, `Broken buttons without visible text or label`).toEqual([]);
}

export async function getStableLocator(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector);
    if (await locator.count() > 0) {
      return locator.first();
    }
  }
  throw new Error(`No stable locator found for selectors: ${selectors.join(', ')}`);
}

export async function clickStable(page, selectors, options = {}) {
  const locator = await getStableLocator(page, selectors);
  await locator.click(options);
}

export async function fillStable(page, selectors, value, options = {}) {
  const locator = await getStableLocator(page, selectors);
  await locator.fill(value, options);
}

export async function waitForStableSelector(page, selectors, state = 'visible', timeout = 30000) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { state, timeout });
      return page.locator(selector).first();
    } catch (err) {
      // try next selector
    }
  }
  throw new Error(`No stable selector found for selectors: ${selectors.join(', ')}`);
}

export async function dismissTourIfPresent(page) {
  const tourButtons = page.locator('button.tour-btn-skip, button.tour-close-x, button:has-text("Skip Tour")');
  try {
    await tourButtons.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await tourButtons.count();
    for (let i = 0; i < count; i++) {
      await tourButtons.nth(i).click({ force: true }).catch(() => {});
    }
  } catch {
    // No tour buttons appeared within the timeout.
  }

  await page.evaluate(() => {
    document.querySelectorAll('#react-joyride-portal, .react-joyride-portal, .tour-tooltip, .tour-step, .tour-btn-skip, .tour-close-x').forEach(el => el.remove());
  }).catch(() => {});

  await Promise.all([
    page.locator('button.tour-btn-skip').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {}),
    page.locator('button.tour-close-x').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {}),
  ]);
}

export async function loginWithCredentials(page, email, password) {
  await page.goto('/login', { waitUntil: 'load', timeout: 60000 });
  const emailInput = await waitForStableSelector(page, ['#email', 'input[name="email"]', 'input[type="email"]'], 'visible', 30000);
  const passwordInput = await waitForStableSelector(page, ['#password', 'input[name="password"]', 'input[type="password"]'], 'visible', 30000);
  const loginButton = await waitForStableSelector(page, ['#login-btn', 'button:has-text("Sign In")', 'button[type="submit"]'], 'visible', 30000);

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await loginButton.scrollIntoViewIfNeeded();
  await loginButton.click();
  await page.waitForURL('**/dashboard', { timeout: 60000 });
  await page.waitForSelector('#nav-dashboard', { timeout: 30000 });
  await dismissTourIfPresent(page);
  await page.waitForSelector('h1:has-text("Dashboard"), h1:has-text("My Dashboard")', { timeout: 30000 });
}

export async function waitForAppReady(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('body');
  await page.waitForTimeout(500);
}
