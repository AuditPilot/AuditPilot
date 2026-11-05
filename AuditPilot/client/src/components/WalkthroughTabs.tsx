import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronRight,
  FolderGit2,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Lock,
  Search,
  Zap,
  Eye,
  FileDiff,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ------------------------------- tab content ------------------------------- */

function ConnectPanel({ connected, onConnect }: { connected: boolean; onConnect: () => void }) {
  if (!connected) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-slate-200">
          <FolderGit2 className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-white mb-1">AuditPilot wants to access GitHub</p>
        <p className="text-xs text-slate-500 mb-5">The GitHub app authorizes in one click.</p>
        <ul className="space-y-2 text-left mb-6">
          {[
            { icon: <Eye className="h-3.5 w-3.5 text-cyan-300" />, text: "Read the repositories you choose" },
            { icon: <GitPullRequest className="h-3.5 w-3.5 text-indigo-300" />, text: "Create pull requests with fixes" },
            { icon: <Lock className="h-3.5 w-3.5 text-emerald-300" />, text: "Nothing else — revocable anytime" },
          ].map((p) => (
            <li key={p.text} className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
              {p.icon}
              {p.text}
            </li>
          ))}
        </ul>
        <Button
          onClick={onConnect}
          className="glow-ring group relative h-11 w-full rounded-xl bg-white/10 border border-white/15 text-white font-semibold transition-[transform,background-color] duration-150 ease-out hover:scale-[1.02] hover:bg-white/15 active:scale-[0.98]"
        >
          <FolderGit2 className="mr-2 h-4 w-4" /> Authorize AuditPilot
        </Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-sm text-center">
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-400/30"
      >
        <Check className="h-6 w-6 text-emerald-300" />
      </motion.span>
      <p className="text-sm font-semibold text-white mb-1">Connected — OAuth dance complete</p>
      <p className="text-xs text-slate-500 mb-5">Your repositories are ready for scanning.</p>
      <div className="flex justify-center gap-2">
        {["acme/webapp", "acme/marketing-site"].map((repo) => (
          <motion.span
            key={repo}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-slate-300"
          >
            <FolderGit2 className="h-3 w-3 text-indigo-300" /> {repo}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function ScanPanel() {
  const files = [
    { path: "src/auth/session.ts", findings: 0, pct: 100 },
    { path: "src/components/Cart.tsx", findings: 2, pct: 76 },
    { path: "src/layout/SiteNav.tsx", findings: 1, pct: 41 },
  ];
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="font-mono text-slate-500">143 files · 11,902 loc</span>
        <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
          scanning…
        </span>
      </div>
      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.path} className="rounded-xl border border-white/5 bg-slate-950/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3 font-mono text-[11px] text-slate-300 mb-2">
              <span className="truncate">{f.path}</span>
              {f.findings > 0 ? (
                <span className="rounded-full bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  {f.findings} findings
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-300 text-[10px] font-semibold"><Check className="h-3 w-3" /> clean</span>
              )}
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300"
                initial={{ width: "4%" }}
                animate={{ width: `${f.pct}%` }}
                transition={{ duration: 2.2, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-slate-600 font-mono">checks security · performance (CWV) · accessibility</p>
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-[1.25fr_1fr] items-start">
      <div className="rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden">
        <div className="px-3.5 py-2 border-b border-white/5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          src/components/Comment.tsx
        </div>
        <div className="space-y-0.5 p-2 font-mono text-[11px] leading-6">
          <div className="rounded-md bg-rose-500/[0.07] px-2.5 text-rose-300">- &lt;div dangerouslySetInnerHTML…/&gt;</div>
          <div className="rounded-md bg-emerald-500/[0.07] px-2.5 text-emerald-300">+ &lt;p&gt;&#123;post.body&#125;&lt;/p&gt;</div>
        </div>
      </div>
      <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.07] p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-500/20 text-indigo-300">
            <Zap className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">AI reviewer</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          <span className="text-white font-medium">Why the fix:</span> post bodies can contain
          HTML from a commenter. Escaping removes the sink without changing what users see.
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          <ShieldCheck className="h-3 w-3" /> 98% confidence
        </span>
      </div>
    </div>
  );
}

function ShipPanel({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-950/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <GitBranch className="h-3.5 w-3.5 text-indigo-300" />
          auditpilot/auto-fixes-142
        </span>
        {opened && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-full bg-violet-500/15 border border-violet-400/30 px-2 py-0.5 text-[10px] font-bold text-violet-300"
          >
            #142 OPEN
          </motion.span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
        {[
          { label: "files", value: "4" },
          { label: "added", value: "+6" },
          { label: "removed", value: "−4" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.03] py-3">
            <div className="font-mono text-sm font-bold text-white">{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
      <ul className="space-y-1.5 mb-6 text-[11px] font-mono text-slate-500">
        {["build ✓ pass", "lint ✓ pass", "a11y:- WCAG 2.1 ✓ pass"].map((chk) => (
          <li key={chk} className="flex items-center gap-2 text-emerald-400/90">{chk}</li>
        ))}
      </ul>
      {opened ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
          <FileDiff className="h-4 w-4 text-violet-300" />
          Ready to merge — the checks are green.
        </div>
      ) : (
        <Button
          onClick={onOpen}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.02] hover:shadow-indigo-500/50 active:scale-[0.98]"
        >
          <GitPullRequest className="mr-2 h-4 w-4" /> Open pull request
        </Button>
      )}
    </div>
  );
}

function MergePanel() {
  return (
    <div className="mx-auto grid max-w-md gap-4 sm:grid-cols-[1fr_auto] items-center rounded-2xl border border-white/10 bg-slate-950/70 p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-400/30 px-2.5 py-0.5 text-[10px] font-bold text-violet-300 mb-3">
          <GitMerge className="h-3 w-3" /> MERGED
        </span>
        <p className="text-sm font-semibold text-white mb-2">#142 · Auto-fixes · 2 commits</p>
        <ul className="space-y-1 text-xs text-slate-400">
          {["Stored XSS sealed", "CLS 0.19 → 0.02", "Contrast passes AA", "LCP −1.8s"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-3 w-3 text-emerald-400" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="text-center px-2">
        <div className="font-mono text-4xl font-bold text-gradient-dark">96</div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500">health score</div>
        <div className="mt-1 text-[10px] font-mono text-emerald-400">▲ from 72</div>
      </div>
    </div>
  );
}

/* ------------------------------- the section ------------------------------- */

const TABS = [
  { label: "Connect", icon: FolderGit2 },
  { label: "Audit", icon: Search },
  { label: "Review", icon: FileDiff },
  { label: "Ship", icon: GitPullRequest },
  { label: "Merge", icon: GitMerge },
];

export default function WalkthroughTabs() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const [prOpened, setPrOpened] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % TABS.length), 5000);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion]);

  const select = (i: number) => {
    setActive(i);
    setPaused(true);
  };

  return (
    <section id="tour" className="relative scroll-mt-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md mb-6"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-300" />
            The product, on this page
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4"
          >
            Click through the <span className="text-gradient-dark">real flow.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Every tab is the actual screen you'll see in the app. Try the buttons
            — they respond.
          </motion.p>
        </div>

        {/* tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mx-auto flex max-w-2xl items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-1.5 shadow-xl shadow-black/30 overflow-x-auto"
          role="tablist"
          aria-label="Product walkthrough"
        >
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              role="tab"
              aria-selected={active === i}
              onClick={() => select(i)}
              className={`relative flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out ${
                active === i ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {active === i && (
                <motion.span
                  layoutId="tour-tab"
                  transition={{ duration: 0.3, ease: EASE }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 shadow-lg shadow-indigo-600/30"
                />
              )}
              <span className="relative flex items-center justify-center gap-1.5">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* panel */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="mx-auto mt-6 max-w-5xl rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-slate-950/60">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="mx-auto font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              {TABS[active].label.toLowerCase()}-screen
            </span>
          </div>
          <div className="min-h-[340px] p-6 sm:p-10 grid place-items-center" role="tabpanel">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="w-full"
              >
                {active === 0 && <ConnectPanel connected={connected} onConnect={() => setConnected(true)} />}
                {active === 1 && <ScanPanel />}
                {active === 2 && <ReviewPanel />}
                {active === 3 && <ShipPanel opened={prOpened} onOpen={() => setPrOpened(true)} />}
                {active === 4 && <MergePanel />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-center gap-2 pb-6">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => select(i)}
                aria-label={`Go to ${t.label}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${active === i ? "w-6 bg-indigo-400" : "w-2.5 bg-white/15 hover:bg-white/30"}`}
              />
            ))}
          </div>
        </motion.div>

        <p className="mt-5 text-center text-xs text-slate-600 flex items-center justify-center gap-1.5">
          Auto-plays until you interact
          <ChevronRight className="h-3 w-3" />
          then it's yours to explore
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   AuditCoverage — concrete checklist of what a run inspects.
--------------------------------------------------------------------------- */

const GROUPS = [
  {
    icon: <Search className="h-5 w-5 text-cyan-300" />,
    title: "Security",
    items: ["XSS & injection sinks", "CSRF & header hygiene", "Vulnerable dependencies", "Secrets & token leaks"],
  },
  {
    icon: <Zap className="h-5 w-5 text-indigo-300" />,
    title: "Performance",
    items: ["Core Web Vitals (LCP · CLS · INP)", "Bundle & image payloads", "Render-blocking resources", "Caching & compression"],
  },
  {
    icon: <Eye className="h-5 w-5 text-violet-300" />,
    title: "Accessibility",
    items: ["ARIA completeness", "Keyboard traps & focus order", "Contrast & color pairs", "Semantic landmarks"],
  },
];

export function AuditCoverage() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE }}
            className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
          >
            What a single run <span className="text-gradient-dark">covers.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
            className="text-slate-400"
          >
            Included in every audit, on every plan — the checklist our engine runs per file.
          </motion.p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {GROUPS.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
              className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 transition-[border-color,transform] duration-300 ease-out hover:border-indigo-400/25 hover:-translate-y-1"
            >
              <span className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-white/5 border border-white/10">
                {g.icon}
              </span>
              <h3 className="text-lg font-bold text-white mb-5">{g.title}</h3>
              <ul className="space-y-3">
                {g.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
