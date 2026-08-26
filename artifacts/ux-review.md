# UX & Product Defect Review — ask.permission.ai

Evaluated on Desktop (Chromium 1280x800) and Mobile Responsive Emulation (iPhone 14, 390x844). Thoroughly explored pre-login chat mechanics, prompt boundaries, session lifecycle, registration flows, and the post-signup portal.

## Overview

- **What Works:** Fluid response streaming, clean responsive layout collapsing, and immediate interactive feedback on standard queries.
- **What Is Rough:** Critical unhandled edge cases in the chat frontend, complete absence of session persistence, silent character limits, and severe email verification lockouts.

## Prioritized Improvements (Most Critical First)

### 1. High (P1): Account Lockout on Verification Screen
- **Observation:** Following registration, users are gated on the email verification screen. Navigating back, refreshing, or visiting `/login` immediately redirects back to the verification lock.
- **Why It Matters:** Users who mistype their email cannot restart onboarding, permanently killing conversion.
- **Proposed Fix:** Add an explicit "Use a different email" or "Sign out" action on the verification waiting page.

### 2. High (P2): Cold First-Paint Topic Hydration Failure
- **Observation:** On cold session loads, the agent greeting renders, but suggested topic pills remain completely unmounted until an explicit browser reload.
- **Why It Matters:** Brand new visitors land without clickable exploration hooks, suppressing engagement.
- **Proposed Fix:** Co-locate suggested topic state with the initial greeting SSR payload.

### 3. Medium (P3): Silent Send Button Disablement on Large Prompts Without Feedback
- **Observation:** Pasting queries over ~1,000 characters silently disables the Send button without displaying a character counter, limit indicator, or warning tooltip.
- **Why It Matters:** Users believe the application froze or broke without understanding why they cannot submit.
- **Proposed Fix:** Introduce an active character counter (`X / 1000`) and a clear validation banner when exceeding limits.

### 4. Medium (P4): Code/Tag Inputs Trigger Unhandled Backend Crash Bubbles
- **Observation:** Prompts containing HTML or script tags (e.g. `<script>`, `<b>`) crash the backend API, rendering an unhelpful `"I ran into an issue"` bubble.
- **Why It Matters:** Technical users asking development or security questions encounter repeated failures.
- **Proposed Fix:** Sanitize input tokens on the API gateway before dispatching to the LLM agent.

### 5. Low (P5): Conflicting Footer Domain Links
- **Observation:** Footer navigation duplicates "Privacy Policy" and "Terms of Use", linking inconsistently to `permission.ai` and `permission.io`.
- **Proposed Fix:** Unify company domain naming across legal links.
