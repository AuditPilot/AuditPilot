import { useState } from "react";
import { Loader2, RefreshCw, GitBranch, HeartPulse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSyncWorkspaceRepository, useRepoHealth } from "@/hooks/use-workspaces";
import type { WorkspaceRepository } from "@/lib/api-service";
import { SyncStateBadge, VisibilityBadge, timeAgo } from "./shared";

/** Health card (M4): published formula, missing data is NEVER healthy. */
function HealthCard({ wsId, repoId }: { wsId: string; repoId: string }) {
  const { data, isLoading } = useRepoHealth(wsId, repoId);

  if (isLoading) {
    return (
      <Card className="p-6 bg-slate-900/60 border border-white/10">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </Card>
    );
  }
  if (!data) return null;

  const statusStyles: Record<string, string> = {
    unaudited: "bg-slate-500/10 text-slate-400",
    stale: "bg-amber-500/10 text-amber-300",
    current: "bg-emerald-500/10 text-emerald-300",
  };
  const scoreColor = data.score == null ? "text-slate-500"
    : data.score >= 80 ? "text-emerald-300"
    : data.score >= 50 ? "text-amber-300"
    : "text-rose-300";
  const open = (data.openCounts.open ?? 0) + (data.openCounts.in_progress ?? 0) + (data.openCounts.reopened ?? 0);

  return (
    <Card className="p-6 bg-slate-900/60 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-indigo-300" /> Health
        </h3>
        <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusStyles[data.status] ?? ""}`}>
          {data.status}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${scoreColor}`}>{data.score == null ? "—" : data.score}</span>
        <span className="text-slate-500 text-sm">/ 100</span>
      </div>
      {data.score == null ? (
        <p className="mt-2 text-xs text-slate-500">
          No completed audit is linked to this repository yet — no score is invented. Run a deep audit.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          {data.weightedOpen} weighted open load · {open} open · {data.regressions} regressed
          {data.lastAudit ? ` · last audit ${timeAgo(data.lastAudit.at)}` : ""}
        </p>
      )}
      <p className="mt-3 text-[10px] text-slate-600 leading-relaxed">{data.formula.note}</p>
    </Card>
  );
}

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
              Pull request metadata is mirrored from {repo.provider}. Deep audits linked to this
              repository feed the persistent findings pipeline and the health score.
            </p>
          </Card>
        </div>
        <HealthCard wsId={wsId} repoId={repo.id} />
      </div>
    </div>
  );
}
