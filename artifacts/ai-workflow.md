# AI Workflow Disclosure

## 1. AI Tools Used & Rationale
- **Google Antigravity (Antigravity CLI / IDE):** Selected as my primary agentic AI assistant for TypeScript architecture, typing definitions, and evaluation schemas. Chosen over basic autocomplete tools (Copilot/Cursor) for its autonomous reasoning, project context, and multi-step verification capabilities.
- **Playwright CLI & Network DevTools:** Used by hand to inspect live DOM attributes, verify `data-testid` properties, and analyze network payloads.

## 2. Generated vs. Rewritten/Refactored
- **AI-Generated:** Base TypeScript interfaces (`SemanticScoreCard`), Playwright configuration boilerplate, and initial markdown outlines.
- **Rewritten / Refactored:** Completely rewrote the synchronization logic in `PermissionAgentApp`, replaced static timeouts with dynamic stop/send button tracking and text quiescence polling, and structured the suite into modular Page Objects.

## 3. One Specific AI Mistake Caught
The AI initially failed to diagnose why the suggested topic pills test failed on cold first-load, assuming a timeout issue. During live manual testing, **I caught the real client-side hydration defect**:
- **Cold First-Load Defect:** When a user visits `ask.permission.ai` in a fresh session, the app renders the greeting message, but the React/Next.js component tree fails to mount the 6 suggested topic pills on first paint.
- **Secondary State Trigger:** The pills only mount after a secondary client-side state trigger (such as a page reload).
- **The Fix:** I directed the update in `loadAndPrepareSession` to synchronize hydration and ensure pills are mounted, resulting in all 8 tests passing 100% green.

## 4. Built by Hand / Untrusted to AI
- **Test Selection & Prioritization:** Selecting the exact 8 high-impact tests (core specs, input boundaries, routing, mobile viewport).
- **Quiescence Architecture:** Designing the dual-phase event-driven completion monitor.
- **Product UX Impact:** Evaluating real post-signup friction (verification lockout, silent payload limits).
