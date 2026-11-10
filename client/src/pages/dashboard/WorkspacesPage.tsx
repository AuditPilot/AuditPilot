import { motion } from "framer-motion";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useLocation } from "wouter";
import DashboardLayout from "./DashboardLayout";

/**
 * Workspace picker — the entry point of the workspace-aware area.
 * Personal workspaces are migrated implicitly by the backend on first login.
 */
export default function WorkspacesPage() {
  const { data: workspaces, isLoading, isError, refetch } = useWorkspaces();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Workspaces</h2>
          <p className="text-sm text-slate-500 mt-1">
            Pick a workspace to manage its repositories and pull requests.
          </p>
        </div>

        {isError ? (
          <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5">
            <p className="text-rose-300 text-sm mb-4">Failed to load workspaces.</p>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm" onClick={() => refetch()}>
              Try again
            </button>
          </Card>
        ) : !workspaces || workspaces.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100">No workspaces yet</h3>
            <p className="text-slate-500 mb-6">
              Your personal workspace is created automatically the first time you sign in.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                onClick={() => setLocation(`/app/workspaces/${ws.id}`)}
                className="p-6 bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
                      <Building2 className="w-6 h-6 text-slate-300 group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">{ws.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{ws.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize bg-white/5 text-slate-400 border-none">
                      {ws.role}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
