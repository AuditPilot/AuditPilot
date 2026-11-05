# AuditPilot 2.0 — Feature Priorities

> Status: Phase 0 artifact (M0). Priority system per the master spec (P0 blocking → P3 growth).
> "Status" reflects verification against `development` @ `9e8e284` + this branch's in-flight work.

## Priority legend

- **P0** — required for a trustworthy foundation (data integrity, workspace architecture, provider abstraction, authz, jobs, billing correctness)
- **P1** — required for a compelling commercial product (GitHub App, Bitbucket, webhooks, persistent findings, safe remediation, health intelligence, teams, metering, reporting)
- **P2** — strategic differentiation (cross-repo intelligence, architecture DNA, copilot, regression intelligence, merge/release readiness, policies)
- **P3** — growth & expansion (marketplace, more providers, white-label, analytics, referral, enterprise)

## Feature register

| HYPERLINK ID | Feature | Phase | Priority | Status at M0 | Notes / verified gap |
|---|---|---|---|---|---|
| F-01 | Workspace-centric data model (Workspace, Member, Roles, ProviderConnection, Repository, PullRequest, Finding) | 1 | **P0** | **In progress (M1, this branch)** | Audit currently user-owned, no repo link (`models/Audit.ts`) |
| F-02 | Server-side scoping + RBAC middleware for every resource | 1 | **P0** | Planned (M1 middleware, M2 rewire) | Repo-coordinate routes trust client owner/repo (`audits/routes.ts:57,142,269`) |
| F-03 | Safe data migration for existing users (personal workspaces, idempotent) | 1 | **P0** | **In progress (M1)** | Existing users keep credentials; no invented history |
| F-04 | SourceControlProvider abstraction (GitHub + Bitbucket Cloud) | 2 | **P0/P1** | Planned (M2 for GitHub, M5 Bitbucket) | Only `integrations/github/client.ts` exists; no adapter layer |
| F-05 | GitHub App installation mode (installations, tokens, revocation) | 2 | **P1** | Not implemented | Env vars validated (`env.ts:57-62`) but zero usages |
| F-06 | Repository-centric UX (repo pages: overview/PRs/audits/findings/…) | 3 | **P0** | Planned (M2) | UI is user-centric today; PR list author-restricted |
| F-07 | Full PR visibility per repo (all authors, filters, pagination) | 3 | **P0** | Planned (M2) | `search/issues author:<me>` + 30-cap (`reviews/routes.ts:42-44`) |
| F-08 | Global PR inbox (normalized across repos/providers) | 3 | P1 | Planned (M2/M5) | |
| F-09 | Webhooks + event-driven sync (GitHub, Bitbucket) | 4 | **P1** | Not implemented | No webhook route exists; `GITHUB_WEBHOOK_SECRET` dead config |
| F-10 | Reconciliation job (missed-webhook healing) | 4 | P1 | Planned (M3) | |
| F-11 | Staged AI audit engine (16 stages; static-first) | 5 | **P1** | Partial (T0 verified gap) | Current engine: 8 files/3000 chars cap; PR review silently caps 30 files, no per_page |
| F-12 | Deterministic scanners (Semgrep/Gitleaks/OSV evaluation) | 5 | P1 | Planned (M6) | Evaluate licensing + deployment before adding |
| F-13 | Health score (documented formula, explainable) | 6-A | **P1** | Planned (M4+) | |
| F-14 | Persistent finding lifecycle + fingerprints + regression flags | 6-B | **P1** | Model in M1; logic M4 | |
| F-15 | Merge readiness score (explainable; never auto-merge) | 6-C | P1/P2 | Planned (M6+) | |
| F-16 | Architecture intelligence / repo DNA | 6-D | P2 | Planned (M7+) | |
| F-17 | Change impact / blast radius | 6-E | P2 | Planned (post-health) | |
| F-18 | Regression prevention (link re-detected issues to history) | 6-F | P2 | Depends on F-14 | |
| F-19 | Dependency & supply-chain intelligence | 6-G | P1 | Planned (M6) | |
| F-20 | Workspace-aware AI copilot (scoped, cited) | 6-H | P2 | Planned (M8) | |
| F-21 | Engineering knowledge memory (evidence, not chat logs) | 6-I | P2 | Planned (M8) | |
| F-22 | Release readiness reports | 6-J | P2 | Planned (M8) | |
| F-23 | Custom engineering policies (workspace + repo inheritance) | 6-K | P2 | Planned (M9) | |
| F-24 | Agency portfolio / multi-client separation | 6-L | P2 | Model-ready in M1 (workspace types); features M8 | |
| F-25 | Safe remediation workflow v2 (anchor validation, stale-SHA detection, verification) | 7 | **P1** | Partial (bounds exist) | Per-issue errors swallowed (`reviews/routes.ts:151-169`); stale-commit check missing |
| F-26 | Team collaboration (invites, roles, assignments, activity) | 8 | P1/P2 | M1 data model; workflows M8 | |
| F-27 | Workspace-aware billing (Stripe) + metered AI costs | 9 | **P0/P1** | Partial | Stripe works per-user today; move to workspace plan |
| F-28 | Rate limiting + security headers (helmet/limiter) | 11 | **P0** | Not implemented (deps installed, unused) | |
| F-29 | Graceful shutdown, mongo connect resilience, health/DB probe | 13 | **P0** | Partial (health exists; shutdown absent) | `index.ts` has no SIGTERM handling |
| F-30 | Observability (AI cost, queue latency, sync failures, webhook ledger) | 13 | P1 | Partial (AIUsage + AuditLog live) | No metrics/trace pipeline |
| F-31 | Meaningful test coverage incl. client + provider contracts | 12 | **P0** | Partial (70 tests, server-only) | No client tests; no e2e; tests excluded from tsc (`tsconfig.json:3`) |
| F-32 | Truthful pricing/marketing alignment | 15 | P1 | Over-claim gap | "Weekly audits", "Real-time PR audits", "White-label", "Rules engine" unimplemented |
| F-33 | Product analytics (activation/mretention funnel dashboards) | 14 | P2 | Planned (M10) | |
| F-34 | Landing/pricing/SEO/docs surface lift | 15 | P2/P3 | Planned | Real-feature copy only |

## Sequencing rule (from the spec)

P2/P3 never delays a P0. Concretely ordered dependency spine:

```
F-01..F-03 (M1) → F-04/F-06/F-07 (M2) → F-05/F-09 (M3) → F-14/F-13 (M4)
→ F-04bb Bitbucket (M5) → F-11/F-12/F-19 (M6) → F-25 (M7) → F-26/F-20..F-24 (M8)
→ F-27 (M9) → F-28..F-31 hardening (continuous, M9/M10) → F-32..F-34 (M10)
```

Anything not on the spine may proceed opportunistically but must not re-key data in ways that would
undermine later spine migrations.
