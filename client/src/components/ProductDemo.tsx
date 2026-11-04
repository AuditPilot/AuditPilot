import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Check, ChevronRight, GitBranch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ------------------------------- demo data --------------------------------- */

const SCAN_LOG = [
  "→ cloning acme/webapp (shallow)…",
  "→ parsing 143 files · 11,902 loc",
  "→ auditing security sinks — XSS · CSRF · deps",
  "→ measuring Core Web Vitals budget…",
  "→ checking WCAG 2.1 labels & contrast",
  "✓ audit complete in 8.4s — 4 findings",
];

type Severity = "Critical" | "High" | "Medium";

type Issue = {
  id: string;
  title: string;
  severity: Severity;
  category: "Security" | "Performance" | "Accessibility";
  file: string;
  summary: string;
  before: string[];
  after: string[];
};

const ISSUES: Issue[] = [
  {
    id: "xss",
    title: "Unsafe innerHTML on user comments",
    severity: "Critical",
    category: "Security",
    file: "src/components/Comment.tsx",
    summary: "Rendered post bodies through dangerouslySetInnerHTML allows stored XSS. Fix replaces it with escaped React children.",
    before: ['- <div dangerouslySetInnerHTML={{ __html: post.body }} />'],
    after: ['+ <p className="whitespace-pre-wrap">{post.body}</p>'],
  },
  {
    id: "cls",
    title: "Images without intrinsic dimensions",
    severity: "High",
    category: "Performance",
    file: "src/pages/Product.tsx",
    summary: "Hero images have no width/height, pushing layout down as they load (CLS 0.19). Fix reserves space and serves WebP.",
    before: ['- <img src="/hero.png" alt="Product hero" />'],
    after: ['+ <img src="/hero.webp" width={1200} height={630}', '+      alt="Product hero" loading="eager" />'],
  },
  {
    id: "contrast",
    title: "Contrast 3.1:1 on nav links",
    severity: "High",
    category: "Accessibility",
    file: "src/layout/SiteNav.tsx",
    summary: "Muted link color fails WCAG AA (needs 4.5:1). Fix bumps the token to pass while keeping the look.",
    before: ['- <a className="text-neutral-400 hover:text-neutral-500">Docs</a>'],
    after: ['+ <a className="text-neutral-300 hover:text-white underline-offset-4">Docs</a>'],
  },
  {
    id: "lcp",
    title: "Oversized PNG is the LCP element",
    severity: "Medium",
    category: "Performance",
    file: "src/components/Banner.tsx",
    summary: "A 2.1 MB PNG competes with the LCP image. Fix converts to AVIF (−86%) and raises its fetch priority.",
    before: ['- <img src="/banner.png" />'],
    after: ['+ <img src="/banner.avif" fetchPriority="high" decoding="async" />'],
  },
];

const severityColor: Record<Severity, string> = {
  Critical: "bg-rose-400",
  High: "bg-amber-400",
  Medium: "bg-sky-400",
};

const severityChip: Record<Severity, string> = {
  Critical: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  High: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  Medium: "bg-sky-500/15 text-sky-300 border-sky-400/30",
};

/* ------------------------------ count-up ring ------------------------------ */

function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-[84px] w-[84px] shrink-0 place-items-center">
      <svg viewBox="0 0 76 76" className="absolute inset-0 -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="6" />
        <motion.circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="76" y2="76">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="font-mono text-lg font-bold text-white">{score}</div>
        <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">score</div>
      </div>
    </div>
  );
}

/* -------------------------------- component -------------------------------- */

type Phase = "idle" | "scanning" | "done";

export default function ProductDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [logCount, setLogCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fixedIds, setFixedIds] = useState<string[]>([]);
  const [prCreated, setPrCreated] = useState(false);
  const reducedMotion = useReducedMotion();

  const fixedSet = useMemo(() => new Set(fixedIds), [fixedIds]);
  const score = 72 + fixedIds.length * 6;
  const nextOpen = ISSUES.find((i) => !fixedSet.has(i.id));
  const allFixed = fixedIds.length === ISSUES.length;

  // streaming scan log
  useEffect(() => {
    if (phase !== "scanning") return;
    setLogCount(0);
    const interval = window.setInterval(() => {
      setLogCount((n) => {
        if (n + 1 === SCAN_LOG.length) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            setPhase("done");
            setSelectedId((prev) => prev ?? ISSUES[0].id);
          }, 250);
        }
        return Math.min(SCAN_LOG.length, n + 1);
      });
    }, reducedMotion ? 60 : 420);
    return () => window.clearInterval(interval);
  }, [phase, reducedMotion]);

  const runAudit = () => {
    setPrCreated(false);
    setFixedIds([]);
    setSelectedId(null);
    setPhase("scanning");
  };

  const reset = () => {
    setPhase("idle");
    setLogCount(0);
    setSelectedId(null);
    setFixedIds([]);
    setPrCreated(false);
  };

  const applyFix = () => {
    if (!selectedId) return;
    setFixedIds((ids) => (ids.includes(selectedId) ? ids : [...ids, selectedId]));
    const next = ISSUES.find((i) => i.id !== selectedId && !fixedSet.has(i.id));
    if (next) window.setTimeout(() => setSelectedId(next.id), 350);
  };

  const selected = ISSUES.find((i) => i.id === selectedId);
  const selectedFixed = selected ? fixedSet.has(selected.id) : false;
  const progress = phase === "scanning" ? (logCount / SCAN_LOG.length) * 100 : phase === "done" ? 100 : 0;
  const linesAdded = ISSUES.filter((i) => fixedSet.has(i.id)).reduce((n, i) => n + i.after.length, 0);
  const linesRemoved = ISSUES.filter((i) => fixedSet.has(i.id)).reduce((n, i) => n + i.before.length, 0);

  return (
    <section id="demo" className="relative scroll-mt-24 py-24 lg:py-32 border-t border-white/5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="text-center mb-14 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md mb-6"
          >
            <Play className="h-3.5 w-3.5 text-cyan-300" />
            Interactive demo — no signup, no code
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
            className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4"
          >
            Run a real audit. <span className="text-gradient-dark">Right here.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            This is the actual workflow — scan a repo, review AI fixes, ship them
            as a pull request. Try every button.
          </motion.p>
        </div>

        {/* console window */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-slate-950/60">
            <span className="h-3 w-3 rounded-full bg-rose-500/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
            <span className="mx-auto flex items-center gap-2 text-xs text-slate-500 font-mono">
              <GitBranch className="h-3 w-3" />
              acme/webapp · auditpilot/demo
            </span>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.15fr]">
            {/* -------------------------------------------- left: controls */}
            <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/5">
              <div className="flex items-center justify-between gap-4 mb-6">
                <ScoreRing score={score} />
                <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">
                  Health score updates as AI fixes are applied.
                </p>
              </div>

              <Button
                onClick={runAudit}
                disabled={phase === "scanning"}
                className="glow-ring group relative w-full h-12 rounded-xl bg-white/10 border border-white/15 text-white font-semibold backdrop-blur-md transition-[transform,background-color] duration-150 ease-out hover:scale-[1.02] hover:bg-white/15 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {phase === "scanning" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300 mr-2" />
                    Scanning…
                  </>
                ) : phase === "done" ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Run audit again
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 text-cyan-300" />
                    Run AI audit
                  </>
                )}
              </Button>

              {/* progress */}
              <div className="mt-6 h-1.5 rounded-full bg-white/5 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemax={100} aria-label="Scan progress">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              {/* scan log */}
              <div className="mt-5 min-h-[168px] rounded-xl border border-white/5 bg-slate-950/70 p-4 font-mono text-[11px] leading-6 text-slate-400 overflow-hidden">
                {logCount === 0 && phase === "idle" && (
                  <p className="text-slate-600">▮ waiting for scan…</p>
                )}
                {SCAN_LOG.slice(0, logCount).map((line, i) => (
                  <motion.p
                    key={line}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className={line.startsWith("✓") ? "text-emerald-300" : ""}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              {/* findings list */}
              <AnimatePresence>
                {phase === "done" && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Findings</span>
                      <span className="text-xs font-mono text-slate-500">
                        {fixedIds.length}/{ISSUES.length} fixed
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {ISSUES.map((issue) => {
                        const isFixed = fixedSet.has(issue.id);
                        const isSelected = issue.id === selectedId;
                        return (
                          <li key={issue.id}>
                            <button
                              onClick={() => setSelectedId(issue.id)}
                              aria-pressed={isSelected}
                              className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color] duration-150 ease-out ${
                                isSelected
                                  ? "border-indigo-400/50 bg-indigo-500/10"
                                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                              }`}
                            >
                              <span className={`h-2 w-2 shrink-0 rounded-full ${severityColor[issue.severity]}`} />
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-slate-200 truncate">{issue.title}</span>
                                <span className="block font-mono text-[10px] text-slate-500 truncate">{issue.file}</span>
                              </span>
                              {isFixed ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  <Check className="h-3 w-3" /> fixed
                                </span>
                              ) : (
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityChip[issue.severity]}`}>
                                  {issue.severity}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* -------------------------------------- right: diff / PR */}
            <div className="p-6 sm:p-8 relative">
              {prCreated ? (
                /* PR success panel */
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="h-full flex flex-col items-center justify-center text-center py-10"
                >
                  <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 mb-6">
                    <Sparkles className="h-7 w-7 text-emerald-300" />
                    <span className="absolute inset-0 rounded-2xl bg-emerald-400/10 animate-ping opacity-40" />
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">Pull request shipped 🎉</h3>
                  <p className="text-sm text-slate-400 max-w-sm mb-8">
                    <span className="font-mono text-emerald-300">auditpilot/auto-fixes-#142</span>{" "}
                    opened with your {fixedIds.length} fix{fixedIds.length === 1 ? "" : "es"}.
                  </p>
                  <div className="w-full max-w-sm space-y-2.5 text-left">
                    {[
                      { label: "Branch", value: "auditpilot/auto-fixes", mono: true },
                      { label: "Changes", value: `+${linesAdded} −${linesRemoved} · ${fixedIds.length} files`, mono: true },
                      { label: "Checks", value: "build ✓ lint ✓ a11y ✓", mono: true },
                      { label: "Reviewers", value: "auto-assigned: code owner" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                        <span className="text-xs text-slate-500">{row.label}</span>
                        <span className={`text-xs text-slate-200 ${row.mono ? "font-mono text-emerald-300" : ""}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="mt-8 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start a new audit
                  </Button>
                </motion.div>
              ) : selected ? (
                /* diff panel */
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${severityChip[selected.severity]}`}>
                        {selected.severity} · {selected.category}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-snug">{selected.title}</h3>
                      <p className="font-mono text-[11px] text-slate-500 mt-1">{selected.file}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed mb-5">{selected.summary}</p>

                  <div className="rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden flex-1 min-h-[190px]">
                    <div className="px-4 py-2 border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      suggested fix
                    </div>
                    <div className="p-2 space-y-0.5 font-mono text-[11.5px] leading-6">
                      {selected.before.map((line) => (
                        <div key={line} className="rounded-md bg-rose-500/[0.07] px-3 text-rose-300">{line}</div>
                      ))}
                      {selected.after.map((line) => (
                        <div key={line} className="rounded-md bg-emerald-500/[0.07] px-3 text-emerald-300">{line}</div>
                      ))}
                    </div>
                  </div>

                  {selectedFixed ? (
                    <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3.5">
                      <Check className="h-5 w-5 text-emerald-300 shrink-0" />
                      <p className="text-sm text-emerald-200">
                        Fix applied. {nextOpen ? "Select the next finding." : "Ship it — create the pull request."}
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={applyFix}
                      className="mt-6 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.02] hover:shadow-indigo-500/50 active:scale-[0.98]"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Apply AI fix
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}

                  {allFixed && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                      <Button
                        onClick={() => setPrCreated(true)}
                        className="mt-3 w-full h-12 rounded-xl bg-white text-slate-950 font-bold shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.02] hover:shadow-[0_14px_46px_-10px_rgba(255,255,255,0.45)] active:scale-[0.98]"
                      >
                        <GitBranch className="mr-2 h-4 w-4" />
                        Create pull request
                      </Button>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* empty state */
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 mb-5">
                    <Sparkles className="h-6 w-6 text-indigo-300" />
                  </span>
                  <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                    Run the audit to see findings, then open each one to review
                    the AI's suggested fix before applying it.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-600 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    diff preview appears here
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Mock data for illustration — the real product scans your repositories via the GitHub app.
        </p>
      </div>
    </section>
  );
}
