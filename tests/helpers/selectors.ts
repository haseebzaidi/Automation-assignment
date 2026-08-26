/**
 * Centralized UI locators, topics, and error markers for the ask.permission.ai test suite.
 * 
 * Uses resilient data-testid attributes for interactive inputs and authentication triggers.
 * Layout classes are leveraged for dynamic streaming message containers.
 */

export const CHAT_SELECTORS = {
  // Chat input field & action buttons
  chatTextarea: '[data-testid="agent-chat-input"]',
  sendPromptButton: '[data-testid="agent-chat-input-send-button"]',
  stopStreamingButton: '[data-testid="agent-chat-input-stop-button"]',

  // Authentication routes
  loginNavButton: '[data-testid="log-in-button"]',
  signupNavButton: '[data-testid="sign-up-button"]',

  // Agent message stream containers
  agentMessageBubble: 'div.flex.justify-start',
  agentMessageContent: 'div.flex.justify-start div.text-md',

  // Page header & branding
  agentHeaderTitle: '[data-testid="ai-page-title"]',
  agentHeaderSubtitle: '[data-testid="ai-page-description"]',

  // Consent banner
  cookieRejectBtn: '#onetrust-reject-all-handler, button:has-text("Reject All")',
} as const;

export const PROMPT_TOPICS = [
  'What is Permission',
  'Best way to earn ASK',
  'How permission uses my data',
  'What is passive earning',
  'What is data ownership',
  'Permission Wallet',
] as const;

export type PromptTopic = typeof PROMPT_TOPICS[number];

/**
 * Known fallback error strings emitted when the backend AI microservice fails.
 */
export const SERVER_ERROR_PATTERNS: readonly string[] = [
  'i ran into an issue',
  'something went wrong',
  'please try again',
  'error occurred',
];
