import { test, expect } from '@playwright/test';
import { PermissionAgentApp } from '../src/page-objects/PermissionAgentApp';
import { EXPLORE_TOPICS } from '../src/types/chat.types';

test.describe('Landing View & Chat Input Mechanics', () => {
  test('verify suggested topic pills are present and interactive [Required #1]', async ({ page }) => {
    /**
     * Requirement 1: The page loads with the suggested-topic pills visible.
     * 
     * Verifies that all 6 suggested topic pills ('What is Permission', 'Best way to earn ASK', etc.)
     * are rendered, visible, and enabled for user interaction.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    for (const topic of EXPLORE_TOPICS) {
      const topicPill = app.getTopicPill(topic);
      await expect(topicPill).toBeVisible({ timeout: 10_000 });
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
     * Input Boundary Test: Validates that sending is blocked unless substantive text is typed,
     * preventing empty prompt dispatches to the AI backend.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    // 1. Initial empty state: send button disabled
    await expect(app.sendButton).toBeDisabled();

    // 2. Whitespace only (spaces, tabs, newlines): send button remains disabled
    await app.chatInput.click();
    await app.chatInput.fill('     \t  \n  ');
    await expect(app.sendButton).toBeDisabled();

    // 3. Substantive prompt: send button becomes enabled
    await app.chatInput.fill('What are ASK rewards and how do I earn them?');
    await expect(app.sendButton).toBeEnabled();

    // 4. Cleared back to empty: send button reverts to disabled
    await app.chatInput.fill('');
    await expect(app.sendButton).toBeDisabled();
  });
});
