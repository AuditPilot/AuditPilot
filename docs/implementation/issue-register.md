# Issue Register — AuditPilot (Phase 0 audit of `development` @ `9e8e284`)

> Deduplicated register across the backend (24 findings), frontend (20) and infra (15) audit streams.
> Severity: **S0** blocks the 2.0 mission or breaks a shipped feature · S1 high · S2 medium · S3 low · S4 hygiene.
> Status column: `open` until the listed milestone closes the item. Fix is claimed done only with tests.

---

## Group 1 — Architecture & data (P0 spine)

**A-01 · Audits are user-owned; no repository linkage anywhere — S0**
- Business: no repo views, no history per repo, no cross-run intelligence — the core 2.0 premise.
- Engineering: repo exists only as title text (`models/Audit.ts:18-33`); PR/context linkage lost.
- Dependencies: none (spine root).
- Fix: M1 models (Workspace/Member/Connection/Repository/PR/Finding) + additive Audit fields; no fabricated backfill.
- Acceptance: `migrate-workspaces` twice = idempotent; new audit writes carry `repositoryId`; legacy rows `legacy-unlinked` by design.

**A-02 · No source-control abstraction; GitHub App config dead — S0**
- Business: Bitbucket (spec requirement) impossible; GitHub App value unavailable.
- Engineering: modules call `githubClientFromToken(tokenOf(req))` inline (`reviews/routes.ts:98`); `env.ts:56-62` validates `GITHUB_APP_*`, `GITHUB_AUTH_MODE` with zero consumers.
- Dependencies: A-01 (connections prereq).
- Fix: `integrations/source-control/` per `provider-abstraction.md`; M2 GitHub, M5 Bitbucket.
- Acceptance: no module constructs raw clients; capability gates before provider-specific ops.

**A-03 · "Review with AI" dead end: client GET vs server POST — S0 (fixed on this branch)**
- Business: flagship button silently did nothing in current HEAD.
- Engineering: `client/src/lib/api-service.ts:138-142` issues GET; server registers POST-only (`reviews/routes.ts:90`). Old logs showing GET 200 were the SPA fallback mask (A-12) + a stale pre-`b4c2b0d` process.
- Dependencies: none.
- Fix: client switched to POST (this branch, separate commit).
- Acceptance: UI triggers the route (status 402/200 JSON, not HTML); manual smoke.

**A-04 · PR listing author-restricted — team members invisible — S1**
- Business: /app/pulls shows only *my* PRs (30 cap, no pagination); the team view the product sells is missing.
- Engineering: `search/issues?q=is:pr+author:<me>` (`reviews/routes.ts:42-44`); list shape lacks `base` → blank repo column in PullsPage.
- Dependencies: A-02.
- Fix: repo-scoped `/pulls` via adapter, all-authors, paged, state filters (M2).
- Acceptance: other authors' open/closed/merged PRs listed with pages.

**A-05 · Repository list hard-capped at 100, unpaged — S1**
- Business: orgs >100 repos silently missing (mission says "every repository").
- Engineering: `/user/repos?per_page=100` once (`repos/routes.ts:22`).
- Dependencies: A-02.
- Fix: paged AsyncIterable in adapter; registry seeding uses it (M1 backfill also ≤100 initially, documented).
- Acceptance: >100 repos backfill test with mocked pages.

**A-06 · PR files ready for AI capped at 30 + literal "undefined" prompt entries — S1**
- Business: reviews of big PRs are quietly incomplete → wrong or missing findings.
- Engineering: files fetched without `per_page` (reviews/service.ts:36); `patch` may be unset and reaches the prompt raw (service.ts:112-128).
- Dependencies: A-02 (normalized model) but fixable standalone first.
- Fix: explicit per_page pagination + `patch === null` handling ("patch omitted") before the prompt.
- Acceptance: 100-file PR test lists all files; no "undefined" in prompt fixture.

**A-07 · AI model tiers unused — deep review never happens — S2**
- Business: product claims deeper analysis; paying users get triage-tier behavior everywhere.
- Engineering: all three tasks pinned to triage model in AI task config.
- Dependencies: M6 staged pipeline (but trivial tier assignment can land earlier).
- Fix: task registry routes `pr-review`/deep audits to `AI_MODEL_DEEP` with cost visibility.
- Acceptance: task→model matrix in gateway tests.

**A-08 · `pr-review` job type never enqueued — S2**
- Business: webhook/automation story dead before it starts.
- Engineering: Job enum includes it; nothing produces it (queue consumes only repo-audit/report-insights producers).
- Dependencies: A-18 (webhooks) — realized as the enqueuing producer.
- Acceptance: synthetic webhook → job → review, deduped per headSha (M3 test).

**A-09 · Report rows are write-only — insights users never see — S2**
- Business: a generated value the user cannot open (wasted AI spend).
- Engineering: reports module has a generate route only; no GET route.
- Dependencies: M8 reports UI (data model exists).
- Acceptance: `GET /api/audits/:id/report` + UI renders generated content.

**A-10 · Audit create/delete/rollups are non-transactional — S2**
- Business: partial failures risk phantom or orphan audit data.
- Engineering: multi-collection writes with no transaction (`audits/service.ts` create/delete/complete paths).
- Dependencies: none (replica-set transactions verified in memory-mongo? — use德育Mongo4.2 semantics; document).
- Acceptance: injected failure mid-write leaves no partial audit (test).

## Group 2 — Security & authorization

**A-11 · Helmet + express-rate-limit installed, never used — S1**
- Business: no security headers, no brute-force/rate protection on live endpoints.
- Engineering: deps in package.json; `app.ts` imports neither.
- Fix: M10 hardening (or opportunistic earlier): helmet with app-appropriate config; limiter on auth + AI + billing routes first.
- Acceptance: header assertions in a supertest; 429 on configured throttle.

**A-12 · SPA fallbacks return 200 HTML for any unmatched `/api/*` path — S1**
- Business: client bugs invisible (fake success), error UX broken; complicates monitoring.
- Engineering: dev catch-all (`server/vite.ts:34-57`) + prod static fallback (`server/static.ts:25-27`) answer `/api/*` with the SPA.
- Fix: static/vite middleware skips `/api/*`, letting 404 JSON flow (`M10`), plus client treats HTML-on-JSON errors explicitly as network failure (M2 states fix).
- Acceptance: supertest: `GET /api/definitely-not-real` → 404 JSON not HTML; browser UI shows error not empty state.

**A-13 · `/repos/:o/:r/fix` + `/fix-contents` accept arbitrary payloads w/o ownership — S1**
- Business: a compromised/buggy client can commit to any repo the *token* can write.
- Engineering: neither route verifies the repo belongs to anything AuditPilot knows (`audits/routes.ts:142,269`); fix-contents commits body file maps as-is.
- Fix: M2/M7: resolveRepository + membership + write-capable role; content validated against known audit items or explicit user intent flow.
- Acceptance: negative test — foreign repo coordinate → 404; file map unlinked to audit requires explicit confirmation flow.

**A-14 · fix-preview trusts query owner/repo — S2**
- Business: information discloser (current file contents of any repo) though credentials bound user.
- Engineering: `GET /audits/:id/fix-preview?owner=...&repo=...` — audit ownership checked, repo coords unchecked (`audits/routes.ts:112-140`).
- Fix: M2 — derive coords from the audit's repository link, not the query.
- Acceptance: spoofed coords rejected/ignored in test.

**A-15 · Mass-assignment on audit create/patch, zero zod on route bodies — S2**
- Business: schema drift, forged values (severity/status), integrity erosion.
- Engineering: `POST /audits`/`PATCH /audits/:id` spread/whitelist-lite (`audits/routes.ts:178-219`); no body validation anywhere (Zod present but unused on routes).
- Fix: M1+ incremental — zod schemas per write route; strict field copies (`pick`) server-side.
- Acceptance: body with unknown/forged field → rejected or ignored by test.

**A-16 · Module-level error leaks bypass the sanitized handler — S2**
- Business: internals/stack hints leaked to users; inconsistent error contract.
- Engineering: route handlers `catch (err)` → `res.status(...).json({message: err.message})` (`audits/routes.ts:46`, `reviews/routes.ts:122,178`, `billing/routes.ts:36-39`) instead of rethrowing to `errorHandler`.
- Fix: rethrow unknowns; keep deliberate, typed, non-sensitive errors only.
- Acceptance: fault injection in each listed route returns generic shape; no upstream messages.

**A-17 · OAuth scope over-broad (`repo` scope at minimum) — S2**
- Business: trust perception risk; reviewers of private code reasonably object to ad-hoc scope.
- Engineering: only mode is OAuth App with `scope=repo` (`server/modules/auth/service.ts:48`); GitHub App mode absent.
- Fix: M3 GitHub App installation permissions become the default (contents:read/write, PRs:read/write, checks:read); document OAuth fallback rationale.
- Acceptance: App flow grants scoped installation; connection row records granted scopes (M1 model ready).

**A-18 · No webhook ingestion (and therefore no signature verification) — S1**
- Business: no event-driven automation — the product's "continuous" promise is manual.
- Engineering: no webhook route; rawBody captured for it (`app.ts:49-54`) but unused.
- Fix: M3 per target-architecture §4 (ledger → dedupe → queue → processor; GitHub + secret verification; Bitbucket M5).
- Acceptance: rejected signature 401s; replayed delivery no-op; malformed JSON doesn't crash verification.

**A-19 · Stripe webhook un-logged by event id — S2**
- Business: replayed/out-of-order deliveries double-apply subscription state.
- Engineering: signed validation + 3 event types, no event-id ledger/dedup.
- Fix: M9 ledger (unique `stripeEventId`), processed/error state, tested replay.
- Acceptance: duplicate delivery second op = no-op.

**A-20 · Queue bookkeeping races (`complete`/`fail` without state guards) — S2**
- Business: zombie "completed" jobs that failed, or failed jobs revived by lease expiry.
- Engineering: `complete()/fail()` write unconditionally; `fail()` does read-then-write (`jobs/queue.ts:103-147`).
- Fix: `findOneAndUpdate` state-predicated transitions.
- Acceptance: race simulation test (lease expiry vs completion) converges to one terminal state.

**A-21 · AuditItem legacy ownership fallback path — S2**
- Business: potential widening of access via stale data shapes.
- Engineering: PATCH/DELETE `/audit-items/:id` checks item ownership "w/ legacy fallback" (`audits/routes.ts:239-268`) — verify fallback can't match an injected `userId`.
- Fix: M2 — strict item→audit→user chain, drop fallback.
- Acceptance: forged legacy shape rejected by test.

**A-22 · No graceful shutdown — S2**
- Business: deploys kill in-flight jobs/requests; Stripe/webhook ops half-applied.
- Engineering: `server/index.ts` lacks SIGTERM/SIGINT handling.
- Fix: M10 — close HTTP first, stop worker loop, drain/lease-release in-flight jobs, close db, then exit; compose stop_grace_period tuned.
- Acceptance: SIGTERM to dev stack completes cleanly with log trace of phases.

**A-23 · Health endpoint liveness-only — S3**
- Engineering: `GET /api/health` no DB round-trip (`app.ts:61-63`). Fix: add `GET /api/health/ready` with ping + queue heartbeat (M13#).

**A-24 · Mongo initial connect is fail-fast, no retry — S3**
- Engineering: connect failure exits process (fine in compose w/ depends_on; weak elsewhere). Fix: bounded retry (e.g. 5× exponential) before exit (M10).

## Group 3 — API quality & correctness

**A-25 · fixPull per-file failures swallowed — partial commits SOLD as success — S2**
- Business: user believes issues fixed; broken head pushed.
- Engineering: per-item try/catch collects errors but route returns past commits summary regardless (reviews/routes.ts:151-169).
- Fix: M7 — fail the op if any file fails (or explicit partial-result contract surfaced to user); verification step per spec §11.
- Acceptance: one-file-fails fixture → response `partial: true` + never reports full success.

**A-26 · SSE poll hammering DB every 1.5s per connection — S3**
- Engineering: jobs events endpoint polls per open connection; scale hazard. Fix: capped poll interval + max listeners guard, or change-token invalidation (M8/M10).

**A-27 · Repo-coordinate path segments trusted/未-encoded — S2**
- Business/path hygiene: user-controlled `owner/repo/branch/file` strings concatenated into GitHub paths without validation/encoding (all modules).
- Fix: M2 adapter validates `[A-Za-z0-9._-]+` for owner/repo + explicit ref/branch validation + `encodeURIComponent` on file paths; adapter-level test.
- Acceptance: crafted owner like `../..` or header-injecting value → 400 before any request.

## Group 4 — Frontend & product truthfulness

**A-28 · Marketing overclaims unimplemented features — S1 (integrity)**
- Business: trust damage the moment a buyer tries "weekly automated audits"/"real-time PR audits"/"white-label"/"rules engine" — none exist.
- Engineering: Pricing page copy + Auth/Landing logos (GitLab shown, not implemented).
- Fix: M10 truth layer (F-32), interim: label planned features "coming soon" and remove unshippable tiles.
- Acceptance: copy block on any feature without a working route story behind it.

**A-29 · Limit handling dead client-side — S1**
- Business: quota error invisible; user retries blindly; plan-value confusion.
- Engineering: `startAudit` throws on `!res.ok` discarding the 402 envelope; `LimitReachedModal` sits unused.
- Fix: surface 402 envelope (message, upgrade link) in startAudit + use modal; assert in audit flow test.
- Acceptance: hitting limit shows modal with reason + Upgrade CTA.

**A-30 · Every list error renders as "empty" — S1**
- Business: users conclude the product is broken/empty; support burden.
- Engineering: hooks/pages conflify error and empty; no error UI anywhere.
- Fix: M2 shared states: loading / error+retry / empty / no-permission.
- Acceptance: injected 500 renders error card with retry on the audited pages.

**A-31 · Mutations toast "Success" unconditionally — S2**
- Engineering: toasts fired without checking res.ok on key mutations (`fixPull`/`fixContents`/PR actions). Fix: res ok guard + payload:i18n message (M2 pass).

**A-32 · SettingsPage decorative — S2**
- Engineering: no token/permission/billing info is real; every tile static. Fix: real surface (connection scopes, plan, usage, logout, billing portal) in M8/M9; hide fake tiles before then.

**A-33 · PullResultsPage depends on sessionStorage replay — S2**
- Business: refresh/tab moves degrade; no durable linkage to source audit. Fix: M2+ persist result by auditId; keep session cache as ferry only.

**A-34 · Unreachable dead surfaces: PREditPage, FixConfirmationPage, pr-manager entries — S3**
- Engineering: `/app/pulls/:n/edit` route can't match (missing param), FixConfirmationPage orphaned after C9 redesign; pr-manager page not routable from nav. Fix: route entries to working pages or delete dead code (M2 cleanup commit).

**A-35 · localStorage drafts not scoped per user — S3**
- Engineering: one browser profile shares drafts across accounts (privacy/embarrassment). Fix: key by user id (M2).

**A-36 · No mobile navigation — S3**
- Engineering: app pages lack responsive nav. Fix: M10 UI pass (with responsive cards).

**A-37 · Landing/Auth fabricated stats — S2**
- Business: integrity claims ("500 audits run", find counts) not wired to anything. Fix: tie to real metrics (`AIUsage`-based counters) or remove (M10).

## Group 5 — Infra, CI, supply-chain

**A-38 · Tests excluded from `tsc` — S2**
- Engineering: `tsconfig.json` include omits test globs → type errors in tests invisible to `npm run check`. Fix in M1 (re-include + keep green).

**A-39 · CI: no docker build/push, no deploy, no staging — S3**
- Engineering: CI runs lint/check/test/build only. Fix: M10 add docker build + optional smoke compose run; staging plan documented.

**A-40 · netlify.toml builds the server as well — S3**
- Engineering: dead/incorrect config drift (SPA host shouldn't compile node server). Fix: remove server steps from netlify.toml (M10 hygiene commit).

**A-41 · Docker images run as root; no cap-drop/no-new-privileges — S3**
- Fix: M10 add non-root `USER node` in Dockerfiles + compose security options.

**A-42 · Static serving without cache headers — S3**
- Engineering: `express.static` default etag only, SPA index set no-cache; hashed assets could be immutable long-cache. Fix: M10 static cache config.

**A-43 · No observability stack — S3**
- Engineering: pino logs only; no metrics/tracing; AI cost invisible outside DB rows. Fix: M10 minimal metrics + cost/sample dashboards; documented log schema.

**A-44 · Supply-chain/meta: `rest-express` package name, MIT license w/o LICENSE file, stray root assets, `.local/` leftovers, `replit-agent` branch — S4**
- Fix: rename package, add LICENSE (if truly MIT), repo hygiene commit (M10; no user impact).

**A-45 · No client tests / no e2e journeys — S2**
- Engineering: 70 server tests; zero client; DoD journeys unverified automatically. Fix: M2+ critical-path tests (audit flow, limit modal, error states) with a light harness (vitest + testing-library e2e-lite); full e2e later (playwright optional).

---

## Severity roll-up

| Sev | Count |
|---|---|
| S0 | 3 (A-01, A-02, A-03 — one fixed) |
| S1 | 10 |
| S2 | 19 |
| S3 | 12 |
| S4 | 1 |

 milestone tags for closure are embedded in each Fix line; the P0 items (A-01..A-05, A-11, A-13, A-15, A-28) all have owner milestones ≤ M10 with the spine order preserved in `roadmap.md`.
