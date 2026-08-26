import { Page, Locator, expect } from '@playwright/test';
import { CHAT_SELECTORS, PROMPT_TOPICS, SERVER_ERROR_PATTERNS, PromptTopic } from './selectors';

/**
 * Gracefully dismisses the asynchronous OneTrust consent dialog if present.
 */
export async function clearConsentModal(page: Page, waitTimeout: number = 5_000): Promise<void> {
  const reject = page.locator(CHAT_SELECTORS.cookieRejectBtn).first();
  try {
    if (await reject.isVisible({ timeout: waitTimeout })) {
      await reject.click();
      await reject.waitFor({ state: 'hidden', timeout: 4_000 }).catch(() => {});
    }
  } catch {
    // Cookie banner was not triggered or already handled
  }
}

/**
 * Loads the pre-login chat interface in a stable, ready state.
 * 
 * Note: On cold sessions, the web app's initial hydration fails to render topic pills.
 * A single controlled page reload mounts them properly, allowing downstream tests to interact.
 */
export async function navigateToChatHome(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await clearConsentModal(page);

  const inputArea = page.locator(CHAT_SELECTORS.chatTextarea);
  await inputArea.waitFor({ state: 'visible', timeout: 25_000 });

  const samplePill = getSuggestedTopicPill(page, PROMPT_TOPICS[0]);
  const pillRendered = await samplePill.isVisible({ timeout: 3_500 }).catch(() => false);

  if (!pillRendered) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await clearConsentModal(page);
    await inputArea.waitFor({ state: 'visible', timeout: 25_000 });
    await samplePill.waitFor({ state: 'visible', timeout: 25_000 });
  }
}

/**
 * Pure cold load of the landing page without reload.
 * Used exclusively by test 1 to expose the initial mounting defect.
 */
export async function navigateColdLanding(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await clearConsentModal(page);
  await page.locator(CHAT_SELECTORS.chatTextarea).waitFor({ state: 'visible', timeout: 25_000 });
}

/**
 * Returns a Locator for a specific topic pill button.
 */
export function getSuggestedTopicPill(page: Page, topic: PromptTopic | string): Locator {
  return page.getByRole('button', { name: topic, exact: true });
}

/**
 * Types a custom prompt into the ASK input and triggers submission via the send button.
 */
export async function sendUserPrompt(page: Page, messageText: string): Promise<void> {
  const textarea = page.locator(CHAT_SELECTORS.chatTextarea);
  const sendBtn = page.locator(CHAT_SELECTORS.sendPromptButton);

  await textarea.click();
  await textarea.fill(messageText);
  await expect(sendBtn).toBeEnabled();
  await sendBtn.click();
}

/**
 * Retrieves the text content of the latest streamed agent message.
 */
export async function fetchLatestAgentBubbleText(page: Page): Promise<string> {
  const bubbles = page.locator(CHAT_SELECTORS.agentMessageContent);
  const count = await bubbles.count();
  if (count === 0) return '';
  const text = await bubbles.last().innerText();
  return text.trim();
}

/**
 * Deterministically awaits the completion of an agent's streaming response.
 * 
 * Strategy:
 * 1. Watches for the send button to transform into a stop button, then revert when streaming finishes.
 * 2. Employs text stability polling to ensure the full token stream has quiesced before reading.
 */
export async function awaitSettledAgentReply(page: Page, streamTimeout: number = 60_000): Promise<string> {
  const stopBtn = page.locator(CHAT_SELECTORS.stopStreamingButton);
  const sendBtn = page.locator(CHAT_SELECTORS.sendPromptButton);

  // Monitor the stop button lifecycle
  await stopBtn.waitFor({ state: 'visible', timeout: 6_000 }).catch(() => {});
  await stopBtn.waitFor({ state: 'detached', timeout: streamTimeout });
  await expect(sendBtn).toBeVisible({ timeout: streamTimeout });

  // Await text stream stability (quiescence)
  return await verifyTextStability(page, 25_000);
}

/**
 * Polls the newest message until text remains stable across consecutive intervals.
 */
async function verifyTextStability(page: Page, maxWaitMs: number = 25_000, stepMs: number = 400): Promise<string> {
  const deadline = Date.now() + maxWaitMs;
  let prevText = '';
  let consecutiveMatches = 0;

  while (Date.now() < deadline) {
    const currentText = await fetchLatestAgentBubbleText(page);
    if (currentText.length > 0 && currentText === prevText) {
      consecutiveMatches++;
      if (consecutiveMatches >= 2) {
        return currentText;
      }
    } else {
      consecutiveMatches = 0;
    }
    prevText = currentText;
    await page.waitForTimeout(stepMs);
  }

  return prevText;
}

/**
 * Validates that the response is not a generic server crash or error bubble.
 */
export function hasServerErrorIndicator(text: string): boolean {
  const lower = text.toLowerCase();
  return SERVER_ERROR_PATTERNS.some((marker) => lower.includes(marker));
}
