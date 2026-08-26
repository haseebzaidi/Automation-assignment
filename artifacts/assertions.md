# Non-Deterministic Response Validation

Target Prompt: **"What is Permission"**  
Implementation: [`tests/agent-responses.spec.ts`](../tests/agent-responses.spec.ts), supported by [`tests/helpers/chatActions.ts`](../tests/helpers/chatActions.ts) and [`tests/helpers/llmEvaluator.ts`](../tests/helpers/llmEvaluator.ts).

## Waiting Strategy

Evaluating non-deterministic streaming output requires deterministic completion signaling:
1. **Button State Transition:** During model inference, the application swaps `agent-chat-input-send-button` for `agent-chat-input-stop-button`. We await the stop button's detachment and the send button's reappearance.
2. **Text Quiescence:** We poll the agent's bubble content across consecutive sample windows to ensure token streaming has fully concluded before running assertions.

## What Is Asserted (and Why)

1. **Substantive Length (≥ 50 chars):** Guarantees a meaningful explanatory paragraph rather than an empty bubble, whitespace, or a clipped fragment.
2. **Error State Exclusion:** Verifies the response does not contain backend crash messages (*"I ran into an issue"*, *"something went wrong"*).
3. **Domain Ontology Grounding:** Confirms the presence of core ecosystem concepts (`permission`, `data`, `earn`, `ask`, `token`, `agent`, `reward`).
4. **Anti-Parroting Protection:** Ensures the model synthesized an answer rather than echoing the user's question back verbatim.

## What Is Deliberately NOT Asserted

- **Exact String Matches:** Generative outputs vary per run; asserting exact phrasing creates brittle, flaky tests.
- **Specific Factual Metrics / Financial Numbers:** Factual correctness belongs in model evaluation benchmarks, not UI integration tests.
- **Formatting, Punctuation, and Trailing Follow-ups:** Style and trailing suggestions vary legitimate responses across prompt revisions.

## LLM Evaluation Framework Integration

We integrated **ModelResponseEvaluator** (aligned with Promptfoo and DeepEval answer-relevancy metrics). Running directly within the test suite, it grades response relevance, topic entity coverage, and prompt differentiation with a 0.70 acceptance threshold.

Unlike plain assertions that only check binary substring presence, the eval framework catches semantically drifted replies, shallow single-word responses, and degraded generative completions across model releases.
