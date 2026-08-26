# UX Review — Desktop & Mobile, Pre- and Post-Signup

Evaluated on Desktop (Chromium 1280x800) and Mobile Responsive Emulation (iPhone 14, 390x844). Explored the full lifecycle: pre-login chat agent, registration, email verification, and the post-signup portal (Wallet, ASK Balance, Data Enrichment Hub).

## Overview

- **What Works:** The streaming chat experience is responsive and smooth. On mobile, header navigation collapses cleanly into a top drawer, and the chat box remains accessible and sticky.
- **What Is Rough:** A stark disconnect exists between the pre-login landing page (an open AI assistant) and the post-signup product (a Web3 data-monetization portal). Critical funnel friction also traps users during email verification.

## Prioritized Improvements

### 1. High (P1): Account Lockout on Verification Screen Without Exit Path
- **Observation:** After signup, users reach the email verification screen. Attempting to visit login/signup routes or reload redirects back to the verification lockscreen.
- **Why It Matters:** Users who mistype their email or wish to switch accounts are permanently blocked, causing direct signup drop-offs.
- **Proposed Fix:** Provide a clear "Use a different email" or "Sign out" option on the verification screen.

### 2. High (P2): Topic Pills Fail to Mount on Initial Landing Paint
- **Observation:** On cold loads, the agent greeting renders, but suggested topic pills do not appear until a manual page reload.
- **Why It Matters:** First-time visitors land without clickable discovery hooks, reducing engagement and trial conversion.
- **Proposed Fix:** Bundle suggested topic mounting with the initial greeting payload rather than relying on secondary client-side state transitions.

### 3. Medium (P3): Conflicting Wallet Milestone Metrics
- **Observation:** The onboarding dashboard awards 100 ASK, displays "2% of minimum reward tier," but cites both "4,900 ASK needed" and a "5,000 ASK" progress cap.
- **Why It Matters:** Discrepancies between 4,900 and 5,000 confuse users and make earning thresholds seem unachievable.
- **Proposed Fix:** Reconcile milestone metrics to 5,000 ASK and introduce incremental progress tiers (e.g., 500 ASK mini-goals).

### 4. Low (P4): Verification Screen Route Flickers
- **Observation:** Clicking the header logo while verification is pending briefly flashes the homepage before snapping back to the gate.
- **Why It Matters:** Creates an unpolished, jarring aesthetic.
- **Proposed Fix:** Disable logo redirect routing when verification is unconfirmed.
