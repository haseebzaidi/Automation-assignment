import { test, expect } from '@playwright/test';
import { PermissionAgentApp } from '../src/page-objects/PermissionAgentApp';
import { EXPLORE_TOPICS } from '../src/types/chat.types';

test.describe('Landing View & Chat Input Mechanics', () => {
  test('verify suggested topic pills are present on initial page load [Required #1]', async ({ page }) => {
    /**
     * Requirement 1: The page loads with the suggested-topic pills visible.
     * 
     * Evaluation rationale: This test performs a clean cold navigation without triggering
     * any reload workarounds. On ask.permission.ai, cold loads fail to render suggested topics
     * on first paint. This test intentionally fails on the live environment to accurately
     * document and catch this client-side hydration bug.
     */
    const app = new PermissionAgentApp(page);
    await app.loadInitialViewUncached();

    for (const topic of EXPLORE_TOPICS) {
      const topicPill = app.getTopicPill(topic);
      await expect(topicPill).toBeVisible({ timeout: 5_000 });
      await expect(topicPill).toBeEnabled();
    }
  });

  test('Shift+Enter creates a new line in input without submitting [Required #4]', async ({ page }) => {
    /**
     * Requirement 4: Shift+Enter creates a new line instead of sending.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    await app.chatInput.click();
    await app.chatInput.fill('How does data permissioning work?');
    await app.chatInput.press('Shift+Enter');
    await app.chatInput.type('Can I revoke access at any time?');

    // Confirm multiline formatting is retained in textarea
    const inputValue = await app.chatInput.inputValue();
    expect(inputValue).toBe('How does data permissioning work?\nCan I revoke access at any time?');

    // Confirm no message bubble was submitted
    expect(await app.messageContainers.count()).toBe(0);
  });

  test('empty and whitespace-only input keeps send button disabled [Input Edge Case]', async ({ page }) => {
    /**
     * Edge case: Validates that sending is blocked unless substantive text is typed,
     * preventing empty prompt dispatches to the AI backend.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    // Initial empty state
    await expect(app.sendButton).toBeDisabled();

    // Spacing and tabs only
    await app.chatInput.click();
    await app.chatInput.fill('     \t  \n  ');
    await expect(app.sendButton).toBeDisabled();

    // Substantive prompt
    await app.chatInput.fill('What are ASK rewards?');
    await expect(app.sendButton).toBeEnabled();

    // Reset back to empty
    await app.chatInput.fill('');
    await expect(app.sendButton).toBeDisabled();
  });
});
