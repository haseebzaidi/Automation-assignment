/**
 * Type definitions for Permission.ai chat agent automation suite.
 */

export const EXPLORE_TOPICS = [
  'What is Permission',
  'Best way to earn ASK',
  'How permission uses my data',
  'What is passive earning',
  'What is data ownership',
  'Permission Wallet',
] as const;

export type ExploreTopic = typeof EXPLORE_TOPICS[number];

export interface SemanticScoreCard {
  totalScore: number;
  isAcceptable: boolean;
  threshold: number;
  criteria: {
    entityCoverage: number;
    depthAndStructure: number;
    originalityVsPrompt: number;
    faultResilience: number;
  };
  notes: string[];
}
