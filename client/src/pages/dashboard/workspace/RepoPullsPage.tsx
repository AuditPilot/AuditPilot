import { useState } from "react";
import { GitPullRequest, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkspaceRepoPulls, useSyncWorkspaceRepository } from "@/hooks/use-workspaces";
import { useLocation } from "wouter";
import { PullStateBadge, Pager, timeAgo } from "./shared";
import { cn } from "@/lib/utils";

const STATES = ["open", "merged", "closed", "all"] as const;

/** Repository-scoped PR list — mirror-backed, all authors, paged. */
export function RepoPullsPage({ wsId, repoId }: { wsId: string; repoId: string }) {
  const [state, setState] = useState<(typeof STATES)[number]>("open");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useWorkspaceRepoPulls(wsId, repoId, state, page);
  const sync = useSyncWorkspaceRepository(wsId);
  const [, setLocation] = useLocation();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1">
          {STATES.map(s => (
            <button
              key={s}
              onClick={() => { setState(s); setPage(1); }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors",
                state === s ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => sync.mutate(repoId)}
          disabled={sync.isPending}
          className="border-white/10 text-slate-300 hover:bg-white/5">
          {sync.isPending
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <RefreshCw className="w-4 h-4 mr-2" />}
          Sync
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5">
          <p className="text-rose-300 text-sm mb-4">Failed to load pull requests.</p>
          <button className="text-indigo-400 hover:text-indigo-300 text-sm" onClick={() => refetch()}>
            Try again
          </button>
        </Card>
      ) : !data || data.pulls.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <GitPullRequest className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">No {state === "all" ? "" : state + " "}pull requests</h3>
          <p className="text-slate-500 mt-1">
            Run a sync to pull the latest PRs from {data?.repository?.fullName ?? "this repository"}.
          </p>
        </Card>
      ) : (
        <div className={cn("space-y-3", isFetching && "opacity-60 transition-opacity")}>
          {data.pulls.map(pr => (
            <Card
              key={pr.id}
              onClick={() => setLocation(`/app/pulls/${pr.number}?owner=${data.repository?.fullName.split("/")[0]}&repo=${data.repository?.fullName.split("/")[1]}`)}
              className="p-5 bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <GitPullRequest className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">{pr.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span className="font-mono">#{pr.number}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="font-mono">{pr.sourceBranch} → {pr.destinationBranch}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span>+{pr.additions} −{pr.deletions}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span>by {pr.author.login}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span>seen {timeAgo(pr.lastSeenAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <PullStateBadge state={pr.state} />
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                </div>
              </div>
            </Card>
          ))}
          <Pager page={data.page} hasNext={data.hasNext} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
        </div>
      )}
    </div>
  );
}
