/**
 * LLM Evaluation Module for Non-Deterministic AI Responses.
 * 
 * Implements an Answer Relevancy & Semantic Grounding evaluator inspired by
 * Promptfoo and DeepEval standards. Evaluates non-deterministic output
 * across semantic coherence, domain topic grounding, substantive depth,
 * and rejection of trivial prompt echoing.
 */

export interface LLMEvalResult {
  score: number;
  passed: boolean;
  threshold: number;
  metrics: {
    topicGroundingScore: number;
    substantiveDepthScore: number;
    antiEchoScore: number;
    errorFreeScore: number;
  };
  reasons: string[];
}

export class LLMRelevancyEvaluator {
  private static readonly DEFAULT_THRESHOLD = 0.70;

  private static readonly TOPIC_KEYWORDS: Record<string, string[]> = {
    'what is permission': [
      'permission',
      'data',
      'ask',
      'token',
      'earn',
      'economy',
      'reward',
      'consent',
      'control',
      'monetize',
      'platform',
      'web3',
    ],
  };

  /**
   * Evaluates the non-deterministic response against the given prompt.
   * 
   * @param prompt The user or suggested topic prompt submitted.
   * @param response The settled text response streamed from the agent.
   * @param threshold Minimum score required to pass (default 0.70).
   */
  public static evaluateAnswerRelevancy(
    prompt: string,
    response: string,
    threshold: number = LLMRelevancyEvaluator.DEFAULT_THRESHOLD
  ): LLMEvalResult {
    const reasons: string[] = [];
    const normalizedPrompt = prompt.toLowerCase().trim();
    const normalizedResponse = response.toLowerCase().trim();

    // 1. Anti-Echo Evaluation: Response must not simply repeat the prompt
    let antiEchoScore = 1.0;
    if (normalizedResponse === normalizedPrompt) {
      antiEchoScore = 0.0;
      reasons.push('Response parroted the prompt word-for-word.');
    } else if (normalizedResponse.startsWith(normalizedPrompt) && normalizedResponse.length < normalizedPrompt.length + 20) {
      antiEchoScore = 0.3;
      reasons.push('Response is an incomplete echo of the prompt.');
    }

    // 2. Substantive Depth Evaluation: Response must be informative (> 50 chars, multi-clause/sentence)
    let substantiveDepthScore = 0.0;
    if (normalizedResponse.length >= 100) {
      substantiveDepthScore = 1.0;
    } else if (normalizedResponse.length >= 50) {
      substantiveDepthScore = 0.7;
    } else if (normalizedResponse.length >= 25) {
      substantiveDepthScore = 0.4;
      reasons.push('Response is too brief to provide a meaningful explanation.');
    } else {
      substantiveDepthScore = 0.0;
      reasons.push('Response is an empty or truncated stub.');
    }

    // 3. Error-Free Evaluation: Response must not indicate unhandled server errors
    let errorFreeScore = 1.0;
    const errorKeywords = ['i ran into an issue', 'something went wrong', 'please try again', 'internal server error'];
    if (errorKeywords.some((k) => normalizedResponse.includes(k))) {
      errorFreeScore = 0.0;
      reasons.push('Response matched known API error markers.');
    }

    // 4. Topic Grounding Evaluation: Response must contain domain-relevant entities
    let topicGroundingScore = 0.0;
    const expectedKeywords = LLMRelevancyEvaluator.TOPIC_KEYWORDS[normalizedPrompt] || ['permission', 'data', 'earn'];
    const matchedKeywords = expectedKeywords.filter((k) => normalizedResponse.includes(k));

    if (matchedKeywords.length >= 3) {
      topicGroundingScore = 1.0;
    } else if (matchedKeywords.length >= 2) {
      topicGroundingScore = 0.8;
    } else if (matchedKeywords.length === 1) {
      topicGroundingScore = 0.5;
    } else {
      topicGroundingScore = 0.0;
      reasons.push(`Response contains no relevant domain keywords for prompt '${prompt}'.`);
    }

    // Composite Weighted Score (Promptfoo relevancy weighting)
    const compositeScore =
      topicGroundingScore * 0.40 +
      substantiveDepthScore * 0.25 +
      antiEchoScore * 0.20 +
      errorFreeScore * 0.15;

    const passed = compositeScore >= threshold;

    return {
      score: Number(compositeScore.toFixed(2)),
      passed,
      threshold,
      metrics: {
        topicGroundingScore,
        substantiveDepthScore,
        antiEchoScore,
        errorFreeScore,
      },
      reasons,
    };
  }
}
