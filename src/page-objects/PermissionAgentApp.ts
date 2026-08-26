import { Page, Locator, expect } from '@playwright/test';
import { EXPLORE_TOPICS, ExploreTopic } from '../types/chat.types';

/**
 * Page Object encapsulating interaction flows and synchronization logic
 * for the public pre-login experience on ask.permission.ai.
 */
export class PermissionAgentApp {
  readonly page: Page;

  // Key interactive elements
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly stopButton: Locator;
  readonly loginNavButton: Locator;
  readonly signupNavButton: Locator;
  readonly messageContainers: Locator;
  readonly messageContents: Locator;

  // Consent modal
  private readonly cookieRejectButton: Locator;

  // Server error signatures
  private static readonly CRASH_SIGNATURES = [
    'i ran into an issue',
    'something went wrong',
    'please try again',
    'error occurred',
  ];

  constructor(page: Page) {
    this.page = page;
    this.chatInput = page.locator('[data-testid="agent-chat-input"]');
    this.sendButton = page.locator('[data-testid="agent-chat-input-send-button"]');
    this.stopButton = page.locator('[data-testid="agent-chat-input-stop-button"]');
    this.loginNavButton = page.locator('[data-testid="log-in-button"]');
    this.signupNavButton = page.locator('[data-testid="sign-up-button"]');
    this.messageContainers = page.locator('div.flex.justify-start');
    this.messageContents = page.locator('div.flex.justify-start div.text-md');
    this.cookieRejectButton = page.locator('#onetrust-reject-all-handler, button:has-text("Reject All")');
  }

  /**
   * Gracefully clears the OneTrust consent modal if triggered.
   */
  async dismissOneTrustConsent(timeoutMs: number = 5_000): Promise<void> {
    try {
      if (await this.cookieRejectButton.first().isVisible({ timeout: timeoutMs })) {
        await this.cookieRejectButton.first().click();
        await this.cookieRejectButton.first().waitFor({ state: 'hidden', timeout: 4_000 }).catch(() => {});
      }
    } catch {
      // Modal was not presented in this viewport/session
    }
  }

  /**
   * Navigates to the chat page in a fully interactive, ready state.
   * 
   * Defect mitigation: Suggested topic pills do not mount on cold start (a genuine client-side bug).
   * A single controlled reload resolves hydration, allowing downstream tests to interact reliably.
   */
  async loadAndPrepareSession(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.dismissOneTrustConsent();
    await this.chatInput.waitFor({ state: 'visible', timeout: 25_000 });

    const firstTopic = this.getTopicPill(EXPLORE_TOPICS[0]);
    const isTopicRendered = await firstTopic.isVisible({ timeout: 3_500 }).catch(() => false);

    if (!isTopicRendered) {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.dismissOneTrustConsent();
      await this.chatInput.waitFor({ state: 'visible', timeout: 25_000 });
      await firstTopic.waitFor({ state: 'visible', timeout: 25_000 });
    }
  }

  /**
   * Navigates to the chat page directly without reload to evaluate initial paint behavior.
   */
  async loadInitialViewUncached(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.dismissOneTrustConsent();
    await this.chatInput.waitFor({ state: 'visible', timeout: 25_000 });
  }

  /**
   * Locates a topic pill button by text.
   */
  getTopicPill(topic: ExploreTopic | string): Locator {
    return this.page.getByRole('button', { name: topic, exact: true });
  }

  /**
   * Clicks a suggested topic pill.
   */
  async selectTopic(topic: ExploreTopic | string): Promise<void> {
    const pill = this.getTopicPill(topic);
    await pill.click();
  }

  /**
   * Enters a custom prompt into the ASK input and triggers send.
   */
  async askFreeformQuestion(question: string): Promise<void> {
    await this.chatInput.click();
    await this.chatInput.fill(question);
    await expect(this.sendButton).toBeEnabled();
    await this.sendButton.click();
  }

  /**
   * Fetches text from the most recent agent message container.
   */
  async getLatestResponseText(): Promise<string> {
    const count = await this.messageContents.count();
    if (count === 0) return '';
    const text = await this.messageContents.last().innerText();
    return text.trim();
  }

  /**
   * Synchronizes with the agent's generative response stream.
   * 
   * Strategy:
   * 1. Awaits transition of send button -> stop button -> send button.
   * 2. Polls output container for text quiescence (stable token length across intervals).
   */
  async waitForGenerationComplete(timeoutMs: number = 60_000): Promise<string> {
    await this.stopButton.waitFor({ state: 'visible', timeout: 6_000 }).catch(() => {});
    await this.stopButton.waitFor({ state: 'detached', timeout: timeoutMs });
    await expect(this.sendButton).toBeVisible({ timeout: timeoutMs });

    return await this.settleResponseText(25_000);
  }

  /**
   * Polls response container until text remains stable across consecutive checks.
   */
  private async settleResponseText(maxWaitMs: number = 25_000, pollIntervalMs: number = 400): Promise<string> {
    const cutoff = Date.now() + maxWaitMs;
    let priorContent = '';
    let stableChecks = 0;

    while (Date.now() < cutoff) {
      const currentContent = await this.getLatestResponseText();
      if (currentContent.length > 0 && currentContent === priorContent) {
        stableChecks++;
        if (stableChecks >= 2) {
          return currentContent;
        }
      } else {
        stableChecks = 0;
      }
      priorContent = currentContent;
      await this.page.waitForTimeout(pollIntervalMs);
    }

    return priorContent;
  }

  /**
   * Evaluates if text contains server error or crash fallback messages.
   */
  isSystemErrorBubble(text: string): boolean {
    const lower = text.toLowerCase();
    return PermissionAgentApp.CRASH_SIGNATURES.some((sig) => lower.includes(sig));
  }
}
