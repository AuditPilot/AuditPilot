# AuditPilot — Product Vision

> Status: Phase 0 artifact (M0). Grounded in the code audit performed against `development` @ `9e8e284` (2026-11-04).
> Companion docs: [`current-state.md`](../architecture/current-state.md) · [`feature-priorities.md`](feature-priorities.md) · [`roadmap.md`](../implementation/roadmap.md)

## 1. What AuditPilot is

**AuditPilot is an Engineering Intelligence Platform.** It sits *alongside* source-control platforms
(GitHub, Bitbucket Cloud) — never in place of them. Source control remains the source of truth for
repositories, branches, commits and pull requests. AuditPilot adds what they deliberately do not do:

- **Continuous understanding** of every connected repository (structure, risk, drift).
- **Persistent engineering findings** — issues survive across audit runs with a full lifecycle.
- **Safe, reviewable AI remediation** — proposals become reviewable PRs, never silent pushes.
- **Decision-grade history** — risk trends, regressions, merge readiness — for developers, teams and agencies.

Positioning line: *"Your AI Engineering Intelligence Platform. Every Repository. Every Risk. Every Improvement."*

## 2. Who it is for

| Persona | Reality | Jobs to be done |
|---|---|---|
| **Indie developer** | Owns 1–10 repos, one user | Connect repo → know my risk → fix findings via PRs → ship |
| **Engineering team** | Multiple repos, several engineers, shared dashboard | Share findings, assign remediation, stop regressions, merge with confidence |
| **Agency** | 5–30 client repos, client separation is contractual | Portfolio health, per-client reports, walls between clients, billable proof of work |

The current product is built almost exclusively for the first persona (user-owned data, GitHub-only,
author-centric PR listing). The 2.0 mandate makes workspaces (Phase 1/M1) and repository-centric data
the substrate for all three.

## 3. Where the current product stands (verified)

What already exists and works (see `current-state.md` for evidence):

1. GitHub OAuth sign-in with encrypted token storage (AES-256-GCM) and session cookie auth.
2. Repo-wide AI audit pipeline with **evidence anchoring of AI output** (file/anchor recovery — a real
   differentiator; most "AI audits" hallucinate locations, ours resolves locations onto the actual tree).
3. Atomic monthly usage ledger with unique-key concurrency (`UsageRecord`), Stripe checkout + signed webhooks.
4. Mongo-backed job queue with atomic lease claiming, retries and refund-on-fail usage semantics.
5. A flagship fix editor UI (`AuditEditPage`) and a PR composer with branch-slug parity with the server.

Where the product is not yet at vision level (top gaps — these drive the roadmap):

- **No workspace, no repository entity.** Audits are user-owned rows; the repo is just text in a title.
  Nothing is addressable by repository; nothing dedupes across runs (no persistent findings).
- **PR visibility is wrong for teams:** the PR list is `search/issues?q=is:pr+author:<me>` — teams see
  only *their own* PRs, first 30, no pagination. An engineering *team* product must show every relevant PR.
- **Provider surface is GitHub-only today.** GitHub App env config exists but is unimplemented; Bitbucket
  absent; PR evidence passes only the first 30 changed files to the AI silently.
- **Not connected to daily workflow**: no webhooks, no PR-triggered automation, no health intelligence.
  Users must manually drive every action; retention value is therefore low today.
- **Commercial claims exceed reality** (see `issue-register.md` A-19..A-22): "Weekly automated audits",
  "Real-time PR audits", "White-label reports", "Custom rules engine" are advertised but unimplemented,
  while real implemented value (limit enforcement surfaces, reports API) is hidden or unreachable in UI.

## 4. Product principles (binding on all phases)

1. **Evidence before narrative.** Every AI claim must map to a real file/symbol we fetched (the anchor
   system already proves this pattern). Never fabricate code, positions or scores.
2. **Workspace is the wall.** No cross-tenant read/write is ever possible, by construction (M1).
3. **Providers are adapters.** Business logic consumes normalized models; provider differences become
   capabilities, not conditionals scattered in services (M2/M5).
4. **Findings are long-lived; audits are snapshots.** Audit = one scan execution. Finding = the issue
   itself with lifecycle + fingerprints. Never conflate.
5. **AI suggests, humans merge.** Remediation always becomes a branch + PR + checks; merges need explicit
   user action; protected branches and CI are never bypassed.
6. **Claims must be shippable.** Marketing copy may describe only implemented behavior; a feature that
   cannot be verified is labeled "planned" in the UI, not promised.

## 5. The north-star user journey (Definition of Done for 2.0)

1. Sign up → personal workspace provisioned automatically.
2. Connect GitHub (and later Bitbucket) → repositories register into the workspace with stable IDs.
3. Pick a repository → repository page shows PRs (all authors), findings, audits, health.
4. Launch an audit → structured findings with fingerprint + evidence; they persist.
5. Re-audit → same issues dedupe; regressions (previously fixed, re-detected) are flagged.
6. Accept a remediation → AuditPilot creates a remediation branch → PR → checks run → merge stays manual.
7. Global dashboard reflects the whole portfolio; agencies see per-client rollups with hard separation.
8. Usage/billing meter everything priced (audits, PR reviews, AI cost) against the workspace plan.

**Success = the first two steps take under two minutes and step 3 shows a team picture of the repo, not
a look-at-my-own-PRs list.**

## 6. Non-goals (explicit)

- Replacing GitHub/Bitbucket as git hosts, CI vendors, or code-review UIs.
- Deploying customer code or executing repository source anywhere (static analysis + AI read-only).
- Automatic dependency upgrades or auto-merges without a reviewable proposal and explicit approval.
- Compliance/certification claims (SOC2, ISO) until actually obtained.
- Invasive per-developer activity surveillance ("who typed what") — analytics target repos and findings,
  not developer browsing habits.
