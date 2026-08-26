import { test, expect, devices } from '@playwright/test';
import { PermissionAgentApp } from '../src/page-objects/PermissionAgentApp';
import { EXPLORE_TOPICS } from '../src/types/chat.types';

test.describe('Navigation Routing & Mobile Responsive Viewport', () => {
  test('navigation CTAs route correctly to login and signup flows [Navigation Flow]', async ({ page }) => {
    /**
     * Navigation Coverage: Verifies that pre-login header CTAs ('Log in' and 'Sign Up')
     * successfully route users to their respective portals without broken routes.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    // 1. Verify Login Route Navigation
    await app.loginNavButton.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();

    // 2. Return to Home
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await app.loadAndPrepareSession();

    // 3. Verify Sign Up Route Navigation
    await app.signupNavButton.click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
  });

  test('mobile viewport maintains accessible chat input and interactive pills [Mobile Responsive]', async ({ browser }) => {
    /**
     * Mobile Responsiveness: Emulates a mobile device (iPhone 14, 390x844) to ensure
     * that chat inputs, topic buttons, and layout adapt cleanly to small viewports.
     */
    const mobileContext = await browser.newContext({
      ...devices['iPhone 14'],
    });
    const mobilePage = await mobileContext.newPage();
    const mobileApp = new PermissionAgentApp(mobilePage);

    try {
      await mobileApp.loadAndPrepareSession();
      await mobileApp.dismissOneTrustConsent(3_000);

      // Verify suggested topic pills render and adapt
      const firstTopicPill = mobileApp.getTopicPill(EXPLORE_TOPICS[0]);
      await expect(firstTopicPill).toBeVisible();

      // Verify chat input is visible and interactive in mobile viewport
      await expect(mobileApp.chatInput).toBeVisible();
      await mobileApp.chatInput.click();
      await mobileApp.chatInput.fill('Checking mobile layout responsiveness');
      expect(await mobileApp.chatInput.inputValue()).toBe('Checking mobile layout responsiveness');
    } finally {
      await mobileContext.close();
    }
  });
});
