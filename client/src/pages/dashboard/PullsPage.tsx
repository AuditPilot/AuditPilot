import { useState } from "react";
import { motion } from "framer-motion";
import { GitPullRequest, Loader2, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspaces, useWorkspacePulls } from "@/hooks/use-workspaces";
import { useLocation } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { PullStateBadge, Pager, timeAgo } from "./workspace/shared";
import { cn } from "@/lib/utils";

const STATES = ["open", "merged", "closed", "all"] as const;

/**
 * Workspace PR inbox — mirror-backed, all authors, deduped across the
 * workspace's repositories. Sync happens from the workspace repository
 * registry, not here (the inbox is a cheap mirror read).
 */
export default function PullsPage() {
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces();
  const [state, setState] = useState<(typeof STATES)[number]>("open");
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();

  const workspace = workspaces?.find(w => w.type === "personal") ?? workspaces?.[0];
  const { data, isLoading, isError, refetch } = useWorkspacePulls(workspace?.id ?? "", state, page);

  if (wsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!workspace) {
    return (
      <DashboardLayout>
        <Card className="p-12 text-center border-dashed">
          <GitPullRequest className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">No workspace found</h3>
          <p className="text-slate-500">Sign out and back in to initialize your personal workspace.</p>
        </Card>
      </DashboardLayout>
    );
  }

  const ownerRepoOf = (pr: { repository?: { fullName?: string; id?: string } }) => {
    const [owner = "", repo = ""] = (pr.repository?.fullName ?? "").split("/");
    return { owner, repo };
  };

  const handleSelect = (pr: { number: number; repository?: { fullName?: string } }) => {
    const { owner, repo } = ownerRepoOf(pr);
    setLocation(`/app/pulls/${pr.number}${owner ? `?owner=${owner}&repo=${repo}` : ""}`);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Pull requests</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Every pull request across {workspace.name}'s repositories — sync from the Workspaces page.
            </p>
          </div>
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : isError ? (
          <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5">
            <div className="flex items-center justify-center gap-2 text-rose-300 text-sm mb-4">
              <AlertTriangle className="w-4 h-4" /> Failed to load pull requests.
            </div>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm" onClick={() => refetch()}>
              Try again
            </button>
          </Card>
        ) : !data || data.pulls.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <GitPullRequest className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100">
              No {state === "all" ? "" : state + " "}pull requests
            </h3>
            <p className="text-slate-500 mb-6">
              Register repositories in a workspace and run a sync — their PRs show up here.
            </p>
            <Button onClick={() => setLocation(`/app/workspaces/${workspace.id}`)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white">
              Go to Workspaces
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.pulls.map(pr => {
              const { owner, repo } = ownerRepoOf(pr);
              return (
                <Card
                  key={pr.id}
                  onClick={() => handleSelect(pr)}
                  className="p-6 bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="p-3 bg-white/5 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
                        <GitPullRequest className="w-6 h-6 text-slate-300 group-hover:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-100 text-lg group-hover:text-indigo-300 transition-colors truncate">{pr.title}</h3>
                        {/* Repo column — normalized mirror data (was blank on legacy pages) */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5 font-medium text-slate-400">
                            {repo || "unknown repository"}
                          </span>
                          <span className="w-1 h-1 bg-slate-600 rounded-full" />
                          <span className="flex items-center gap-1.5 font-mono">#{pr.number}</span>
                          <span className="w-1 h-1 bg-slate-600 rounded-full" />
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> seen {timeAgo(pr.lastSeenAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right shrink-0">
                      <PullStateBadge state={pr.state} />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t pt-4 border-white/5">
                    <div className="flex items-center gap-2">
                      {pr.author?.avatarUrl && <img src={pr.author.avatarUrl} className="w-5 h-5 rounded-full" alt="" />}
                      <span className="text-xs text-slate-500">{pr.author?.login}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full" />
                      <span className="text-xs font-mono text-slate-500">{pr.sourceBranch} → {pr.destinationBranch}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                      Audit Changes <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              );
            })}
            <Pager page={data.page} hasNext={data.hasNext}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => p + 1)} />
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
