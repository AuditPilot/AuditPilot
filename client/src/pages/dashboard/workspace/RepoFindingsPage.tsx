import { useState } from "react";
import { Bug, Loader2, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRepoFindings } from "@/hooks/use-workspaces";
import { SeverityBadge, FindingStatusBadge, timeAgo } from "./shared";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  "all", "open", "in_progress", "reopened", "fixed", "verified", "accepted_risk", "ignored",
] as const;

const SEVERITY_FILTERS = ["all", "critical", "high", "medium", "low"] as const;

/**
 * Repository findings (M4): the long-lived, lifecycle-managed issue list.
 * Same problem detected by consecutive audits is ONE row — `last seen`
 * moves, regressions are flagged, and the counts strip mirrors the server.
 */
export function RepoFindingsPage({ wsId, repoId }: { wsId: string; repoId: string }) {
  const [status, setStatus] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const { data, isLoading, isError } = useRepoFindings(wsId, repoId, status, severity);

  if (isLoading) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Loader2 className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Bug className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-100">Findings unavailable</h3>
        <p className="text-slate-500 mt-1">Could not load the findings list — try again shortly.</p>
      </Card>
    );
  }

  const findings = data?.findings ?? [];
  const counts = data?.counts ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map(name => (
          <button
            key={name}
            onClick={() => setStatus(name)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors capitalize",
              status === name
                ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-300"
                : "border-white/10 text-slate-500 hover:text-slate-300",
            )}
          >
            {name.replace(/_/g, " ")}
            <span className="ml-1.5 text-slate-500">{counts[name] ?? 0}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          {SEVERITY_FILTERS.map(name => (
            <button
              key={name}
              onClick={() => setSeverity(name)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full transition-colors capitalize",
                severity === name
                  ? "bg-white/10 text-slate-200"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {findings.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Bug className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">No findings here</h3>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            {status === "all" && severity === "all"
              ? "Run a deep audit to populate the findings pipeline — the same issue found in two audits stays one row."
              : "Nothing matches the current filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {findings.map(f => (
            <Card key={f._id} className="p-4 bg-slate-900/60 border border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <SeverityBadge severity={f.severity} />
                    <FindingStatusBadge status={f.status} />
                    {f.regression && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        <Flame className="w-3 h-3" />
                        regressed{f.regressionCount > 1 ? ` ×${f.regressionCount}` : ""}
                      </span>
                    )}
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">{f.category}</span>
                  </div>
                  <p className="text-sm text-slate-200">{f.description}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500 truncate">
                    {f.filePath}{f.lineStart ? `:${f.lineStart}` : ""}
                  </p>
                  {f.recommendation && (
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                      <span className="text-slate-500">Fix: </span>{f.recommendation}
                    </p>
                  )}
                </div>
                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  <p>first seen {timeAgo(f.firstDetectedAt)}</p>
                  <p>last seen {timeAgo(f.lastDetectedAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
