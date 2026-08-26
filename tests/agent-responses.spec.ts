import { test, expect } from '@playwright/test';
import { PermissionAgentApp } from '../src/page-objects/PermissionAgentApp';
import { RelevancyScorer } from '../src/evaluation/RelevancyScorer';

test.describe('Agent Streaming & Non-Deterministic Response Validation', () => {
  test('clicking a suggested topic produces an agent response [Required #2]', async ({ page }) => {
    /**
     * Requirement 2: Clicking a suggested topic produces an agent response.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    await app.selectTopic('Best way to earn ASK');
    const response = await app.waitForGenerationComplete();

    // Verify response bubble is rendered
    expect(await app.messageContainers.count()).toBeGreaterThanOrEqual(1);

    // Verify response integrity
    expect(response.length).toBeGreaterThan(0);
    expect(app.isSystemErrorBubble(response)).toBe(false);
  });

  test('submitting a free-text question produces an agent response [Required #3]', async ({ page }) => {
    /**
     * Requirement 3: Submitting a free-text question via the ASK input produces an agent response.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    const query = 'How can users monetize their browsing activity using Permission tokens?';
    await app.askFreeformQuestion(query);

    const response = await app.waitForGenerationComplete();

    // Verify response bubble presence in UI
    expect(await app.messageContainers.count()).toBeGreaterThanOrEqual(1);

    // Verify response integrity
    expect(response.length).toBeGreaterThan(0);
    expect(app.isSystemErrorBubble(response)).toBe(false);
  });

  test('validates non-deterministic response for "What is Permission" with LLM evaluation check [Part 2]', async ({ page }) => {
    /**
     * Part 2: Non-deterministic response validation.
     * Evaluates output against semantic assertions and the automated LLM evaluation framework.
     */
    const app = new PermissionAgentApp(page);
    await app.loadAndPrepareSession();

    const testPrompt = 'What is Permission';
    await app.selectTopic(testPrompt);

    const reply = await app.waitForGenerationComplete();
    const normalizedReply = reply.toLowerCase();

    // 1. Structural depth assertion (ensures answer is sufficiently complete, not an empty stub)
    expect(reply.length).toBeGreaterThanOrEqual(40);

    // 2. Exception / crash protection (validates absence of HTTP 500 fallback bubbles)
    expect(app.isSystemErrorBubble(reply)).toBe(false);

    // 3. Domain ontology grounding (must touch on core concepts: permission, data, earn, tokens, etc.)
    const domainLexicon = ['permission', 'data', 'earn', 'ask', 'token', 'agent', 'reward'];
    const containsDomainConcept = domainLexicon.some((term) => normalizedReply.includes(term));
    expect(containsDomainConcept).toBe(true);

    // 4. Mirroring rejection (response must not simply repeat the prompt)
    expect(normalizedReply.trim()).not.toBe(testPrompt.toLowerCase());

    // 5. Automated LLM Evaluation Metric Check (Part 2 requirement)
    const evalScore = RelevancyScorer.evaluateResponse(testPrompt, reply, 0.70);
    expect(
      evalScore.isAcceptable,
      `LLM Evaluation Score (${evalScore.totalScore}) fell below threshold (${evalScore.threshold}). Notes: ${evalScore.notes.join(' | ')}`
    ).toBe(true);
    expect(evalScore.totalScore).toBeGreaterThanOrEqual(0.70);
  });
});
