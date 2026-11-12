import { useState } from "react";
import { ShieldCheck, Loader2, ArrowRightLeft, Plus, Minus, Repeat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRepoAudits, useRepoAuditCompare } from "@/hooks/use-workspaces";
import { SeverityBadge, timeAgo } from "./shared";

/**
 * Workspace-bound audit history for one repository (M4), plus the
 * fingerprint-set comparison between any two runs: still present /
 * appeared / disappeared (= candidate resolved).
 */
export function RepoAuditsPage({ wsId, repoId }: { wsId: string; repoId: string }) {
  const { data, isLoading } = useRepoAudits(wsId, repoId);
  const [base, setBase] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const compare = useRepoAuditCompare(wsId, repoId, base || undefined, target || undefined);

  const audits = data?.audits ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-slate-900/60 border border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <ArrowRightLeft className="w-4 h-4 text-indigo-300" />
          <span className="text-sm font-medium text-slate-200">Compare two runs</span>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <select
              value={base}
              onChange={e => setBase(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-md text-xs text-slate-200 px-2 py-1.5 max-w-56"
            >
              <option value="">Base run…</option>
              {audits.map(a => (
                <option key={a.id} value={a.id}>
                  {new Date(a.createdAt).toLocaleString()} · {a.itemCount} items
                </option>
              ))}
            </select>
            <span className="text-slate-500">→</span>
            <select
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-md text-xs text-slate-200 px-2 py-1.5 max-w-56"
            >
              <option value="">Target run…</option>
              {audits.map(a => (
                <option key={a.id} value={a.id}>
                  {new Date(a.createdAt).toLocaleString()} · {a.itemCount} items
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {compare.isPending && (
        <Card className="p-8 text-center border-dashed">
          <Loader2 className="w-6 h-6 text-indigo-400 mx-auto animate-spin" />
        </Card>
      )}

      {compare.isError && (
        <Card className="p-6 border-amber-500/20 bg-amber-500/5 text-sm text-amber-300">
          {compare.error instanceof Error ? compare.error.message : "Comparison failed."}
        </Card>
      )}

      {compare.data && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <CountCard
              icon={<Repeat className="w-4 h-4 text-amber-300" />}
              label="Still present"
              value={compare.data.counts.stillPresent}
              hint="detected in both runs"
            />
            <CountCard
              icon={<Plus className="w-4 h-4 text-rose-300" />}
              label="Appeared"
              value={compare.data.counts.newInTarget}
              hint="new in the target run"
            />
            <CountCard
              icon={<Minus className="w-4 h-4 text-emerald-300" />}
              label="Disappeared"
              value={compare.data.counts.resolvedInTarget}
              hint="absent from the target run — candidate resolved"
            />
          </div>
          {([
            ["Appeared", compare.data.newInTarget],
            ["Disappeared (candidate resolved)", compare.data.resolvedInTarget],
            ["Still present", compare.data.stillPresent],
          ] as const).map(([title, items]) => (
            <Card key={title} className="p-4 bg-slate-900/60 border border-white/10">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">{title}</h4>
              {items.length === 0 ? (
                <p className="text-xs text-slate-600">—</p>
              ) : (
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item.fingerprint} className="flex items-start gap-3 text-sm">
                      <SeverityBadge severity={item.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 truncate">{item.label}</p>
                        <p className="font-mono text-[11px] text-slate-500 truncate">{item.filePath}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center border-dashed">
            <Loader2 className="w-6 h-6 text-indigo-400 mx-auto animate-spin" />
          </Card>
        ) : audits.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100">No workspace-linked audits yet</h3>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">
              Deep audits run against this repository appear here once they can be linked to it
              (it must be registered in this workspace). Legacy account-scoped audits stay in the
              Audits tab of the sidebar.
            </p>
          </Card>
        ) : (
          audits.map(a => (
            <Card key={a.id} className="p-4 bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">{a.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.branch}
                  {a.commitSha ? ` @ ${a.commitSha.slice(0, 7)}` : ""} · {timeAgo(a.createdAt)}
                </p>
              </div>
              <div className="text-xs text-slate-400 flex gap-4 shrink-0">
                <span>{a.itemCount} items</span>
                <span title="items with fingerprints — comparison needs ≥1">{a.fingerprintCount} fingerprinted</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function CountCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint: string }) {
  return (
    <Card className="p-4 bg-slate-900/60 border border-white/10">
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
    </Card>
  );
}
