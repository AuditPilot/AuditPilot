# Roadmap — AuditPilot 2.0 (M0 → M10)

> Status artifact. Live document: each milestone updates its own status line + limitations section as it closes.
> Source of truth for ordering: the master spec's P0-first priority system. Companion: [`../product/feature-priorities.md`](../product/feature-priorities.md)

## Milestone ledger

| # | Milestone | Priority | Status | Branch/commits |
|---|---|---|---|---|
| M0 | Full technical & product audit + architecture docs | P0 | **Done** (on `feat/foundation-m0-m1`) | this branch |
| M1 | Workspace architecture, repository entities, safe migrations | P0 | **Done (backend)** | `feat/foundation-m0-m1` |
| M2 | Provider abstraction (GitHub) + repo-centric experience + full PR visibility + global PR inbox | P0/P1 | Planned | |
| M3 | GitHub App, permissions, webhooks, event-driven sync + reconciliation | P1 | Planned | |
| M4 | Persistent findings lifecycle, dedupe, audit comparison, health score | P1 | Planned | |
| M5 | Bitbucket Cloud adapter + cross-provider dashboard | P1 | Planned | |
| M6 | Staged AI audit engine (static-first, tiers, fingerprints ground truth) | P1 | Planned | |
| M7 | Safe remediation v2 (anchor validation, stale-SHA, verification, regression flags) | P1 | Planned | |
| M8 | Team collaboration (invites, roles UX, assignments, activity) + reports surface | P1/P2 | Planned | |
| M9 | Workspace-aware billing, usage metering, cost controls, plan enforcement | P0/P1 | Planned | |
| M10 | Production hardening, observability, truthful marketing, launch readiness | P0/P1 | Planned | |

## Standing acceptance gates (every milestone)

1. `npm run lint` — zero errors.
2. `npm run check` — **tests re-included in tsconfig** (unblocks M1).
3. `npm run test` — all tests pass; count reported honestly; no skipped/weakened tests.
4. `npm run build` — both client and server bundles succeed.
5. Docs updated for anything that changed contract (database-design, target-architecture, roadmap).
6. Remaining limitations recorded here.
7. No direct commits to `main`/`development`; feature branches only; migrations + rollback scripts ship together.

---

## M0 — Done ✅

Deliverables: complete repo audit (file:line evidence in `docs/architecture/current-state.md`),
9-document doc set (this one included), S0 dead-API fix, branch strategy established.

## M1 — Workspace architecture, repository entities, safe migrations (P0)

**Scope (data foundations only; no UI rewiring):**

- Models: `Workspace`, `WorkspaceMember` (unique `{workspaceId,userId}`, roles
  `owner|admin|developer|viewer`), `ProviderConnection` (AES-GCM credentials), `Repository`
  (unique `{workspaceId,provider,providerExternalId}`), `PullRequest` (unique
  `{repositoryId,provider,number}`), `Finding` (unique `{repositoryId,fingerprint}`, lifecycle enum).
- Additive `Audit` fields: `workspaceId?, repositoryId?, provider?, commitSha?, auditType?,
  originatingJobId?` — **no backfill** of legacy audits.
- Module `server/modules/workspaces/{service,routes}.ts` + `server/middleware/workspace.ts`
  (`requireAuth → resolveWorkspaceMember → requireRole`), mounted in `app.ts`.
- `scripts/migrate-workspaces.ts` (+ npm script): personal workspace per user → owner membership →
  ProviderConnection cloned from the existing encrypted GitHub token → repository registry seeded
  from `/user/repos` (≤100) → report legacy audits `legacy-unlinked`. Idempotent; re-runnable.
- `scripts/rollback-workspaces.ts`: drops new collections & added Audit fields.
- Tests: slug/member uniqueness, role gates, workspace isolation (404-shaped cross-access),
  repository upsert uniqueness, fingerprint dedupe. Re-include `**/*.test.ts` in tsconfig.

**Acceptance criteria (M1):**

- [x] All gates green; test count grows (target +≥15) — 70 → **86 tests** (+16). New `lint`
  gate (typescript-eslint flat config) added and passing; `check` (tests re-included), `test`,
  `build` all green on the API repo.
- [~] `scripts/migrate-workspaces.ts` idempotency: implemented via upserts keyed on
  `{workspaceId, provider, providerExternalId}` and `{workspaceId, userId}`; upsert convergence is
  covered by tests (double `registerRepository` → same `_id`, double `ensurePersonalWorkspace` →
  same workspace). A full double-run on a seeded dev DB still needs a live GitHub token — verify
  on first real execution and record the result here.
- [x] Cross-workspace access tests: read of foreign workspace/repos/members → 404; foreign
  register/rename/delete → 404; JWT identity source asserted.
- [x] Existing 70 tests unchanged and passing (one latent type fix in `ownership.test.ts`,
  behavior untouched).
- [x] Honest status note below.

**Status (M1 complete — backend only, branch `feat/foundation-m0-m1` of the API repo):**
all six models + additive Audit fields shipped exactly per `database-design.md`;
`server/modules/workspaces/{service,routes}.ts` + `server/middleware/workspace.ts` mounted under
`/api`; idempotent `migrate-workspaces.ts` (DRY_RUN / SKIP_GITHUB_SEED flags) +
`rollback-workspaces.ts` (requires `--yes`). Also fixed en route: `connectDB()` readyState guard
(per-request connect hijacked the test DB), unused-import/type cleanups so the new lint gate
passes. **Deferred to M2 (explicitly):** repo-scoped route rewiring, workspace-aware UI, GitHub
App connection flow. **Not done here:** legacy audit backfill (insufficient data — reported as
`legacy-unlinked` by the migration).

## M2 — GitHub adapter + repository-centric experience (P0/P1)

- `integrations/source-control/` (types/capabilities/factory + github/) per `provider-abstraction.md`.
- Rewire `repos` + `reviews` onto adapters; PR listing becomes repo-scoped, all-authors, paged,
  state filters; global PR inbox endpoint shares the same service.
- Sync: Repository/PullRequest mirror tables populated (sync-on-demand first; webhook later).
- Frontend: workspace-aware routes `/app/workspaces/:wsId/repositories/:repoId/{overview,pulls,audits,findings}`;
  loading/error/empty/synced-at states everywhere; fix the repo column (data now normalized).
- `_NON-DONE markers in UI for anything still user-legacy.`

**Acceptance:** PR list shows other authors' open/closed/merged PRs with pagination; inbox
deduplicates across repos; no route accepts repo identity as free text without workspace resolution;
adapters covered by contract tests with recorded fixtures.

**Status (M2 complete — backend + frontend, branch `feat/foundation-m0-m1`):**
- [x] Adapter layer exactly per `provider-abstraction.md` §2–§4: `types.ts` (normalized models,
  `SourceControlProvider`), `capabilities.ts` (GitHub + Bitbucket placeholder map),
  `github/provider.ts` (wraps `GitHubClient` as a thin transport), `provider-factory.ts`
  (`providerFromToken` / `providerFromTransport` / `providerFromConnection`). **Contract
  extension:** `updatePullRequest` added to the interface (needed by the legacy PATCH-PR route);
  noted as an intentional addition to the spec doc.
- [x] Contract tests: 15 `github/provider.test.ts` cases against a fake transport (normalized
  models, merged-state derivation, `patch:null`, 404→null file content, pagination heuristics).
- [x] Rewires: `repos` + `reviews` routes and the PR-review worker now resolve credentials via
  `providerForUser` (workspace connection → legacy user token fallback with deprecation warning) —
  no handler builds a client from a request token. Repo-audit worker stays raw-client (M4 scope).
- [x] Sync-on-demand: `POST /workspaces/:id/repositories/:repoId/sync` refreshes the Repository
  mirror + up to 3×100 PRs (upsert-idempotent); repo-scoped PR list + workspace-wide PR inbox
  (dedupe via mirror upsert, author-restricted GitHub search deleted). Breaking response changes
  (normalized shapes, bare array for `/repos`) accepted — the legacy UI was updated in the same
  milestone.
- [x] Frontend: `WorkspacesPage` (picker), workspace registry page (table with sync-state badges,
  relative last-synced, per-row sync, register-from-GitHub dialog with workspace-connection
  bootstrap banner), `RepoShell` with overview/pulls/audits/findings tabs; repo PR list with
  open/merged/closed/all filters + pagination; legacy PullsPage rewired onto the workspace inbox —
  **repo column fixed** (was blank: legacy code read GitHub's `base.repo.full_name`).
  `_NON-DONE` markers on the audits/findings tabs (M4 deliverables).
- [~] Webhook-driven sync: deliberately deferred to M3 (spec says sync-on-demand first).
- [x] Gates: lint 0 errors, tsc clean, **106 tests** (86 → 106, +20), build OK (API 168.0kb,
  SPA builds). Honest caveats: branch pagination heuristic (a full 100-branch page is treated as
  "more exist"); register-dialog candidate list reads the caller's GitHub account, so org repos the
  token can see but aren't owned won't appear until M3's installation flow.

## M3 — GitHub App + webhooks + reconciliation (P1)

- Install flow (installation webhook → permission verification), installation-token minting/caching,
  identity/auth separation, uninstall/revocation handling.
- Webhook endpoints for push/pr./review/check events: signature verify → event ledger (TTL 30d,
  unique deliveryId) → job → normalized processor. Missed-webhook reconciliation job. Rate-limit
  respectful sync. Retry endpoint for dead events.
**Acceptance:** replayed delivery is a no-op (idempotency test); simulated missed webhook heals within
one reconciliation cycle without double AI reviews (headSha dedupe test documented).

## M4 — Findings lifecycle + audit comparison + health (P1)

- Finding writes inside audit pipeline: fingerprint at generation, dedupe on insert (persisted
  first/last-seen), reopen detection, regression flag vs. previously-fixed.
- Audit list/comparison views bound to Repository; legacy audits stay user-scoped but the migration
  report and audit list make linkage explicit.
- Health score (documented formula, missing-data ≠ healthy).
**Acceptance:** same finding detected in two consecutive audits = one Finding row (update, not
duplicate); regression test proves re-detection links to the fixed Finding; score formula published.

## M5 — Bitbucket Cloud (P1)

- Second adapter (OAuth w/ refresh, capability map), branch/bitbucket-webhook support, cross-provider
  docs + `.env.example` update.
**Acceptance:** workspace with both providers shows both repos in one inbox; provider gating tests
prove non-available capabilities route to capability-checked no-ops with truthful UI copy.

## M6 — Staged audit engine (P1)

- Stage pipeline per target-architecture §5 (discovery → classification → deps → secrets → static →
  AI-chunks → validation → fingerprints → reports). Evaluate Semgrep/Gitleaks/OSV (licensing, ops cost,
  deployment) with a documented decision. Tier routing: triage vs deep actually used. Chunk planner +
  bounded file analysis; incremental audits.
**Acceptance:** audit on a 1k-file repo completes with bounded cost (recorded), deterministic scanners
produce findings the AI does not need to discover, AIUsage tracks stage-level cost; report rows
finally readable via UI.

## M7 — Safe remediation v2 (P1)

- Fix workflow per spec §11 (anchor revalidation, stale headSha detection, protected-branch respect,
  verification step, finding linkage, skipped/failed reporting). Per-issue errors no longer swallowed.
**Acceptance:** hostile simulation tests (file changed between preview and commit → skip + report;
protected branch → explicit denial path; verification never claims success without check evidence).

## M8 — Collaboration + reports + analytics surface (P1/P2)

- Invitations, role changes, assignment of findings, activity feed, notifications; reports UI around
  the existing Report rows; copilot groundwork (workspace-scoped, cited).
**Acceptance:** role matrix tests; an agency workspace cannot see another workspace's client data
(HR checks at service AND route layers).

## M9 — Workspace billing (P0 within M9 window)

- Stripe checkout/subscription moves to workspace; usage metering monthly (workspaceId,action,period
  unique), AI cost tracking rollups, plan entitlements enforced server-side, webhook idempotency
  (event-id ledger), downgrade behavior.
**Acceptance:** replayed Stripe webhook no-op; plan limit exceeded → 402 envelope honored by UI
(dead modal resurrected); all existing user subscriptions migrated without losing Stripe state.

## M10 — Production hardening + launch readiness (P0/P1)

- helmet + rate limiting (F-28), graceful shutdown, DB-connect resilience/readiness probe, CI
  docker build, observability (sync/job/AI cost dashboards), secret redaction audit, data-retention
  & deletion policy, staging environment, truthful pricing copy (F-32), launch checklist.
**Acceptance:** all gates + new security scan in CI green; `static.ts`/vite SPA fallback no longer
200-masks unmatched `/api` paths (404 JSON for /api/*); docs complete.

## Known limitations carried forward (updated per milestone)

- After M1: data model is workspace-ready, **but no user-visible feature changes yet** — UI still
  user-centric; PR features unchanged in behavior. This is deliberate (M2 rewires consumers).
- After M1: legacy audits remain unlinked to workspaces/repositories (insufficient historical data);
  they remain accessible through the existing user-scoped audit UI until M4.
