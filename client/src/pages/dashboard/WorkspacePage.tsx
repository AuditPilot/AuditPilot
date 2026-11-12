import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "wouter";
import {
  Loader2, RefreshCw, FolderGit2, AlertTriangle, Plus, Link2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardLayout from "./DashboardLayout";
import {
  useWorkspace, useWorkspaceConnections, useConnectWorkspaceGithub,
  useWorkspaceRepositories, useSyncWorkspaceRepository, useRegisterWorkspaceRepository,
  useGithubAppInstallUrl, useBitbucketAuthorizeUrl,
} from "@/hooks/use-workspaces";
import { api, type ProviderRepoCandidate } from "@/lib/api-service";
import { SyncStateBadge, VisibilityBadge, timeAgo } from "./workspace/shared";

type ProviderTab = "github" | "bitbucket";

interface RegisterCandidate {
  provider: ProviderTab;
  providerExternalId: string;
  ownerAccount: string;
  fullName: string;
  name: string;
  visibility: "public" | "private" | "internal";
  archived: boolean;
  defaultBranch: string | null;
}

/**
 * Workspace repository registry (mirror-backed). Repositories are synced
 * on demand — the mirror powers the workspace PR inbox without touching
 * the provider on every page load.
 */
export default function WorkspacePage() {
  const { wsId } = useParams<{ wsId: string }>();
  const { data: workspace, isLoading: wsLoading, isError: wsError } = useWorkspace(wsId || undefined);
  const { data: connections } = useWorkspaceConnections(wsId);
  const { data: repositories, isLoading: reposLoading, isError: reposError, refetch } = useWorkspaceRepositories(wsId);
  const [candidateRepos, setCandidateRepos] = useState<RegisterCandidate[] | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerTab, setRegisterTab] = useState<ProviderTab>("github");

  const sync = useSyncWorkspaceRepository(wsId);
  const register = useRegisterWorkspaceRepository(wsId);
  const connect = useConnectWorkspaceGithub(wsId);
  const installApp = useGithubAppInstallUrl(wsId);
  const connectBitbucket = useBitbucketAuthorizeUrl(wsId);

  const githubConnection = connections?.find(c => c.provider === "github" && c.kind !== "github-app");
  const appConnection = connections?.find(c => c.provider === "github" && c.kind === "github-app");
  const bitbucketConnection = connections?.find(c => c.provider === "bitbucket");

  const loadCandidates = async (provider: ProviderTab) => {
    setCandidateError(null);
    setCandidatesLoading(true);
    try {
      const { repositories: repos } = await api.getProviderRepos(wsId, provider);
      const registered = new Set((repositories ?? []).map(r => r.fullName));
      setCandidateRepos(
        repos
          .filter(r => !registered.has(r.fullName))
          .map(r => ({
            provider,
            providerExternalId: r.providerExternalId,
            ownerAccount: r.owner,
            fullName: r.fullName,
            name: r.name,
            visibility: (r.visibility || "public") as RegisterCandidate["visibility"],
            archived: r.archived,
            defaultBranch: r.defaultBranch,
          })),
      );
    } catch (err) {
      setCandidateError(err instanceof Error ? err.message : `Failed to load repositories from ${provider === "github" ? "GitHub" : "Bitbucket"}`);
      setCandidateRepos(null);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const openRegister = async () => {
    setRegisterOpen(true);
    setCandidateRepos(null);
    await loadCandidates(registerTab);
  };

  const switchRegisterTab = async (provider: ProviderTab) => {
    setRegisterTab(provider);
    setCandidateRepos(null);
    await loadCandidates(provider);
  };

  const connectionFor = (provider: ProviderTab) =>
    provider === "github" ? githubConnection ?? appConnection ?? null : bitbucketConnection ?? null;

  const canManage = workspace?.role === "owner" || workspace?.role === "admin" || workspace?.role === "developer";
  const isAdmin = workspace?.role === "owner" || workspace?.role === "admin";

  const table = useMemo(() => {
    if (reposLoading || wsLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      );
    }
    if (reposError || wsError) {
      return (
        <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5">
          <p className="text-rose-300 text-sm mb-4">Failed to load this workspace.</p>
          <button className="text-indigo-400 hover:text-indigo-300 text-sm" onClick={() => refetch()}>
            Try again
          </button>
        </Card>
      );
    }
    if (!repositories || repositories.length === 0) {
      return (
        <Card className="p-12 text-center border-dashed">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">No repositories registered</h3>
          <p className="text-slate-500 mb-6">
            Register a repository to sync its metadata and pull requests into AuditPilot.
          </p>
          {canManage && (
            <Button onClick={openRegister} className="bg-indigo-500 hover:bg-indigo-400 text-white">
              <Plus className="w-4 h-4 mr-2" /> Register repository
            </Button>
          )}
        </Card>
      );
    }
    return (
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Repository</th>
              <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Default branch</th>
              <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Visibility</th>
              <th className="text-left px-5 py-3 font-semibold">Sync</th>
              <th className="text-right px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {repositories.map(repo => (
              <tr key={repo.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <FolderGit2 className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-medium text-slate-100">{repo.fullName}</div>
                      <div className="text-xs text-slate-500">{repo.provider}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className="font-mono text-xs text-slate-400">{repo.defaultBranch || "—"}</span>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <VisibilityBadge visibility={repo.visibility} />
                  {repo.archived && <span className="ml-2 text-xs text-amber-400">archived</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <SyncStateBadge state={repo.syncState} />
                    <span className="text-xs text-slate-500">{timeAgo(repo.lastSyncedAt)}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm" variant="ghost"
                      disabled={sync.isPending}
                      onClick={() => sync.mutate(repo.id)}
                      title={`Sync from ${repo.provider === "bitbucket" ? "Bitbucket" : "GitHub"}`}
                      className="text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10"
                    >
                      {sync.isPending && sync.variables === repo.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />}
                      Sync
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => window.location.assign(`/app/workspaces/${wsId}/repositories/${repo.id}/pulls`)}
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                    >
                      Pulls
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [repositories, reposLoading, reposError, wsLoading, wsError, sync.isPending, sync.variables, wsId, canManage]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{workspace?.name ?? "Workspace"}</h2>
            <p className="text-sm text-slate-500 mt-1">
              Repository registry — metadata and pull requests are synced on demand.
            </p>
          </div>
          {canManage && repositories && repositories.length > 0 && (
            <Button onClick={openRegister} className="bg-indigo-500 hover:bg-indigo-400 text-white">
              <Plus className="w-4 h-4 mr-2" /> Register repository
            </Button>
          )}
        </div>

        {canManage && !githubConnection && (
          <Card className="p-5 mb-6 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-200">GitHub is not connected to this workspace</p>
                  <p className="text-xs text-amber-200/70 mt-1">
                    {isAdmin
                      ? "Syncing and PR mirroring need a workspace-level connection. Connect using your existing GitHub identity."
                      : "Ask a workspace admin to connect GitHub — syncing and PR mirroring need a workspace-level connection."}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline"
                    onClick={() => installApp.mutate()}
                    disabled={installApp.isPending}
                    className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10">
                    {installApp.isPending
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <Link2 className="w-4 h-4 mr-2" />}
                    Install GitHub App
                  </Button>
                  <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950">
                    {connect.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                    Connect GitHub
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {canManage && !bitbucketConnection && (
          <Card className="p-5 mb-6 border-sky-500/20 bg-sky-500/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-sky-200">Bitbucket Cloud is not connected to this workspace</p>
                  <p className="text-xs text-sky-200/70 mt-1">
                    {isAdmin
                      ? "Connect your Atlassian account to register Bitbucket repositories — sync and PR mirroring use the workspace-level connection."
                      : "Ask a workspace admin to connect Bitbucket Cloud — syncing and PR mirroring need a workspace-level connection."}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => connectBitbucket.mutate()} disabled={connectBitbucket.isPending}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 shrink-0">
                  {connectBitbucket.isPending
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <Link2 className="w-4 h-4 mr-2" />}
                  Connect Bitbucket
                </Button>
              )}
            </div>
          </Card>
        )}

        {table}

        {/* Register dialog */}
        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogContent className="sm:max-w-lg bg-slate-900/80 backdrop-blur-xl border border-white/10">
            <DialogHeader>
              <DialogTitle>Register repository</DialogTitle>
              <DialogDescription>
                Pick a repository from your connected provider account. Its metadata and pull requests sync into this workspace.
              </DialogDescription>
            </DialogHeader>
            <Tabs value={registerTab} onValueChange={v => switchRegisterTab(v as ProviderTab)}>
              <TabsList className="w-full">
                <TabsTrigger value="github" className="flex-1">GitHub</TabsTrigger>
                <TabsTrigger value="bitbucket" className="flex-1">Bitbucket</TabsTrigger>
              </TabsList>
              <TabsContent value={registerTab} className="mt-2">
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                  {candidatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    </div>
                  ) : candidateError ? (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                      {candidateError}
                    </div>
                  ) : !connectionFor(registerTab) ? (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                      {registerTab === "bitbucket"
                        ? "Connect Bitbucket Cloud to this workspace first (banner above), then reopen this tab."
                        : "Connect GitHub to this workspace first (banner above), then reopen this tab."}
                    </div>
                  ) : (candidateRepos?.length ?? 0) === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                      {registerTab === "bitbucket"
                        ? "All of your Bitbucket repositories are already registered."
                        : "All of your GitHub repositories are already registered."}
                    </div>
                  ) : (
                    candidateRepos!.map(candidate => (
                      <button
                        key={candidate.providerExternalId}
                        disabled={register.isPending}
                        onClick={() => register.mutate(
                          { ...candidate, providerConnectionId: connectionFor(registerTab)!.id },
                          { onSuccess: () => loadCandidates(registerTab) },
                        )}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/10 text-left transition-all"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-200">{candidate.fullName}</div>
                          <div className="text-xs text-slate-500 capitalize">{candidate.visibility}</div>
                        </div>
                        <Plus className="w-4 h-4 text-indigo-400" />
                      </button>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
