import { useState } from "react";
import { Bug, Loader2, Flame, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRepoFindings, useWorkspace, useWorkspaceMembers, useAssignFinding } from "@/hooks/use-workspaces";
import { SeverityBadge, FindingStatusBadge, timeAgo } from "./shared";
import { cn } from "@/lib/utils";
import { type RepoFinding } from "@/lib/api-service";

const STATUS_FILTERS = [
  "all", "open", "in_progress", "reopened", "fixed", "verified", "accepted_risk", "ignored",
] as const;

const SEVERITY_FILTERS = ["all", "critical", "high", "medium", "low"] as const;

/**
 * Repository findings (M4): the long-lived, lifecycle-managed issue list.
 * Same problem detected by consecutive audits is ONE row — `last seen`
 * moves, regressions are flagged, and the counts strip mirrors the server.
 * M8 adds per-finding assignment to active workspace members (developer+).
 */
export function RepoFindingsPage({ wsId, repoId }: { wsId: string; repoId: string }) {
  const [status, setStatus] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const { data, isLoading, isError } = useRepoFindings(wsId, repoId, status, severity);
  const { data: workspace } = useWorkspace(wsId);
  const { data: members } = useWorkspaceMembers(wsId);
  const assign = useAssignFinding(wsId, repoId);

  const canAssign = workspace?.role === "owner" || workspace?.role === "admin" || workspace?.role === "developer";
  const assignees = (members ?? []).filter(m => m.status === "active");

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
            <FindingRow
              key={f._id}
              finding={f}
              assignees={canAssign ? assignees : []}
              disabled={assign.isPending}
              onAssign={(assignedTo) => assign.mutate({ findingId: f._id, assignedTo })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FindingRow({
  finding, assignees, disabled, onAssign,
}: {
  finding: RepoFinding;
  assignees: Array<{ userId: string; username: string | null; avatarUrl: string | null }>;
  disabled: boolean;
  onAssign: (assignedTo: string | null) => void;
}) {
  return (
    <Card className="p-4 bg-slate-900/60 border border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <SeverityBadge severity={finding.severity} />
            <FindingStatusBadge status={finding.status} />
            {finding.regression && (
              <span className="inline-flex items-center gap-1 text-[11px] text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3" />
                regressed{finding.regressionCount > 1 ? ` ×${finding.regressionCount}` : ""}
              </span>
            )}
            <span className="text-[11px] uppercase tracking-wider text-slate-500">{finding.category}</span>
          </div>
          <p className="text-sm text-slate-200">{finding.description}</p>
          <p className="mt-1 font-mono text-xs text-slate-500 truncate">
            {finding.filePath}{finding.lineStart ? `:${finding.lineStart}` : ""}
          </p>
          {finding.recommendation && (
            <p className="mt-2 text-xs text-slate-400 line-clamp-2">
              <span className="text-slate-500">Fix: </span>{finding.recommendation}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right text-[11px] text-slate-500">
            <p>first seen {timeAgo(finding.firstDetectedAt)}</p>
            <p>last seen {timeAgo(finding.lastDetectedAt)}</p>
          </div>
          {assignees.length > 0 ? (
            <select
              value={finding.assignedTo ?? ""}
              disabled={disabled}
              onChange={e => onAssign(e.target.value === "" ? null : e.target.value)}
              className={cn(
                "bg-slate-950 border border-white/10 rounded-md text-[11px] text-slate-300 px-2 py-1 focus:outline-none focus:border-indigo-400/50 max-w-44",
                !finding.assignedTo && "text-slate-500",
              )}
            >
              <option value="">Unassigned</option>
              {assignees.map(m => (
                <option key={m.userId} value={m.userId}>{m.username ?? m.userId}</option>
              ))}
            </select>
          ) : finding.assignee ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <UserRound className="w-3 h-3" />
              {finding.assignee.username ?? "assigned"}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
