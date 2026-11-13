import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, ArrowRight, Shield, Zap, CheckCircle2, Loader2, Code2, GitBranch, FileCode2, Clock, FileSearch, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudit } from "@/hooks/use-audits";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "../DashboardLayout";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function severityChip(sev?: string) {
  switch ((sev || "").toLowerCase()) {
    case "critical":
      return "bg-rose-500/10 text-rose-300 border-rose-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-300 border-orange-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    default:
      return "bg-white/5 text-slate-400 border-white/10";
  }
}

/* Stage-log rendering helpers (M6 engine transparency) */

type StageRecord = { name: string; status?: string; detail?: string; error?: string };

const STAGE_LABELS: Record<string, string> = {
  discovery: "Tree discovery",
  classify: "File classification",
  dependencies: "Dependency scan (OSV)",
  secrets: "Secret scanners",
  static: "Static rules",
  heuristics: "Configuration heuristics",
  "ai-chunks": "AI investigation",
  validation: "Anchor validation",
  fingerprinting: "Dedupe & fingerprints",
};

function stageChip(status?: string) {
  if (status === "ok") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (status === "failed") return "bg-rose-500/10 text-rose-300 border-rose-500/20";
  return "bg-white/5 text-slate-400 border-white/10";
}

function scanSummaryGrid(summary?: Record<string, unknown> | null) {
  if (!summary) return null;
  const cells: Array<{ key: string; label: string }> = [
    { key: "filesDiscovered", label: "Files discovered" },
    { key: "filesClassified", label: "Files classified" },
    { key: "filesAnalyzed", label: "Files analyzed" },
    { key: "scannerFindings", label: "Scanner findings" },
    { key: "aiFindings", label: "AI findings" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cells.map(c => (
        <div key={c.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <div className="text-lg font-bold text-slate-100 tabular-nums">
            {typeof summary[c.key] === "number" ? (summary[c.key] as number) : "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AuditResultsPage() {
  const { owner, repo, auditId } = useParams<{ owner: string, repo: string, auditId: string }>();
  const [, setLocation] = useLocation();
  const { data: audit, isLoading } = useAudit(auditId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const issues = audit?.items || [];
  const createdAt = audit?.createdAt ? new Date(audit.createdAt as unknown as string) : null;

  return (
    <DashboardLayout>
      <div className="relative -mx-2 px-2 pb-20">
        {/* ── Aurora hero backdrop (same atmosphere as the Landing hero) ─ */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-64 bg-grid-dark pointer-events-none" />
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/3 h-72 w-[560px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute top-10 right-[-4rem] h-56 w-56 rounded-full bg-cyan-500/10 blur-[100px]" />

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative space-y-8">
          {/* ── Header row ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/app/repos')}
              className="px-2 h-8 text-sm text-slate-400 hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to repos
            </Button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md">
                {issues.length} Issues Found
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md ${
                  audit?.priority === 'critical'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}
              >
                {audit?.priority} Priority
              </span>
            </div>
          </div>

          {/* ── Hero summary card ──────────────────────────────────────── */}
          <section className="relative rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.04]" aria-hidden="true">
              <Shield className="w-40 h-40 text-indigo-400" />
            </div>
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Audit completed
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3 leading-[1.08]">
                Audit Report: <span className="text-gradient-dark">{repo}</span>
              </h2>
              <p className="text-slate-400 max-w-2xl text-base leading-relaxed">{audit?.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                  branch <span className="font-mono font-semibold text-slate-300">{(audit as any)?.branch || "main"}</span>
                </span>
                <span className="flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                  {issues.length} finding{issues.length === 1 ? "" : "s"} reported
                </span>
                {createdAt && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* ── How this audit ran (M6 staged engine transparency) ────── */}
          {Array.isArray((audit as Record<string, unknown> | null)?.stages) && (
            <section className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 shadow-xl shadow-black/20">
              <div className="flex items-center gap-2.5 mb-5">
                <Bot className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">How this audit ran</h3>
              </div>
              {scanSummaryGrid((audit as Record<string, unknown>).scanSummary as Record<string, unknown>)}
              <div className="mt-5 space-y-1.5">
                {((audit as Record<string, unknown>).stages as StageRecord[]).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 w-20 text-center ${stageChip(s.status)}`}>
                      {s.status || "skipped"}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 shrink-0">{STAGE_LABELS[s.name] || s.name}</span>
                    {s.detail && <span className="text-[11px] font-mono text-slate-500 truncate">{s.detail}</span>}
                    {s.error && <span className="text-[11px] text-rose-400/80 truncate" title={s.error}>⚠ {s.error}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Findings ───────────────────────────────────────────────── */}
          <div className="space-y-4">
            {issues.length === 0 ? (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] backdrop-blur-xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold tracking-tight text-emerald-200">No Issues Detected</h3>
                <p className="text-emerald-300/70 max-w-md mx-auto mt-2">
                  Your repository follows security and performance best practices.
                </p>
              </div>
            ) : (
              issues.map((issue: any, idx: number) => (
                <motion.section
                  key={idx}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: Math.min(idx, 4) * 0.06, ease: EASE }}
                  className="relative rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden transition-[border-color,transform] duration-300 ease-out hover:-translate-y-1 hover:border-indigo-400/25"
                >
                  {/* header */}
                  <div className="flex flex-row items-start justify-between gap-4 py-5 px-6 bg-white/[0.03] border-b border-white/5 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${issue.severity === 'critical' ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20'}`}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="uppercase text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-300">
                            {issue.type}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityChip(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                          <Code2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{issue.value || "General location"}</span>
                        </h3>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-slate-500 border border-white/10 bg-white/5 rounded-full px-2.5 py-1">
                      ID: {issue._id.slice(-6)}
                    </span>
                  </div>

                  {/* body */}
                  <div className="px-6 py-6">
                    <p className="text-slate-300 leading-relaxed mb-4 text-[15px]">{issue.label}</p>

                    {/* file anchor + provenance (M6 readable report rows) */}
                    {issue.value && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                        <FileSearch className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-mono truncate">{issue.value}</span>
                      </div>
                    )}
                    {issue.auditorNotes && (
                      <p className="text-[11px] font-mono text-slate-500 mb-5">{issue.auditorNotes}</p>
                    )}

                    {issue.new_code ? (
                      <div className="space-y-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Zap className="w-3 h-3 text-amber-400" /> Suggested fix
                        </div>
                        <div className="bg-[#0d1117] rounded-2xl p-4 font-mono text-xs overflow-x-auto border border-white/10 shadow-inner">
                          {issue.old_code && (
                            <div className="text-red-400 opacity-60 mb-2 line-through decoration-red-900/50 block whitespace-pre">
                              {issue.old_code}
                            </div>
                          )}
                          <div className="text-green-400 block whitespace-pre">{issue.new_code}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 text-sm text-amber-300 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Manual Review Required</p>
                          <p className="opacity-80 mt-0.5">
                            This issue requires a complex architectural change that should be reviewed by a developer.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.section>
              ))
            )}
          </div>

          {/* ── Sticky create CTA ──────────────────────────────────────── */}
          <div className="pt-10 flex flex-col items-center sticky bottom-8 z-30">
            <Button
              onClick={() => setLocation(`/app/audit/${owner}/${repo}/edit/${auditId}`)}
              disabled={issues.length === 0}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white px-12 h-16 text-xl font-bold shadow-2xl shadow-indigo-500/25 group rounded-full border-4 border-slate-950 transition-[transform,opacity] duration-150 ease-out hover:scale-[1.02] disabled:hover:scale-100"
            >
              <Zap className="w-6 h-6 mr-3 fill-current" />
              Review &amp; Edit Fixes
              <ArrowRight className="w-6 h-6 ml-3 transition-transform duration-150 ease-out group-hover:translate-x-1" />
            </Button>
            {issues.length > 0 && (
              <p className="mt-3 text-slate-500 text-xs backdrop-blur-md px-3 py-1 rounded-full bg-slate-950/60 text-slate-400">
                Opens the PR composer &amp; inline fix editor
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
