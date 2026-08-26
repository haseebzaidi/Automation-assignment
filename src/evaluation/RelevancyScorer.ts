import { SemanticScoreCard } from '../types/chat.types';

/**
 * Evaluator for validating non-deterministic generative LLM outputs.
 * Follows DeepEval / Promptfoo answer-relevancy principles.
 */
export class RelevancyScorer {
  private static readonly PASSING_THRESHOLD = 0.70;

  // Domain ontology maps for supported evaluation topics
  private static readonly DOMAIN_TOPIC_MAP: Record<string, string[]> = {
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
      'extension',
      'shopping',
      'ads',
      'daily',
      'activity',
    ],
    'what is passive earning': [
      'passive',
      'earn',
      'data',
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
    ],
  };

  /**
   * Evaluates response relevance, depth, entity density, and anti-echoing.
   */
  public static evaluateResponse(
    prompt: string,
    responseText: string,
    threshold: number = RelevancyScorer.PASSING_THRESHOLD
  ): SemanticScoreCard {
    const notes: string[] = [];
    const normPrompt = prompt.toLowerCase().trim();
    const normResponse = responseText.toLowerCase().trim();

    // 1. Anti-Echo Originality Check
    let originalityVsPrompt = 1.0;
    if (normResponse === normPrompt) {
      originalityVsPrompt = 0.0;
      notes.push('Response duplicated prompt text verbatim.');
    } else if (normResponse.startsWith(normPrompt) && normResponse.length < normPrompt.length + 20) {
      originalityVsPrompt = 0.3;
      notes.push('Response is a near-identical echo with minimal addition.');
    }

    // 2. Depth & Structure Check
    let depthAndStructure = 0.0;
    if (normResponse.length >= 100) {
      depthAndStructure = 1.0;
    } else if (normResponse.length >= 50) {
      depthAndStructure = 0.8;
    } else if (normResponse.length >= 25) {
      depthAndStructure = 0.4;
      notes.push('Response is unusually short (<50 chars).');
    } else {
      depthAndStructure = 0.0;
      notes.push('Response is an empty or truncated stub.');
    }

    // 3. Fault Resilience Check
    let faultResilience = 1.0;
    const errorKeywords = ['i ran into an issue', 'something went wrong', 'please try again', 'internal error'];
    if (errorKeywords.some((err) => normResponse.includes(err))) {
      faultResilience = 0.0;
      notes.push('Response contains a system error message.');
    }

    // 4. Domain Entity Coverage Check
    let entityCoverage = 0.0;
    const targetEntities = RelevancyScorer.DOMAIN_TOPIC_MAP[normPrompt] || ['permission', 'data', 'earn', 'ask'];
    const matched = targetEntities.filter((entity) => normResponse.includes(entity));

    if (matched.length >= 3) {
      entityCoverage = 1.0;
    } else if (matched.length >= 2) {
      entityCoverage = 0.85;
    } else if (matched.length === 1) {
      entityCoverage = 0.5;
      notes.push(`Only single domain entity ('${matched[0]}') referenced.`);
    } else {
      entityCoverage = 0.0;
      notes.push(`No expected domain entities found for topic '${prompt}'.`);
    }

    // Weighted composite calculation
    const weightedTotal =
      entityCoverage * 0.40 +
      depthAndStructure * 0.25 +
      originalityVsPrompt * 0.20 +
      faultResilience * 0.15;

    const totalScore = Math.round(weightedTotal * 100) / 100;
    const isAcceptable = totalScore >= threshold;

    return {
      totalScore,
      isAcceptable,
      threshold,
      criteria: {
        entityCoverage,
        depthAndStructure,
        originalityVsPrompt,
        faultResilience,
      },
      notes,
    };
  }
}
