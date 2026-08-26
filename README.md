# Automation Assignment — Permission.ai QA Challenge

Automated end-to-end test suite and architectural review for the pre-login AI agent at [ask.permission.ai](https://ask.permission.ai), built with **Playwright** and **TypeScript**.

---

## Setup

Requires Node.js 18+ (verified on Node v24).

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browser binaries
npx playwright install chromium

# 3. Execute the full test suite
npm test

# 4. View interactive HTML test report
npm run test:report
```

To run with browser UI visible:
```bash
npm run test:headed
```

---

## Test Strategy (TL;DR)

1. **Covered Core Flows:** Evaluated all 4 mandatory behaviors (topic pills visibility, topic selection → agent reply, free-text prompt → reply, Shift+Enter newline formatting).
2. **Added Critical Boundaries:** Input validation (empty/whitespace send disabled), pre-login authentication routing (Login/Signup), and mobile viewport responsiveness (iPhone 14).
3. **Intentional Defect Exposure:** The initial pills test evaluates genuine cold-load paint without reloading; it intentionally fails to catch the real client hydration bug.
4. **Non-Deterministic Validation:** Asserted on response structural shape, domain concept density, and integrated automated LLM relevancy scoring (`RelevancyScorer`).
5. **Skipped by Design:** Canned text assertions (flaky trap), auth-gated automation (spec strictly scoped to pre-login), multi-browser combinatorial padding, and artificial sleeps.

---

## Key Decisions

- **Playwright + TypeScript + Page Object Model:** Used a lightweight POM (`PermissionAgentApp`) for clean locator encapsulation and maintainability without over-engineering.
- **Event-Driven Waiting & Quiescence:** Replaced arbitrary timers with the app's native send↔stop button lifecycle, followed by token stability polling (quiescence) to prevent reading half-streamed answers.
- **Shape & Semantic Assertions Over Exact Strings:** Generative AI responses vary; asserted on semantic depth (≥40 chars), error-free status, topic grounding, and prompt-rejection metrics.
- **Integrated LLM Evaluation Framework:** Built `RelevancyScorer` into the test runner to validate semantic alignment against domain ontology clusters (>0.70 score).
- **Resilient Locators (`data-testid`):** Anchored interactive elements to application `data-testid` attributes to ensure stability across styling and DOM refactors.
- **Exposed Real First-Paint Hydration Bug:** Cold page loads fail to mount topic pills; isolated the first test without reload to surface this defect in reporting while using controlled reload synchronization for downstream tests.
- **Mobile Responsive Emulation:** Tested mobile chat layout usability via Playwright's iPhone 14 viewport descriptor.
- **Zero Flakiness Architecture:** Disabled concurrency (`workers: 1`) to respect live backend rate limits and prevent 500 microservice timeouts.

---

## AI Disclosure

See [artifacts/ai-workflow.md](artifacts/ai-workflow.md) for full disclosure on AI tools, generated vs. rewritten components, caught hallucinations, and manual architecture decisions.

---

## Next Steps (1–2 More Days)

- Fold the test suite into **GitHub Actions CI/CD** on pull requests with automated HTML report publishing to GitHub Pages.
- Connect `RelevancyScorer` to live LLM-as-a-judge API endpoints (e.g., DeepEval / Promptfoo with GPT-4o-mini / Claude 3.5 Sonnet) over a parameterized golden dataset.
- Automate post-signup funnel workflows once the email verification lockout defect is resolved.
- Implement automated visual regression checks on chat bubble animations across viewport breakpoints.

---

## Submission Checklist

- [x] Repo named sqa-homework-<first-last> and default branch is main
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
