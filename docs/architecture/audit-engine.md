# Audit engine — staged pipeline + scanner decision (M6)

> Status: M6 implementation contract. Implements target-architecture §5
> (staged pipeline) and the roadmap M6 deliverables: scanner evaluation with a
> documented decision, tier routing that actually uses triage vs deep, chunk
> planning with bounded cost, stage-level AI usage recording.

## 1. Deployment constraint that decides everything

AuditPilot deploys on **Cloudflare Workers** (`wrangler.jsonc`, `nodejs_compat`).
Workers run JS in V8 isolates: **no child_process, no native binaries, no
Python**. Any scanner that is a binary (Semgrep CLI, Gitleaks CLI) cannot run
in-process on the deployment target. Shipping it would require a separate
containerized scan service (new infra: queue, auth, latency, cost, ops).

## 2. Scanner evaluation

| Tool | What it is | License | Deployment on Workers | Ops cost | Verdict |
|---|---|---|---|---|---|
| **Semgrep** | Static analysis engine (Python binary + YAML rule packs; OSS registry is Semgrep-proprietary-adjacent) | LGPL 2.1 (core), proprietary registry rules | ❌ binary — would need external scan service | High (service + rule pack updates + result piping) | **Not adopted as binary.** Its *pattern* (rule → AST-lite match → finding with ruleId) is adopted as an in-repo JS rule pack. |
| **Gitleaks** | Secret scanner (Go binary + regex ruleset) | MIT | ❌ binary | Medium | **Not adopted as binary.** Its *pattern* (curated regex rules over file contents with allowlists) is adopted as an in-repo JS regex pack (independently authored; rule ids namespaced `secret.*`). Doubles as the **pre-prompt secret redaction** stage demanded by security-review.md §M6. |
| **OSV** | Vulnerability database + REST API (`POST https://api.osv.dev/v1/query`) | API free; data CC-BY 4.0 / GFDL | ✅ plain HTTPS from Workers | Low (one HTTP call per manifest dep, cached per audit run) | **Adopted.** Dependency-manifest analysis queries OSV for the exact ranges parsed from manifests; results map to `dependency` findings with `ruleId: osv.<id>`. |

**Decision (recorded):** M6 ships deterministic scanners as **pure-JS stages
inside the audit pipeline** — curated rule packs we author and own, plus the
OSV REST API. No native tools, no external scan service in M6. This keeps
latency, cost, and failure modes inside the Job/Audit record we already
operate. Re-evaluate if a repo-class static analyzer becomes necessary (the
Engine boundary from target-architecture §2 is where an external worker would
plug in).

Honesty notes that must surface in product copy: our static analysis is
rule/heuristic based (not Semgrep-grade dataflow analysis); OSV findings are
manifest-range based (not lockfile-transitive unless a lockfile is parsed).

## 3. Pipeline (14 stages, deterministic, recorded)

Per target-architecture §5, each stage is a typed function receiving a
`StageContext` (provider, tree, budget, config) and returning a typed result.
The pipeline writes a stage log onto the Audit record (`Audit.stages[]`:
name/status/startedAt/finishedAt/detail/error) and per-stage AI rollups.

1. **discovery** — `provider.listTree(ref)` (capability `tree.listRecursive`),
   entry budget (default 10k, flag `truncated`), resolves the audited commitSha.
2. **language detect** — extension + manifest sniffing → primary languages +
   frameworks (React/Next/Express/Django/…).
3. **classification** — deterministic rules: source / config / generated
   (`*.min.js`, `dist/`, `node_modules/`, lockfiles)/ binary / docs.
4. **dependency manifests** — parse package.json/go.mod/requirements.txt/
   Gemfile/composer.json/pom.xml; query OSV per dependency (cached per run);
   emit `dependency` findings (bounded: manifest cap + OSV result cap).
5. **secret scan** — curated regex pack over classified source/config files
   (content fetched through `provider.fetchFileContent`, per-file char cap);
   emits `security` findings with `ruleId: secret.<id>`; **found secrets are
   redacted before any AI chunk sees the file** (security-review.md §M6).
6. **static analysis** — curated JS rule pack (security/perf/config heuristics:
   eval, unsafe html sink, sql string concat, disabled TLS verify, permissive
   CORS, secrets-in-config, …). Emits findings with `ruleId: static.<id>`.
7. **heuristics** — repo-level checks (large files, missing tests dir, missing
   lockfile, committed env files) → `configuration`/`architecture` findings.
8. **architecture metrics** — file count per language, top-level layout
   fingerprint; recorded into the audit scan summary (no findings in M6).
9. **AI investigations** — chunk planner (§4) → gateway tasks per chunk,
   **tier-gated**: `repo-audit:triage` (default breadth) and `repo-audit:deep`
   (risky files / high-severity scanner findings, capped per audit). Scanners
   already produced findings — AI chunks must *verify/extend*, never re-derive
   (fingerprints ground truth: scanners emit real fingerprints; AI findings
   get fingerprints too and dedupe against scanner findings by
   path+anchor).
10. **validation** — existing anchor machinery (`resolveFilePath`/
    `recoverAnchor`/`locateCode`) + raw content re-fetch for exactness;
    unanchored AI findings are dropped or flagged `confidence < 0.5`.
11. **fingerprinting** — `computeFingerprint` (findings/fingerprint.ts) for
    every finding; scanner findings are ground truth (ruleId set, deterministic).
12. **remediation proposals** — existing recommendation generation, per finding.
13. **verification hooks** — reserved (M7 safe remediation consumes this).
14. **report generation** — findings + audit items + per-stage costs rollup;
    Report rows readable via the M6 read route (closes issue A-09).

## 4. Chunk planner (bounded cost)

- Budget: `MAX_AI_CALLS_PER_AUDIT` (triage: default 6) + `MAX_DEEP_CALLS`
  (default 4). Files per chunk: 6 (triage) / 3 (deep). Per-file char cap 3k.
- Selection: scanner-flagged risky files first (deep), then breadth fill
  (largest-remaining classified source files, deterministic order by path).
- The plan is recorded on the audit record (`stages` detail) so "bounded cost"
  is auditable, satisfying the 1k-file acceptance (1k files → 1 tree call +
  ≤6+4 AI calls + bounded fetch calls; recorded in AIUsage + Audit.stages).

## 5. Tier routing (gateway task registry, closes A-07)

- `repo-audit:triage` → `triageModel()`, `repo-audit:deep` → `deepModel()`.
  Gateway tests assert the task→model matrix (task-matrix test).
- AIUsage gains `stage` + `wallTimeMs` + `retries`; the audit record stores
  per-stage token/time rollups.

## 6. Provider-agnostic audits

The pipeline runs against the **`SourceControlProvider`** contract only
(`listTree`, `fetchFileContent`, `fetchRepository`). The repo-audit worker
resolves the provider like the pr-review worker already does
(`providerForWorkspace` → bitbucket/gihub; legacy user-token fallback for
github). The M5 audits-route gate ("Bitbucket audit runs arrive with M6")
flips to allow audits on any workspace-bound repo. Fix flows (branch+commit+PR)
stay GitHub-first until they move behind `commit.multiFile` in a later
milestone (truthful UI copy).
