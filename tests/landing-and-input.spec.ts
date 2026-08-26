import { test, expect } from '@playwright/test';
import {
  navigateToChatHome,
  navigateColdLanding,
  getSuggestedTopicPill,
} from './helpers/chatActions';
import { CHAT_SELECTORS, PROMPT_TOPICS } from './helpers/selectors';

test.describe('Pre-Login Landing Page & Textarea Mechanics', () => {
  test('verify suggested topic pills are present on initial page load [Required #1]', async ({ page }) => {
    /**
     * Requirement: The page loads with the suggested-topic pills visible.
     * 
     * Evaluation rationale: This test performs a clean cold navigation without triggering
     * any reload workarounds. On ask.permission.ai, cold loads fail to render suggested topics
     * on first paint. This test intentionally fails on the live environment to accurately
     * document and catch this client-side hydration bug.
     */
    await navigateColdLanding(page);

    for (const topic of PROMPT_TOPICS) {
      const topicPill = getSuggestedTopicPill(page, topic);
      await expect(topicPill).toBeVisible({ timeout: 5_000 });
      await expect(topicPill).toBeEnabled();
    }
  });

  test('pressing Shift+Enter adds a newline without submitting the query [Required #4]', async ({ page }) => {
    /**
     * Requirement: Shift+Enter creates a new line instead of sending.
     */
    await navigateToChatHome(page);

    const textarea = page.locator(CHAT_SELECTORS.chatTextarea);
    await textarea.click();
    await textarea.fill('How does data permissioning work?');
    await textarea.press('Shift+Enter');
    await textarea.type('Can I revoke access at any time?');

    // Confirm multiline text formatting is preserved in the textarea
    const currentInput = await textarea.inputValue();
    expect(currentInput).toBe('How does data permissioning work?\nCan I revoke access at any time?');

    // Confirm no message bubble was submitted or created
    const agentBubbles = page.locator(CHAT_SELECTORS.agentMessageBubble);
    expect(await agentBubbles.count()).toBe(0);
  });

  test('send button is strictly disabled on empty or whitespace input [Input Boundary]', async ({ page }) => {
    /**
     * Input Boundary Test: Validates that sending is blocked unless substantive text is typed,
     * preventing empty prompt dispatches to the AI inference service.
     */
    await navigateToChatHome(page);

    const textarea = page.locator(CHAT_SELECTORS.chatTextarea);
    const sendButton = page.locator(CHAT_SELECTORS.sendPromptButton);

    // Initial empty state
    await expect(sendButton).toBeDisabled();

    // Spacing and tabs only
    await textarea.click();
    await textarea.fill('   \t  \n  ');
    await expect(sendButton).toBeDisabled();

    // Legitimate prompt input
    await textarea.fill('What are ASK rewards?');
    await expect(sendButton).toBeEnabled();

    // Reset back to empty
    await textarea.fill('');
    await expect(sendButton).toBeDisabled();
  });
});
