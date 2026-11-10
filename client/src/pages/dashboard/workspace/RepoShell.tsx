import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import DashboardLayout from "../DashboardLayout";
import { useWorkspace, useWorkspaceRepositories } from "@/hooks/use-workspaces";
import { cn } from "@/lib/utils";
import { RepoOverviewPage } from "./RepoOverviewPage";
import { RepoPullsPage } from "./RepoPullsPage";
import { RepoAuditsPage } from "./RepoAuditsPage";
import { RepoFindingsPage } from "./RepoFindingsPage";

const TABS = ["overview", "pulls", "audits", "findings"] as const;
type Tab = (typeof TABS)[number];

/**
 * Repository shell — the workspace-aware repo area with four tabs
 * (roadmap M2: overview / pulls now; audits / findings land in M4).
 */
export default function RepoShell() {
  const params = useParams<{ wsId: string; repoId: string; tab?: string }>();
  const wsId = params.wsId ?? "";
  const repoId = params.repoId ?? "";
  const { data: workspace } = useWorkspace(wsId || undefined);
  const { data: repositories, isLoading } = useWorkspaceRepositories(wsId || undefined);
  const [, setLocation] = useLocation();
  const activeTab: Tab = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as Tab) : "overview";

  const repo = useMemo(
    () => repositories?.find(r => r.id === repoId),
    [repositories, repoId],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!repo) {
    return (
      <DashboardLayout>
        <Card className="p-12 text-center border-dashed">
          <h3 className="text-lg font-semibold text-slate-100">Repository not found</h3>
          <p className="text-slate-500 mt-2">It may have been removed from this workspace.</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => setLocation(`/app/workspaces/${wsId}`)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {workspace?.name ?? "Workspace"}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{repo.fullName}</h2>
            <p className="text-sm text-slate-500 mt-1 font-mono text-xs">{repo.provider} · {repo.providerExternalId}</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-white/5 mb-6">
          {TABS.map(name => (
            <button
              key={name}
              onClick={() => setLocation(`/app/workspaces/${wsId}/repositories/${repoId}/${name}`)}
              className={cn(
                "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                activeTab === name
                  ? "border-indigo-400 text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-300",
              )}
            >
              {name}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <RepoOverviewPage wsId={wsId} repo={repo} />}
        {activeTab === "pulls" && <RepoPullsPage wsId={wsId} repoId={repoId} />}
        {activeTab === "audits" && <RepoAuditsPage />}
        {activeTab === "findings" && <RepoFindingsPage />}
      </motion.div>
    </DashboardLayout>
  );
}
