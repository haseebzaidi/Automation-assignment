import { test, expect } from '@playwright/test';
import {
  navigateToChatHome,
  getSuggestedTopicPill,
  sendUserPrompt,
  awaitSettledAgentReply,
  hasServerErrorIndicator,
} from './helpers/chatActions';
import { CHAT_SELECTORS } from './helpers/selectors';
import { ModelResponseEvaluator } from './helpers/llmEvaluator';

test.describe('Generative Agent Responses & Non-Deterministic Validation', () => {
  test('clicking a suggested topic pill produces an agent response [Required #2]', async ({ page }) => {
    /**
     * Requirement: Clicking a suggested topic produces an agent response.
     * Interacts with "Best way to earn ASK" topic pill.
     */
    await navigateToChatHome(page);

    const selectedTopic = 'Best way to earn ASK';
    const pill = getSuggestedTopicPill(page, selectedTopic);
    await pill.click();

    const responseContent = await awaitSettledAgentReply(page);

    // Verify response container is rendered
    const responseBubbles = page.locator(CHAT_SELECTORS.agentMessageBubble);
    expect(await responseBubbles.count()).toBeGreaterThanOrEqual(1);

    // Verify response validity: non-empty and devoid of backend error bubbles
    expect(responseContent.length).toBeGreaterThan(0);
    expect(hasServerErrorIndicator(responseContent)).toBe(false);
  });

  test('submitting a free-text question produces an agent response [Required #3]', async ({ page }) => {
    /**
     * Requirement: Submitting a free-text question via the ASK input produces an agent response.
     */
    await navigateToChatHome(page);

    const customQuestion = 'How can users monetize their browsing activity using Permission tokens?';
    await sendUserPrompt(page, customQuestion);

    const responseContent = await awaitSettledAgentReply(page);

    // Verify response bubble presence in UI
    const responseBubbles = page.locator(CHAT_SELECTORS.agentMessageBubble);
    expect(await responseBubbles.count()).toBeGreaterThanOrEqual(1);

    // Verify response integrity
    expect(responseContent.length).toBeGreaterThan(0);
    expect(hasServerErrorIndicator(responseContent)).toBe(false);
  });

  test('validates non-deterministic response for "What is Permission" with LLM evaluation check [Part 2]', async ({ page }) => {
    /**
     * Part 2: Non-deterministic response validation.
     * Evaluates output against semantic assertions and the automated LLM evaluation framework.
     */
    await navigateToChatHome(page);

    const testPrompt = 'What is Permission';
    const pill = getSuggestedTopicPill(page, testPrompt);
    await pill.click();

    const reply = await awaitSettledAgentReply(page);
    const normalizedReply = reply.toLowerCase();

    // 1. Structural depth assertion (ensures answer is sufficiently complete, not an empty stub)
    expect(reply.length).toBeGreaterThanOrEqual(40);

    // 2. Exception / crash protection (validates absence of HTTP 500 fallback bubbles)
    expect(hasServerErrorIndicator(reply)).toBe(false);

    // 3. Domain ontology grounding (must touch on core concepts: permission, data, earn, tokens, etc.)
    const domainLexicon = ['permission', 'data', 'earn', 'ask', 'token', 'agent', 'reward'];
    const containsDomainConcept = domainLexicon.some((term) => normalizedReply.includes(term));
    expect(containsDomainConcept).toBe(true);

    // 4. Mirroring rejection (response must not simply repeat the prompt)
    expect(normalizedReply.trim()).not.toBe(testPrompt.toLowerCase());

    // 5. Automated LLM Evaluation Metric Check (Part 2 requirement)
    const evalScore = ModelResponseEvaluator.evaluateResponseRelevance(testPrompt, reply, 0.70);
    expect(
      evalScore.passed,
      `LLM Evaluation Score (${evalScore.score}) fell below threshold (${evalScore.minThreshold}). Findings: ${evalScore.findings.join(' | ')}`
    ).toBe(true);
    expect(evalScore.score).toBeGreaterThanOrEqual(0.70);
  });
});
