# AI Workflow Disclosure

## 1. AI Tools Used & Rationale
- **Claude 3.7 / Cursor:** Employed for initial TypeScript scaffolding, interface design, and structuring evaluation types. Selected for superior architectural depth, strong TypeScript ecosystem knowledge, and contextual code generation compared to generic auto-completers.
- **Playwright CLI & Network DevTools:** Used by hand to inspect real DOM attributes, verify `data-testid` properties, and analyze `/api/agent/ask-unauthenticated` requests. I chose direct manual inspection over letting an LLM guess selectors, preventing hallucinated locators.

## 2. Generated vs. Rewritten/Refactored
- **AI-Generated:** Base TypeScript interfaces (`SemanticScoreCard`), Playwright configuration boilerplate, and initial markdown section outlines.
- **Rewritten / Refactored:** Completely rewrote the synchronization logic in `PermissionAgentApp`, replaced static timeouts with dynamic stop/send button lifecycle tracking and text quiescence polling, and restructured the suite into modular Page Objects.

## 3. One Specific AI Mistake Caught
The AI assumed suggested topic pills mount immediately upon `page.goto()` and generated simple visibility assertions that failed. Investigating the live app revealed that topic pills fail to hydrate on cold first load (a real client defect). 

The AI's proposed "fix" was an indiscriminate `page.reload()` loop before every action. I rejected that brute-force loop and instead:
1. Isolated a dedicated smoke test to deliberately check the cold first-paint state and expose the bug.
2. Built a controlled, single-reload preparation helper (`loadAndPrepareSession`) so remaining functional tests execute predictably.

## 4. Built by Hand / Untrusted to AI
- **Test Prioritization:** Selecting the exact 8 high-impact tests (core specs, input boundaries, routing, and mobile viewport).
- **Waiting & Quiescence Architecture:** Designing the dual-phase event-driven completion monitor (button state swap + token settlement).
- **Product UX Impact:** Evaluating real post-signup friction (verification lockout, wallet progress discrepancies) and ordering improvements by business impact.
