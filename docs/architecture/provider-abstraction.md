# Provider Abstraction — Source Control Adapter Architecture

> Status: Phase 0 artifact (M0). Implementation lands M2 (GitHub adapter + service rewiring) and M5 (Bitbucket Cloud); this doc is the contract those milestones implement.
> Companion: [`target-architecture.md`](target-architecture.md) · [`database-design.md`](database-design.md) (ProviderConnection)

## 1. Why an adapter layer (current problem, verified)

Today every business module reaches directly into GitHub REST through a raw token client built
from the request's decrypted OAuth token:

- `githubClientFromToken(tokenOf(req))` is called inline in handlers (`reviews/routes.ts:98`,
  `audits/routes.ts`), so the token-sourcing policy (which credential, whose credential, which mode)
  is scattered across every module.
- GitHub REST response shapes (e.g. `search/issues` items lacking `base`) leak into business logic
  and UI — the verified blank "repo" column on PullsPage is exactly this leak.
- `server/config/env.ts:56-62` validates `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY_BASE64`,
  `GITHUB_APP_NAME`, `GITHUB_WEBHOOK_SECRET`, and `GITHUB_AUTH_MODE: oauth|app` — but **zero code
  branches on them**. The product theology ("providers are adapters") must become code.

What is kept (verified worth preserving): `integrations/github/client.ts` already centralizes
timeouts (20s), retry-with-backoff (3x, 5xx-only), secondary-rate-limit wait (L63-74), raw-mode
Accept headers, and a typed `GitHubApiError`. The adapter reuses this as its transport; it does not
replace it.

## 2. Target structure

```
server/integrations/source-control/
  types.ts               normalized models + SourceControlProvider interface + capability types
  capabilities.ts        capability keys + per-provider capability maps
  provider-factory.ts    resolve(connection | {provider}) → SourceControlProvider
  github/
    provider.ts          GitHubProvider implements SourceControlProvider (REST, oauth-user conn)
    auth.ts              OAuth App consent/callback (identity+connection), scope policy;
                         M3: GitHub App installation flow, installation-token mint/renew
    installations.ts     M3: app JWT (RS256, private key), installation lookup,
                         repository access verification, token TTL renewal cache
    webhooks.ts          M3: X-Hub-Signature-256 verification on req.rawBody,
                         event → normalized WebhookEvent, event-name → capability gate
  bitbucket/             M5: provider.ts, auth.ts (OAuth w/ refresh), webhooks.ts
```

Rules:
- **Transport stays inside the adapter.** Modules require via the factory; the factory resolves the
  credential (via `ProviderConnection.credentialsEncrypted` decrypt, or M3 app installation token)
  and hands the adapter a ready client. Handlers never construct clients from request tokens after
  M2 rewiring completes — the legacy per-request-token path is removed, not kept alongside.
- **No provider SDK types cross the boundary.** Adapters map external payloads into normalized
  models. Unknown/nullable provider fields map to explicit `null`/absent — never fabricated.
- **Capabilities gate feature code.** Before using a provider-specific behavior (merge, checks,
  webhook registration), business logic calls `provider.capabilities.has(KEY)` — scattered
  provider-conditionals are forbidden.

## 3. Normalized internal models

```ts
// types.ts (authoritative shapes; adapters must satisfy these)
export type ProviderName = "github" | "bitbucket";

export interface ScmRepository {
  providerExternalId: string;   // stable: repo node id (GitHub) / uuid (Bitbucket) — survives renames
  provider: ProviderName;
  ownerAccount: string;         // display account/org
  fullName: string;             // "owner/repo" display + lookup key
  name: string;
  description: string | null;
  visibility: "public" | "private" | "internal" | null;
  archived: boolean;
  defaultBranch: string | null;
  htmlUrl: string | null;
}

export interface ScmBranch { name: string; commitSha: string | null; isDefault: boolean; }

export interface ScmPullRequestSummary {
  providerExternalId: string | null;
  number: number;
  title: string;
  author: { login: string; avatarUrl: string | null } | null;
  sourceBranch: string; destinationBranch: string;   // normalized branch names, no refs/ prefix
  state: "open" | "closed" | "merged";
  isDraft: boolean;
  url: string | null;
  additions: number | null; deletions: number | null;
  headSha: string | null;
}

export interface ScmPullRequestDetail extends ScmPullRequestSummary {
  body: string | null;
  createdAt: string | null; updatedAt: string | null; mergedAt: string | null;
}

export interface ScmPullRequestFile {
  path: string; previousPath?: string; status: "added"|"modified"|"removed"|"renamed"|"unknown";
  additions: number; deletions: number; patch: string | null;  // null = too large / binary — MUST remain null at the prompt layer
}

export interface ScmCommit { sha: string; message: string; author: string | null; date: string | null; url: string | null; }

export interface ScmCommitCheck { name: string; state: "pending"|"success"|"failure"|"neutral"|"skipped"; url: string | null; }

export interface ScmReviewComment { id: string; author: string | null; body: string; file: string | null; line: number | null; createdAt: string | null; }

export interface ScmDiff { diff: string; truncated: boolean; }

export interface ScmWebhookEvent {
  provider: ProviderName;
  type: string;               // normalized: repo.push, pr.opened, pr.updated, pr.closed, pr.merged, review.submitted, check.completed, repo.renamed, repo.deleted, installation.changed
  deliveryId: string;         // provider delivery GUID — idempotency key
  repositoryExternalId: string;
  externalId: string;         // event-specific id (PR id, commit sha…)
  raw: unknown;               // persisted in the WebhookEvent ledger for replay/forensics
}

export interface BranchSpec { name: string; fromSha?: string; }

export interface CommitSpec { branch: string; files: { path: string; content: string }[]; message: string; }

export interface PullRequestSpec { sourceBranch: string; destinationBranch: string; title: string; body?: string; draft?: boolean; }
```

## 4. Provider interface (capabilities + operations)

```ts
export type CapabilityKey =
  | "listPullRequests.allAuthors"     // non-author-restricted PR listing
  | "listPullRequests.stateMerged"
  | "pullRequests.draft"
  | "pullRequests.comments"
  | "pullRequests.reviews"
  | "pullRequests.merge"
  | "checks.status"                   // CI/check states readable
  | "webhooks"
  | "diff.unified"
  | "fileContent.rawAtRef"
  | "branch.create"
  | "commit.multiFile"
  | "repos.listPaginated";

export interface SourceControlProvider {
  readonly name: ProviderName;
  readonly capabilities: ReadonlySet<CapabilityKey>;

  // Account/connection
  listAccounts(): Promise<{ id: string; login: string; type: string }[]>;
  // Repositories
  listRepositories(opts?: { page?: I; perPage?: N; affiliation?: "owner"|"collaborator"|"organization_member" }): AsyncIterable<ScmRepository> | AsyncGenerator<ScmRepository>;
  fetchRepository(owner: string, repo: string): Promise<ScmRepository>;
  // Branches & content
  listBranches(owner: string, repo: string, opts?: { page?: I; perPage?: N }): AsyncGenerator<ScmBranch>;
  fetchFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string | null>;
  // Pull requests
  listPullRequests(owner: string, repo: string, filter: { state?: "open"|"closed"|"all"; author?: string; draft?: boolean; base?: string; sort?: "updated"|"created"; direction?: "asc"|"desc"; perPage?: number; page?: number }): Promise<{ items: ScmPullRequestSummary[]; page: number; hasNext: boolean; }>;
  fetchPullRequest(owner: string, repo: string, number: number): Promise<ScmPullRequestDetail>;
  listPullRequestFiles(owner: string, repo: string, number: number, opts?: { perPage?: number; page?: number }): AsyncGenerator<ScmPullRequestFile>;
  fetchPullRequestDiff(owner: string, repo: string, number: number): Promise<ScmDiff>;
  // Commits & checks
  listCommits(owner: string, repo: string, filter: { sha?: string; path?: string; perPage?: number; page?: number }): Promise<ScmCommit[]>;
  fetchCombinedCheckStatus(owner: string, repo: string, sha: string): Promise<{ status: "pending"|"passing"|"failing"|"none"; checks: ScmCommitCheck[] } | null>;
  // Comments/reviews
  listPullRequestComments(owner: string, repo: string, number: number): Promise<ScmReviewComment[]>;
  // Write operations (always require write-capable connection + capability)
  createBranch(owner: string, repo: string, spec: BranchSpec): Promise<{ name: string; sha: string }>;
  createCommit(owner: string, repo: string, spec: CommitSpec): Promise<{ sha: string; url: string }>;
  createPullRequest(owner: string, repo: string, spec: PullRequestSpec): Promise<ScmPullRequestSummary>;
  mergePullRequest(owner: string, repo: string, number: number, opts: { method: "squash"|"merge"|"rebase"; sha?: string }): Promise<{ merged: boolean; sha: string }>;
  // Webhooks (M3/M5)
  registerWebhook(owner: string, repo: string, events: string[], url: string, secret: string): Promise<{ id: string }>;
}
```

Notes pinned to real defects this design removes:

| Verified defect (current branch) | Removed how |
|---|---|
| PR list = `search/issues author:<me>`, 30-cap (reviews/routes.ts:42-44) | `listPullRequests` defaults to the repo-scoped `/pulls` endpoint, **all authors**, paged, `state` filter incl. `merged` (capability `listPullRequests.stateMerged`) |
| PR files fetched **without per_page** → 30 silent cap; `patch` sometimes `undefined` becomes literal "undefined" in prompts (reviews/service.ts:36,112-128) | `listPullRequestFiles` is an async generator with explicit `perPage` and **`patch: string | null`**; prompt builder must treat null as "unknown patch" |
| Repo listing caps at 100 unpaged (repos/routes.ts:22) | `listRepositories` is an AsyncIterable (paged), so backfill + sync can cover beyond 100 |
| Merge/delete logic inline in routes (reviews/routes.ts:185-209) | `mergePullRequest` owns method/branch cleanup with capability + state checks |
| File content fetch inline w/o ref validation | `fetchFileContent(owner, repo, path, ref?)` validates path shape (no traversal, no ref injection) before transport |

## 5. Credential & identity model (auth boundary)

Two distinct credential kinds, deliberately separated (spec §6):

1. **Identity auth** — the user's own GitHub login (OAuth App today). current scope policy is
   over-broad (`scope=repo`, auth/service.ts:48). Target: connection-scoped minimum scopes
   (`repo` for private work is unavoidable initially, but documentation + M3 GitHub App move the
   default to app-installation permissions: contents read/write, pull requests read/write, checks
   read — never `admin:*`).
2. **Repository integration credentials** — `ProviderConnection` rows (workspace-scoped): OAuth-user
   tokens (M2), GitHub App installation tokens (M3: `kind=github-app`, `installations.ts` mints
   short-lived installation tokens from the app JWT, cached until expiry), Bitbucket access/refresh
   (M5: `credentialsEncrypted` + `refreshEncrypted` with expiry-driven transparent refresh).

Token lifecycle rules: encrypted at rest with the same AES-GCM envelope as `User.gitHubTokenEncrypted`
(`select:false`); never logged (pino redaction list already excludes `authorization`, `token` — keep
that invariant); revoked connections → `ProviderConnection.status="revoked"` + repository
`syncState="removed"` (M3 reconciliation, no data deletion without user action).

## 6. Capability matrix

| Capability | GitHub REST (OAuth) | GitHub App | Bitbucket Cloud |
|---|---|---|---|
| listPullRequests.allAuthors | ✅ `/repos/{o}/{r}/pulls` | ✅ | ✅ `pullrequests?pagelen=` |
| listPullRequests.stateMerged | ✅ (state=closed + merged_at) | ✅ | ✅ state=MERGED |
| pullRequests.draft | ✅ draft field | ✅ | ❌ (M5: map to none) |
| pullRequests.comments | ✅ issues comments + review comments | ✅ | ✅ |
| checks.status | ✅ combined status + check-runs | ✅ | ⚠️ commit status endpoint |
| webhooks | ✅ repo webhook + App-level | ✅ | ✅ |
| mergePullRequest | ✅ squash/merge/rebase | ✅ | ✅ (docs-driven) |
| commit.multiFile | ✅ single commit multi-file (via git trees) or per-file commits | ✅ | ✅ |
| repos.listPaginated | ✅ | ✅ | ✅ |
| fileContent.rawAtRef | ✅ raw Accept | ✅ | ✅ |

Adapter responsibility: exact endpoint choice per provider lives in adapter code; cross-provider
differences never appear outside `integrations/source-control/`.

## 7. Rollout plan conforming to the roadmap

1. **M2 (GitHub, capability-parity first):** types.ts + capabilities.ts + factory; GitHubProvider
   wraps existing `GitHubClient` transport for: repositories (paged), branches, PR list/detail/files
   (all-authors), PR create (existing fix flows keep their branch/commit code initially — move into
   adapter methods incrementally), file content. Rewire `repos`, `reviews` services to the factory;
   delete author-restricted query. Contract tests over fixtures (mocked transport).
2. **M3 (GitHub App):** auth.ts + installations.ts + webhooks.ts; `GITHUB_AUTH_MODE=app` boot
   verification; ledger-based webhook processing per target-architecture §4.
3. **M5 (Bitbucket Cloud):** second adapter, OAuth refresh logic, capability map as above; PR sync
   and audits workspace-agnostic behind the same factory.

Battle-tested invariant to carry forward: the AI prompt layer consumes normalized
`ScmPullRequestFile` where `patch === null` renders as *"patch omitted (file unchanged/too large)"*
— never the string "undefined" (fixes the verified silent prompt-poisoning bug).
