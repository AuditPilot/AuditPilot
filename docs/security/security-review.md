# Security Review — AuditPilot (Phase 0, `development` @ `9e8e284`)

> Scope: authentication, authorization/tenancy, credential handling, transport & application hardening,
> AI security, billing integrity, privacy/retention. Where a control is verified, this doc marks it ✅
> with file evidence. Gap IDs refer to `../implementation/issue-register.md`.

## 1. Executive summary

The deployed controls are best-in-class for the tiny parts of the system: token encryption, OAuth
state verification, signed Stripe webhooks, redacted logging, honest-404 ownership tests, and an
atomic usage ledger. The systemic risk is **tenancy**: the data model is user-owned today, so the
work of Phase 1 is not "add auth" but "re-key the product around workspaces with middleware that
makes foreign access structurally impossible." Second systemic risk: **no rate limiting or security
headers** on a live AI-spending API, and **no webhook 身份 surface**, which blocks the event-driven
roadmap entirely.

| # | Risk | Sev | IDs |
|---|---|---|---|
| 1 | AI-spending endpoints lack rate limits + security headers (live today) | S1 | A-11 |
| 2 | Write endpoints accept arbitrary payloads/repos without ownership verification | S1 | A-13, A-15, A-21 |
| 3 | SPA fallback masks API failures (fake 200s) | S1 | A-12 |
| 4 | OAuth_tokens over-broad scope; no App-mode granular permissions | S2 | A-17 |
| 5 | No webhook surface → no signature verification to even review | S1* | A-18 |
| 6 | Stripe event replay un-idempotent | S2 | A-19 |
| 7 | Error message leakage from raw catch blocks | S2 | A-16 |
| 8 | Prompt-poisoning entry points via unnormalized AI inputs ("undefined" patches) | S2 | A-06 |

\* required for M3 webhooks; verification must ship with them.

## 2. Authentication ✅ mostly-verified

Verified controls:
- Session = stateless JWT in `audit_token` httpOnly cookie (7d), `cookie.sameSite` configurable
  `lax|none|strict` with Secure forced when `sameSite=none` (`server/config/env.ts:88-90`,
  `lib/cookies.ts`).
- OAuth state: HMAC'd single-use token verified on callback (`modules/auth/service.ts`), preventing
  login CSRF unless storage特约 collides.
- GraphQL of secrets: `User.gitHubTokenEncrypted` AES-256-GCM w/ `select:false`; legacy plaintext
  migrated lazily with `$unset` (verified in crypto tests + service).
- Production boot fails closed on missing `JWT_SECRET`/`ENCRYPTION_KEY` (`env.ts:159-172`) ❗ good
  fail-closed posture (no silent defaults in prod).

Gaps & actions:
- **Session revocation** — logout clears the cookie, but issued JWTs live until 7d expiry; no
  server-side invalidation (e.g. token version bump on logout/all-devices). *(Plan: M10 revocation
  via user.tokenVersion claim check.)*
- **Logout via GET** (`GET /auth/logout`) — state change on GET is prefetch-able; low risk w/
  SameSite=lax, but switch to POST when M8 revamps auth surface.
- **state cookie TTL** — verify <= 10 min window in code (flagged for M3 webhook milestone's auth pass).

## 3. Authorization & tenancy

Verified: user-owned resources consistently 404 (not 403) for foreign access
(`audits/ownership.test.ts` pattern; reviews/jobs/pr-manager routes filter by `userId` server-side).

Gap classes (all route/handler level, evidence in register):
- **Workspace un-implementation**: no workspace concept today (A-01) — the M1 middleware
  `requireAuth → resolveWorkspaceMember → requireRole` is the fix; designed 404-shape for foreign
  workspace resources (no existence leak).
- **Repo-coordinate trust**: `fix-preview` query coords (A-14), `fix`/`fix-contents` arbitrary
  targets (A-13), no `resolveRepository` seam yet.
- **Mass-assignment/body trust** (A-15): no Zod on any route body.
- **Legacy fallback path** in audit-items ownership (A-21).
- **Path-segment hygiene** (A-27): owner/repo/branch/file strings un-validated/encoded before
  GitHub path construction — SSRF hardening via adapter validation.

Target invariant (enforced by tests): *no handler reads workspace/user/repo identity from the
request body, query, or URL without it having been middleware-resolved first* —
`middleware/workspace.ts` exports the only sanctioned shapes.

## 4. Credential & provider security

- ✅ At-rest encryption: AES-256-GCM (same scheme reused verbatim by M1 `ProviderConnection`).
- ✅ Logging redaction: pino redacts `authorization`, `token`, `credentials` (`config/logger.ts`).
- ✅ Fail-fast on missing token rather than anonymous API calls (`github/client.ts:133-139`).
- ⚠️ Scope minimization: `scope=repo` floor for all flows (A-17); no least-privilege today. GitHub
  App installation permissions become the default in M3; OAuth documented as fallback.
- ⚠️ GitHub App prerequisites idle: `GITHUB_APP_ID/PRIVATE_KEY/WEBHOOK_SECRET` validated but
  unused (env.ts:57-62) — webhook secrets must generate signature-checked ingestion (A-18) before
  app mode ships.
- **Bitbucket (M5)**: access/refresh encryption + transparent refresh; refresh rotation (provider
  rotates on use) recorded; leak-rate limiter on refresh loops (fail → revoke status, don't spin).

## 5. Application/transport hardening

| Control | State | Evidence | Action |
|---|---|---|---|
| CORS allowlist (no wildcards w/ credentials) | ✅ | `app.ts:34-47` | keep |
| Body size limits | ⚠️ default express 100kb json — fine; SSE unbounded? | app.ts:49 | verify SSE conn caps (A-26) |
| Security headers | ❌ none | helmet installed unused | A-11 (M10) |
| Rate limiting | ❌ none | express-rate-limit unused | A-11 (auth/AI/billing first) |
| Request validation | ❌ | zero zod on routes | A-15 (incremental from M1) |
| Error responses | ⚠️ central handler sanitizes, module catches bypass | A-16 | rethrow policy |
| Static serving | ⚠️ no cache headers, SPA fallback masks API | static.ts | A-12, A-42 |
| Dependency scanning | ❌ none in CI | workflows | M10 add npm audit/renovate gate |
| Secrets in repo | ✅ `.env` gitignored; `.env.example` names only | verified | keep rule: no secret material ever in docs either |

## 6. AI security

Verified good:
- **Untrusted-content fencing**: repo content wrapped as untrusted data inside delimited fences
  (`integrations/ai/gateway.ts`), with gateway tests asserting fence enforcement.
- **Output validation**: Zod gates all task outputs; corrective retry on schema fail (1x).
- **Cost ledger**: AIUsage rows include rejected attempts — evidence of spend visibility.

Gaps:
- **Prompt-injection surface**: PR body/comments/patch text can steer the model. Mitigations to
  enforce pipeline-wide (M6): (a) silent cap removal means *chunking with neutral framing*, not raw
  blobs; (b) instruction-detection heuristic flags (prompt-looking strings) recorded in findings as
  "low confidence"; (c) generated *code* never auto-executed (static analysis only) — already true.
- **Fix-flow contamination**: AI-suggested code flows into commits only after user review (C9 flow),
  but commits are made with the user's own write token (impersonation of user intent is by design,
  disclosed). M7 verifies anchors/staleness before any commit (A-25, fix contract).
- **Secret leakage toward AI**: fetched files are sent to the model — `gitleaks`-style pre-scan must
  redact obvious secret material before prompts (M6 stage 5, "secret scanning," also a finding type).
- **AIUsage prompt storage**: verify prompts/responses are not persisted verbatim (token counts
  only) — if stored, truncate policy required. *(Action item: verify in M6; small audit task.)*

## 7. Billing integrity

- ✅ Webhook signature: Stripe sig verified w/ rawBody (`billing/routes.ts` + lib/stripe.ts).
- ✅ `verify-session` checks metadata.userId ownership mismatch (client spoof guard).
- ✅ Atomic ledger + clamp refunds (usage tests cover races).
- ⚠️ Event-id idempotency missing (A-19) → M9 ledger; replay test required before moving billing to
  workspace (M9's premise — moving plan anchor without idempotency = double-apply risk).
- ⚠️ 402 envelope contract: server shape is there; client discards it (A-29) — include in M2 states.

## 8. Privacy & data lifecycle

- **Retention**: only `AuditLog` has TTL (180d). Source/file contents cached anywhere? — fix-preview
  fetches are transient (not persisted); AIUsage stores counts, not code (verify in M6). Findings
  evidence (excerpts) intentionally retained by design — document.
- **Deletion paths** (must exist by M10 per spec §15): disconnect provider → revoke + mark
  repositories removed (no hard delete w/o confirmation); workspace deletion → cascade policy doc +
  implement; account deletion → anonymize/erase user-owned rows, revoke tokens, retain billing docs
  as legally required.
- **AI processing disclosure**: privacy policy must state code content is sent to the configured AI
  provider (OpenRouter) and tenant isolation policy. *(M10 docs.)*
- **Never-claims list**: no SOC2/ISO/GDPR-certified language until obtained (binding doc rule).

## 9. Security regression test plan (additions tied to milestones)

| Test | Milestone |
|---|---|
| Cross-workspace read/write denied (404) matrix for every new route | M1 |
| resolveWorkspaceMember/requireRole role matrix | M1 |
| Idempotent migration + rollback restores shape | M1 |
| Webhook: valid signature accepted, invalid 401, replay no-op | M3 |
| HeadSha review-dedupe (no double AI spend) | M3 |
| Repository upsert uniqueness (rename survival) | M2 |
| Body validation rejects forged fields on audited write routes | rolling |
| 402 envelope surfaced end-to-end (modal shown) | M2 |
| Sanitized error response under injected faults on listed routes | M2 pass |
| SPA fallback no longer serves `/api/*` | M10 |
| Helmet headers + 429 assertions in supertest | M10 |
| Gitleaks pre-prompt redaction fixture | M6 |

## 10. Verdict

No currently-known critical (S0) *security* vuln is live-stealable (no auth bypass found). The
attack surface grows with every milestone; the register + this review define the controls that must
land **with** features, not after. Non-negotiables ordered: (1) M1 tenancy middleware, (2) webhook
verification at M3, (3) rate limits/headers before public launch traffic (M10 gate), (4) truthful
copy (integrity = security).
