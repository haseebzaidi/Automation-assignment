# Automation-assignment — Permission.ai QA Challenge

End-to-end test framework and product assessment for the pre-login AI agent on [ask.permission.ai](https://ask.permission.ai), built with **TypeScript** and **Playwright**.

---

## Setup

Requires Node.js 18+ (tested on Node v24).

```bash
# 1. Install dependencies
npm install

# 2. Download Playwright browser binaries
npx playwright install chromium

# 3. Execute the automated test suite (8 tests)
npm test

# 4. View the interactive HTML execution report
npm run test:report
```

Interactive execution modes:
```bash
# Run visibly in Google Chrome with human-friendly pacing (slowMo)
npm run test:chrome

# Open Playwright's interactive Visual UI Test Runner
npm run test:ui
```

---

## Test strategy (TL;DR)

- **Covered (8 Tests):** All 4 required flows (topic pills render, topic selection reply, custom free-text prompt reply, Shift+Enter multiline insertion), input boundaries (whitespace & character limits), authentication routes (/login & /register), and mobile responsive viewport layout (iPhone 14).
- **Non-Deterministic Verification:** Validated streaming responses using structural assertions (length ≥40, error-free, ontology grounding, anti-echoing) and integrated automated LLM relevancy scoring (`RelevancyScorer`).
- **Hydration Synchronization:** Built `loadAndPrepareSession` in the Page Object to synchronize client-side mounting across cold sessions.
- **Skipped by Design:** Flaky exact-string assertions, auth-gated workflows (strictly pre-login scope), combinatorial browser matrices, and artificial sleep timers.

---

## Key decisions

- **Lightweight Page Object Model (`PermissionAgentApp`):** Encapsulates DOM interaction, consent dismissal, and session lifecycle into a single maintainable class without over-engineering.
- **Event-Driven Lifecycle Synchronization:** Awaits the application's native Send↔Stop button swap, followed by multi-sample token quiescence polling to guarantee complete streaming before assertion.
- **Semantic Assertions & LLM Evaluation:** Generative AI responses naturally vary; tests validate structural substance and use `RelevancyScorer` (>0.70 threshold) rather than brittle static text matches.
- **Resilient `data-testid` Locators:** Targets stable application test IDs (`agent-chat-input`, `agent-chat-input-send-button`) rather than transient Tailwind CSS layout classes.
- **Client Hydration Handling:** Mitigates cold-start mounting delays via controlled session preparation, ensuring a deterministic 8/8 pass rate across local and CI runners.
- **Mobile Touch & Viewport Emulation:** Emulates an iPhone 14 (390x844) to verify sticky chat input accessibility and responsive pill layout on small screens.
- **Single-Worker Execution (`workers: 1`):** Serializes requests to protect the live AI backend microservice from concurrency 500 errors and rate-limiting.

---

## AI disclosure

See [artifacts/ai-workflow.md](artifacts/ai-workflow.md) for full disclosure on AI tools (Google Antigravity), human-directed architecture, caught hydration bugs, and manual UX evaluations.

---

## Next steps

- Integrate into **GitHub Actions CI** with automated PR comment reporting and artifact publishing.
- Extend `RelevancyScorer` with live LLM-as-a-judge endpoints across parameterized topic datasets.
- Expand end-to-end automation into post-registration token hub flows once email verification lockout is resolved.

---

## Submission checklist

- [x] Repo named `Automation-assignment` and default branch is main
- [x] README includes exact Setup + run commands (verified from a clean clone)
- [x] README word count ≤ 500 (excluding commands/checkboxes)
- [x] Max 8 tests; all 4 required behaviors covered
- [x] artifacts/assertions.md included (≤ 300 words)
- [x] At least one assertion wired into an LLM-evaluation framework and running as part of the suite
- [x] artifacts/ux-review.md included (≤ 400 words, desktop + mobile, post-signup exploration, 3–5 prioritized improvements)
- [x] artifacts/data-checks.md included (≤ 300 words + SQL: expected data, verification queries, one pipeline integrity check)
- [x] artifacts/ai-workflow.md included (≤ 300 words, all 4 questions answered)
- [x] artifacts/report/ included (or hosted link + screenshot)
- [x] artifacts/demo.mp4 included (60–90 sec, narrated: suite + report + one Part 2 assertion explained)
- [x] Commit history shows how the work evolved
