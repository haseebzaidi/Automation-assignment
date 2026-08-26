# Data-Layer Reasoning & Schema Validation

Inferred from client network interactions (`POST /api/agent/ask-unauthenticated`, UUID session tokens, PostHog/GA telemetry) and registration flows.

## Inferred Relational Schema

### (a) Chat Messaging Flow
- `chat_sessions`: `session_id` (UUID, PK), `user_id` (UUID, FK, nullable for anonymous visitors), `ip_hash` (VARCHAR), `user_agent` (VARCHAR), `created_at` (TIMESTAMP)
- `chat_messages`: `message_id` (UUID, PK), `session_id` (UUID, FK → `chat_sessions`), `sender_role` (ENUM: 'user', 'agent'), `content` (TEXT), `token_count` (INT), `status` (ENUM: 'completed', 'failed'), `error_detail` (VARCHAR, nullable), `created_at` (TIMESTAMP)

### (b) User Registration & Wallet Flow
- `users`: `user_id` (UUID, PK), `email` (VARCHAR, UNIQUE), `password_digest` (VARCHAR), `email_verified` (BOOLEAN), `registered_at` (TIMESTAMP)
- `email_verifications`: `token_id` (UUID, PK), `user_id` (UUID, FK → `users`), `verification_token` (VARCHAR), `expires_at` (TIMESTAMP), `verified_at` (TIMESTAMP, nullable)
- `wallets`: `wallet_id` (UUID, PK), `user_id` (UUID, FK → `users`, UNIQUE), `wallet_address` (VARCHAR), `ask_balance` (DECIMAL), `updated_at` (TIMESTAMP)

## SQL Verification Queries

```sql
-- Query 1: Detect orphaned chat messages missing parent session records
SELECT m.message_id, m.session_id, m.created_at
FROM chat_messages m
LEFT JOIN chat_sessions s ON s.session_id = m.session_id
WHERE s.session_id IS NULL;
-- Expected: 0 rows

-- Query 2: Identify broken or empty agent completions (catches silent 500 fallbacks)
SELECT message_id, session_id, status, error_detail, created_at
FROM chat_messages
WHERE sender_role = 'agent'
  AND (content IS NULL OR TRIM(content) = '' OR status = 'failed');
-- Expected: 0 rows

-- Query 3: Validate user registration integrity and timestamp sanity
SELECT user_id, email, registered_at
FROM users
WHERE email IS NULL 
   OR email NOT LIKE '%_@__%.__%'
   OR registered_at > NOW();
-- Expected: 0 rows
```

## Downstream Pipeline Data-Integrity Check

In the analytics ETL pipeline (processing event ingestion from PostHog/GA to BigQuery/Snowflake), implement an **Idempotent Deduplication and Event Completeness Check**:
- Verify that every incoming `message_id` and `user_id` maps uniquely without duplicated events resulting from network retries.
- Trigger automated Slack/PagerDuty alerts if session volume drops >3 standard deviations below trailing 7-day hourly moving averages.
