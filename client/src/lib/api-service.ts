/**
 * API Service Layer
 * Centralizes all data fetching logic to separate it from UI components.
 * Authentication is cookie-based (httpOnly JWT set by the server) — no
 * Bearer tokens are stored client-side.
 */

/**
 * Base URL of the API origin. Empty string in same-origin deployments
 * (dev vite proxy / single-host); set VITE_API_BASE="https://api.example.com"
 * for the split static-site + API deployment.
 */
export const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

const cred = { credentials: "include" as const } as RequestInit;

export const api = {
  // Auth & User
  async getAuthStatus() {
    const res = await fetch(`${API_BASE}/api/auth/user`, { ...cred });
    if (!res.ok) throw new Error("Auth verify failed");
    return res.json();
  },

  // Billing
  async createCheckoutSession(plan: string) {
    const res = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
      ...cred,
    });
    if (!res.ok) throw new Error("Failed to create checkout session");
    return res.json();
  },

  async verifyBillingSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/api/billing/verify-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      ...cred,
    });
    if (!res.ok) throw new Error("Failed to verify billing session");
    return res.json();
  },

  // Repositories
  async getRepos() {
    const res = await fetch(`${API_BASE}/api/repos`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch repos");
    return res.json();
  },

  // Audits
  async getAudits() {
    const res = await fetch(`${API_BASE}/api/audits`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch audits");
    return res.json();
  },

  async getAuditDetails(auditId: string) {
    const res = await fetch(`${API_BASE}/api/audits/${auditId}`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch audit details");
    return res.json();
  },

  async updateAudit(auditId: string, data: any) {
    const res = await fetch(`${API_BASE}/api/audits/${auditId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...cred,
    });
    if (!res.ok) throw new Error("Failed to update audit");
    return res.json();
  },

  async getBranches(owner: string, repo: string) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/branches`, { ...cred });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to fetch branches");
    }
    return res.json();
  },

  async startAudit(owner: string, repo: string, branch: string) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch }),
      ...cred,
    });
    if (!res.ok) throw new Error("Failed to start audit");
    return res.json(); // 202 { jobId }
  },

  async getJob(jobId: string) {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch job");
    return res.json();
  },

  // Pull Requests
  async getPulls() {
    const res = await fetch(`${API_BASE}/api/pulls`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch pulls");
    return res.json();
  },

  async getPullFiles(owner: string, repo: string, number: string) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/pulls/${number}/files`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch pull files");
    return res.json();
  },

  /** Full PR object (body, user, base/head refs) — the list endpoint is
   * search-based and drops the description, so detail pages use this. */
  async getPullDetail(owner: string, repo: string, number: string) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/pulls/${number}`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch pull request detail");
    return res.json();
  },

  /**
   * REAL per-item current code for the fix-review UI (never the AI's stale
   * snapshot). Server fetches each referenced file once and locates the
   * anchored snippet.
   */
  async getFixPreview(auditId: string, owner: string, repo: string, branch?: string) {
    const params = new URLSearchParams({ owner, repo, ...(branch ? { branch } : {}) });
    const res = await fetch(`${API_BASE}/api/audits/${auditId}/fix-preview?${params}`, { ...cred });
    if (!res.ok) throw new Error("Failed to load current file contents — showing AI quotes as fallback");
    return res.json();
  },

  async auditPull(owner: string, repo: string, number: string | number) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/pulls/${number}/audit`, { ...cred });
    if (!res.ok) throw new Error("Failed to audit pull request");
    return res.json();
  },

  async fixPull(owner: string, repo: string, number: string | number, issues: any[]) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/pulls/${number}/fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issues }),
      ...cred,
    });
    if (!res.ok) throw new Error("Failed to fix pull request");
    return res.json();
  },

  /**
   * Commits user-reviewed FULL file contents (from the inline diff editor) to
   * a fresh branch and opens a pull request server-side.
   */
  async fixContents(owner: string, repo: string, files: Record<string, string>, targetBranch: string, title?: string, description?: string) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/fix-contents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files,
        targetBranch,
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
      }),
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to create pull request from edited files");
    }
    return res.json();
  },

  /**
   * Applies old→new code substitutions across a repo and opens a pull request
   * (fresh branch: one commit per file). Used by the PR manager's
   * "Finalize & Create PR" for drafts that store snippet pairs.
   */
  async repoFix(
    owner: string,
    repo: string,
    issues: Array<{ file: string; old_code: string; new_code: string }>,
    targetBranch: string,
    title?: string,
    description?: string,
  ) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issues,
        targetBranch,
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
      }),
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to create pull request");
    }
    return res.json() as Promise<{ prUrl: string; prNumber: number; branch: string; modifiedFiles: number; appliedIssues: number; skipped?: Array<{ file: string; reason: string }> }>;
  },

  // --- PR Manager: saved drafts + audit history ---

  async listDrafts() {
    const res = await fetch(`${API_BASE}/api/pr-manager/drafts`, { ...cred });
    if (!res.ok) throw new Error("Failed to load drafts");
    return res.json();
  },

  async createDraft(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/pr-manager/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to save draft");
    }
    return res.json();
  },

  async updateDraft(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/pr-manager/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to update draft");
    }
    return res.json();
  },

  async deleteDraft(id: string) {
    const res = await fetch(`${API_BASE}/api/pr-manager/drafts/${id}`, {
      method: "DELETE",
      ...cred,
    });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete draft");
  },

  async listAuditHistory(prId?: string) {
    const url = `${API_BASE}/api/pr-manager/history${prId ? `?prId=${encodeURIComponent(prId)}` : ""}`;
    const res = await fetch(url, { ...cred });
    if (!res.ok) throw new Error("Failed to load audit history");
    return res.json();
  },

  async createAuditHistory(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/pr-manager/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to record audit history");
    }
    return res.json();
  },

  async mergePull(owner: string, repo: string, number: string | number) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/pulls/${number}/merge`, {
      method: "PUT",
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to merge pull request");
    }
    return res.json();
  },

  async updatePull(owner: string, repo: string, number: string | number, data: any) {
    const res = await fetch(`${API_BASE}/api/repos/${owner}/${repo}/pulls/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...cred,
    });
    if (!res.ok) throw new Error("Failed to update pull request");
    return res.json();
  },

  // --- Workspaces (M2) ---

  async getWorkspaces() {
    const res = await fetch(`${API_BASE}/api/workspaces`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch workspaces");
    return res.json() as Promise<{ workspaces: WorkspaceSummary[] }>;
  },

  async getWorkspace(workspaceId: string) {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch workspace");
    return res.json() as Promise<{ workspace: WorkspaceDetail }>;
  },

  async getWorkspaceConnections(workspaceId: string) {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/provider-connections`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch provider connections");
    return res.json() as Promise<{ connections: ProviderConnectionSummary[] }>;
  },

  /** Creates a workspace GitHub connection from the user's legacy OAuth token. */
  async connectWorkspaceGithub(workspaceId: string) {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/provider-connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "github" }),
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to connect GitHub to this workspace");
    }
    return res.json();
  },

  async getWorkspaceRepositories(workspaceId: string) {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/repositories`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch workspace repositories");
    return res.json() as Promise<{ repositories: WorkspaceRepository[] }>;
  },

  async registerWorkspaceRepository(
    workspaceId: string,
    data: {
      providerConnectionId: string;
      provider: "github" | "bitbucket";
      providerExternalId: string;
      ownerAccount: string;
      fullName: string;
      name?: string;
      visibility?: "public" | "private" | "internal";
      archived?: boolean;
      defaultBranch?: string | null;
    },
  ) {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/repositories/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to register repository");
    }
    return res.json();
  },

  async syncWorkspaceRepository(workspaceId: string, repoId: string) {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/repositories/${repoId}/sync`, {
      method: "POST",
      ...cred,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(body.message || "Failed to sync repository");
    }
    return res.json() as Promise<{ repository: { id: string; fullName: string; defaultBranch: string | null; syncState: string; lastSyncedAt: string | null }; pullRequestsSynced: number }>;
  },

  async getWorkspaceRepoPulls(workspaceId: string, repoId: string, params: { state?: string; page?: number; perPage?: number } = {}) {
    const q = new URLSearchParams();
    if (params.state) q.set("state", params.state);
    if (params.page) q.set("page", String(params.page));
    if (params.perPage) q.set("perPage", String(params.perPage));
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/repositories/${repoId}/pulls?${q}`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch pull requests");
    return res.json() as Promise<PullListResponse>;
  },

  async getWorkspacePulls(workspaceId: string, params: { state?: string; page?: number; perPage?: number } = {}) {
    const q = new URLSearchParams();
    if (params.state) q.set("state", params.state);
    if (params.page) q.set("page", String(params.page));
    if (params.perPage) q.set("perPage", String(params.perPage));
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/pulls?${q}`, { ...cred });
    if (!res.ok) throw new Error("Failed to fetch pull requests");
    return res.json() as Promise<PullListResponse>;
  }
};

// --- Normalized API shapes (mirror-backed, provider-agnostic) ---

/** Normalized repository returned by GET /api/repos (provider-agnostic). */
export interface NormalizedRepository {
  provider: string;
  providerExternalId: string;
  ownerLogin: string;
  name: string;
  fullName: string;
  description?: string | null;
  language?: string | null;
  defaultBranch?: string | null;
  visibility?: string | null;
  archived?: boolean;
  stargazersCount?: number | null;
  updatedAt?: string | null;
  htmlUrl?: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
  type?: string;
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  type: string;
  plan: string;
  role: string;
  owner: string;
  createdAt: string;
}

export interface ProviderConnectionSummary {
  id: string;
  provider: string;
  kind: string;
  providerAccountId: string;
  providerAccountLogin: string | null;
  status: string;
}

export interface WorkspaceRepository {
  id: string;
  provider: string;
  providerExternalId: string;
  owner: string;
  fullName: string;
  name: string;
  visibility: string;
  archived: boolean;
  defaultBranch: string | null;
  syncState: string;
  lastSyncedAt: string | null;
}

export interface NormalizedPull {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  isDraft: boolean;
  author: { login: string; avatarUrl: string | null };
  sourceBranch: string;
  destinationBranch: string;
  url: string;
  additions: number;
  deletions: number;
  headSha: string | null;
  checkStatus: string;
  lastSeenAt: string | null;
  repository?: { id: string; fullName: string; name: string };
}

export interface PullListResponse {
  pulls: NormalizedPull[];
  page: number;
  hasNext: boolean;
  repository?: { id: string; fullName: string };
}
