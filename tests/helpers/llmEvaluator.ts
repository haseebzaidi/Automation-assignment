/**
 * LLM Evaluation Engine for Non-Deterministic Generative Responses.
 * 
 * Provides automated semantic scoring inspired by modern evaluation frameworks
 * (Promptfoo, DeepEval). Grades streamed model responses across semantic relevance,
 * topical density, structural completeness, and absence of echo artifacts.
 */

export interface EvalScoreBreakdown {
  domainGrounding: number;
  substantiveCompleteness: number;
  promptOriginality: number;
  faultTolerance: number;
}

export interface RelevancyEvaluationReport {
  score: number;
  passed: boolean;
  minThreshold: number;
  breakdown: EvalScoreBreakdown;
  findings: string[];
}

export class ModelResponseEvaluator {
  private static readonly ACCEPTANCE_THRESHOLD = 0.70;

  // Domain concept entity clusters for semantic validation
  private static readonly TOPIC_LEXICON: Record<string, string[]> = {
    'what is permission': [
      'permission',
      'data',
      'ask',
      'token',
      'earn',
      'reward',
      'consent',
      'control',
      'monetize',
      'platform',
      'economy',
    ],
    'best way to earn ask': [
      'ask',
      'earn',
      'reward',
      'data',
      'browser',
      'extension',
      'shopping',
      'ads',
      'daily',
      'activities',
    ],
    'what is passive earning': [
      'passive',
      'earn',
      'data',
      'browser',
      'background',
      'permission',
      'rewards',
      'ask',
      'automatically',
    ],
    'how permission uses my data': [
      'data',
      'privacy',
      'consent',
      'secure',
      'encryption',
      'control',
      'opt-in',
      'advertisers',
      'share',
    ],
  };

  /**
   * Evaluates the non-deterministic output of an AI agent interaction.
   * 
   * @param prompt The submitted prompt or topic pill name.
   * @param response The completed response text from the agent.
   * @param threshold Minimum composite score (defaults to 0.70).
   */
  public static evaluateResponseRelevance(
    prompt: string,
    response: string,
    threshold: number = ModelResponseEvaluator.ACCEPTANCE_THRESHOLD
  ): RelevancyEvaluationReport {
    const findings: string[] = [];
    const cleanPrompt = prompt.toLowerCase().trim();
    const cleanResponse = response.toLowerCase().trim();

    // 1. Anti-Echo Originality Assessment
    let promptOriginality = 1.0;
    if (cleanResponse === cleanPrompt) {
      promptOriginality = 0.0;
      findings.push('Agent returned an identical mirror echo of the prompt.');
    } else if (cleanResponse.startsWith(cleanPrompt) && cleanResponse.length < cleanPrompt.length + 25) {
      promptOriginality = 0.35;
      findings.push('Agent merely reiterated the input phrase with negligible continuation.');
    }

    // 2. Substantive Completeness Assessment
    let substantiveCompleteness = 0.0;
    if (cleanResponse.length >= 120) {
      substantiveCompleteness = 1.0;
    } else if (cleanResponse.length >= 60) {
      substantiveCompleteness = 0.8;
    } else if (cleanResponse.length >= 30) {
      substantiveCompleteness = 0.45;
      findings.push('Response is unusually terse (<60 characters).');
    } else {
      substantiveCompleteness = 0.0;
      findings.push('Response lacks substantive body or is a truncated fragment.');
    }

    // 3. Fault Tolerance & Exception Handling
    let faultTolerance = 1.0;
    const failureSignatures = [
      'i ran into an issue',
      'something went wrong',
      'please try again',
      'internal error',
      'unable to process',
    ];
    if (failureSignatures.some((sig) => cleanResponse.includes(sig))) {
      faultTolerance = 0.0;
      findings.push('Response matches known system exception or fallback strings.');
    }

    // 4. Domain Concept Grounding Assessment
    let domainGrounding = 0.0;
    const targetLexicon = ModelResponseEvaluator.TOPIC_LEXICON[cleanPrompt] || ['permission', 'data', 'earn', 'ask'];
    const matchedConcepts = targetLexicon.filter((concept) => cleanResponse.includes(concept));

    if (matchedConcepts.length >= 3) {
      domainGrounding = 1.0;
    } else if (matchedConcepts.length >= 2) {
      domainGrounding = 0.85;
    } else if (matchedConcepts.length === 1) {
      domainGrounding = 0.5;
      findings.push(`Only a single domain concept ('${matchedConcepts[0]}') was referenced.`);
    } else {
      domainGrounding = 0.0;
      findings.push(`No domain concepts matched the expected lexicon for '${prompt}'.`);
    }

    // Weighted composite relevancy calculation
    const compositeScore =
      domainGrounding * 0.40 +
      substantiveCompleteness * 0.25 +
      promptOriginality * 0.20 +
      faultTolerance * 0.15;

    const finalScore = Math.round(compositeScore * 100) / 100;
    const passed = finalScore >= threshold;

    return {
      score: finalScore,
      passed,
      minThreshold: threshold,
      breakdown: {
        domainGrounding,
        substantiveCompleteness,
        promptOriginality,
        faultTolerance,
      },
      findings,
    };
  }
}
