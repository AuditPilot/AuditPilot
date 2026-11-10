import { useState } from "react";
import { Loader2, RefreshCw, GitBranch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSyncWorkspaceRepository } from "@/hooks/use-workspaces";
import type { WorkspaceRepository } from "@/lib/api-service";
import { SyncStateBadge, VisibilityBadge, timeAgo } from "./shared";

export function RepoOverviewPage({ wsId, repo }: { wsId: string; repo: WorkspaceRepository }) {
  const sync = useSyncWorkspaceRepository(wsId);

  const facts: Array<[string, React.ReactNode]> = [
    ["Provider", <span className="capitalize">{repo.provider}</span>],
    ["Visibility", <VisibilityBadge visibility={repo.visibility} />],
    ["Default branch", repo.defaultBranch
      ? <span className="flex items-center gap-1.5 font-mono text-xs"><GitBranch className="w-3.5 h-3.5" />{repo.defaultBranch}</span>
      : <span className="text-slate-500">—</span>],
    ["Archived", repo.archived ? <span className="text-amber-400">yes</span> : <span className="text-emerald-400">no</span>],
    ["Sync state", <SyncStateBadge state={repo.syncState} />],
    ["Last synced", <span className="text-slate-300">{timeAgo(repo.lastSyncedAt)}</span>],
  ];

  return (
    <Card className="p-6 bg-slate-900/60 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-100">Repository details</h3>
        <Button size="sm" variant="outline" onClick={() => sync.mutate(repo.id)}
          disabled={sync.isPending}
          className="border-white/10 text-slate-300 hover:bg-white/5">
          {sync.isPending
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <RefreshCw className="w-4 h-4 mr-2" />}
          Sync now
        </Button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3">
            <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
            <dd className="mt-1.5 text-sm text-slate-200 flex items-center">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs text-slate-500">
        Pull request metadata is mirrored from {repo.provider}. Audits run against the provider
        directly and stay tied to your account until workspace-linked audit history ships (M4).
      </p>
    </Card>
  );
}
