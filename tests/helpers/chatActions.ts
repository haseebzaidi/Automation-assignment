import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS, SUGGESTED_TOPICS, ERROR_MARKERS } from './selectors';

/**
 * Dismisses the OneTrust cookie banner if it renders.
 * The banner loads asynchronously, so we handle it with a brief timeout without failing.
 */
export async function dismissCookieBanner(page: Page, timeoutMs: number = 6_000): Promise<void> {
  const rejectBtn = page.locator(SELECTORS.COOKIE_REJECT_BUTTON).first();
  try {
    if (await rejectBtn.isVisible({ timeout: timeoutMs })) {
      await rejectBtn.click();
      await rejectBtn.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
  } catch {
    // Banner did not appear; continue safely.
  }
}

/**
 * Navigates to the landing page in a ready, interactive state.
 * 
 * Known application defect: suggested topic pills do not render on first paint
 * during cold loads. To allow downstream functional tests to proceed reliably,
 * this helper performs a single conditional reload if pills are absent.
 */
export async function openLanding(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissCookieBanner(page);

  const input = page.locator(SELECTORS.INPUT);
  await input.waitFor({ state: 'visible', timeout: 30_000 });

  const firstPill = getTopicPill(page, SUGGESTED_TOPICS[0]);
  const isPillVisible = await firstPill.isVisible({ timeout: 4_000 }).catch(() => false);

  if (!isPillVisible) {
    // Perform single reload workaround to mount suggested topic pills
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    await input.waitFor({ state: 'visible', timeout: 30_000 });
    await firstPill.waitFor({ state: 'visible', timeout: 30_000 });
  }
}

/**
 * Navigates to the landing page without reload.
 * Used exclusively by the first-load smoke test to evaluate genuine first-visit behavior.
 */
export async function openLandingDirect(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissCookieBanner(page);
  await page.locator(SELECTORS.INPUT).waitFor({ state: 'visible', timeout: 30_000 });
}

/**
 * Returns a Locator for a suggested topic pill by its exact text.
 */
export function getTopicPill(page: Page, topic: string): Locator {
  return page.getByRole('button', { name: topic, exact: true });
}

/**
 * Enters a free-text question into the ASK input and clicks the send button.
 */
export async function submitFreeText(page: Page, queryText: string): Promise<void> {
  const input = page.locator(SELECTORS.INPUT);
  const sendButton = page.locator(SELECTORS.SEND_BUTTON);

  await input.click();
  await input.fill(queryText);
  await expect(sendButton).toBeEnabled();
  await sendButton.click();
}

/**
 * Retrieves the inner text of the latest agent response bubble.
 */
export async function getLatestAgentResponse(page: Page): Promise<string> {
  const bubbles = page.locator(SELECTORS.AGENT_MESSAGE_TEXT);
  const count = await bubbles.count();
  if (count === 0) return '';
  const text = await bubbles.last().innerText();
  return text.trim();
}

/**
 * Waits for the streaming AI response to complete and settle.
 * 
 * Waiting Strategy (Deterministic Event-Driven + Quiescence):
 * 1. The UI swaps the Send button for a Stop button during generation.
 * 2. We wait for the Stop button to detach and the Send button to reappear.
 * 3. We poll the response text until length stabilizes across multiple samples (quiescence),
 *    preventing race conditions with partial streaming tokens.
 */
export async function waitForAgentResponse(page: Page, timeoutMs: number = 60_000): Promise<string> {
  const stopButton = page.locator(SELECTORS.STOP_BUTTON);
  const sendButton = page.locator(SELECTORS.SEND_BUTTON);

  // Catch the stop button appearing (best-effort since fast responses might transition quickly)
  await stopButton.waitFor({ state: 'visible', timeout: 6_000 }).catch(() => {});

  // Wait for generation to complete (stop button detached, send button visible)
  await stopButton.waitFor({ state: 'detached', timeout: timeoutMs });
  await expect(sendButton).toBeVisible({ timeout: timeoutMs });

  // Settle text stream
  return await pollTextSettled(page, 30_000);
}

/**
 * Polls the latest agent bubble until its content stops changing across samples.
 */
async function pollTextSettled(page: Page, timeoutMs: number = 30_000, sampleIntervalMs: number = 400): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let previousText = '';
  let stableSampleCount = 0;

  while (Date.now() < deadline) {
    const currentText = await getLatestAgentResponse(page);
    if (currentText.length > 0 && currentText === previousText) {
      stableSampleCount++;
      if (stableSampleCount >= 2) {
        return currentText;
      }
    } else {
      stableSampleCount = 0;
    }
    previousText = currentText;
    await page.waitForTimeout(sampleIntervalMs);
  }

  return previousText;
}

/**
 * Checks whether an agent response matches known failure / crash patterns.
 */
export function isErrorResponse(responseText: string): boolean {
  const normalized = responseText.toLowerCase();
  return ERROR_MARKERS.some((marker) => normalized.includes(marker));
}
