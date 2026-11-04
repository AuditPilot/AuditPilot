import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, ChevronDown, GitPullRequest, FolderGit2, Users, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ---------------------------------------------------------------------------
   PlanFinder — interactive sliders that recommend a tier from usage inputs.
--------------------------------------------------------------------------- */

const PLAN_LIMITS = { Starter: 2, Pro: 100, Agency: Infinity } as const;

function recommend(prs: number, repos: number) {
  if (prs <= 10 && repos <= 2) return "Starter" as const;
  if (prs <= 100 && repos <= 10) return "Pro" as const;
  return "Agency" as const;
}

function SliderRow({
  icon,
  label,
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  icon: ReactNode;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-slate-300">
          <span className="text-slate-500">{icon}</span>
          {label}
        </span>
        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-xs text-cyan-300 tabular-nums">
          {value.toLocaleString()} {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-dark w-full cursor-pointer"
        aria-label={label}
        style={{ background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(168 85 247) ${pct}%, rgb(255 255 255 / 0.08) ${pct}%)` }}
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-600">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function PlanFinder() {
  const [repos, setRepos] = useState(3);
  const [prs, setPrs] = useState(45);
  const [team, setTeam] = useState(5);
  const plan = recommend(prs, repos);

  const copy: Record<string, string> = {
    Starter: "You're light — start free, upgrade only when usage grows.",
    Pro: "Best fit: 100 PR reviews & audits a month cover your volume.",
    Agency: "Your client volume needs unlimited runs — we'll size it for you.",
  };

  return (
    <section id="planner" className="relative scroll-mt-24 py-20 lg:py-28 border-t border-white/5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="text-center mb-12 lg:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md mb-6"
          >
            <GitPullRequest className="h-3.5 w-3.5 text-violet-300" />
            Usage planner
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4"
          >
            Not sure which plan? <span className="text-gradient-dark">Slide it.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Tell us how you ship and we'll point to the right tier — instantly.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid lg:grid-cols-[1.2fr_1fr] gap-6 max-w-5xl mx-auto"
        >
          {/* sliders panel */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-7 sm:p-9 space-y-7 shadow-2xl shadow-black/40">
            <SliderRow icon={<FolderGit2 className="h-4 w-4" />} label="Repositories" min={1} max={30} value={repos} onChange={setRepos} suffix="repos" />
            <SliderRow icon={<GitPullRequest className="h-4 w-4" />} label="PRs shipped monthly" min={1} max={500} value={prs} onChange={setPrs} suffix="PRs" />
            <SliderRow icon={<Users className="h-4 w-4" />} label="Team size" min={1} max={50} value={team} onChange={setTeam} suffix="devs" />
            <p className="text-[11px] text-slate-600 font-mono pt-1">Inputs stay in your browser — nothing is sent.</p>
          </div>

          {/* recommendation panel */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-500/10 via-slate-900/70 to-slate-900/80 p-7 sm:p-9 flex flex-col shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Recommended for you</span>
            <motion.div
              key={plan}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="text-4xl font-bold text-gradient-dark mb-3"
            >
              {plan}
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.p
                key={copy[plan]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-sm text-slate-400 leading-relaxed mb-8"
              >
                {copy[plan]}
              </motion.p>
            </AnimatePresence>

            {/* usage vs limits */}
            <div className="space-y-3 mb-8">
              {(
                [
                  { label: "PR reviews used", limit: PLAN_LIMITS[plan], val: prs },
                  { label: "Audits used", limit: PLAN_LIMITS[plan], val: prs },
                ] as const
              ).map((row) => {
                const capped = Number.isFinite(row.limit) ? Math.min((row.val / row.limit) * 100, 100) : (row.val / 500) * 40;
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>{row.label}</span>
                      <span className="font-mono">{Number.isFinite(row.limit) ? `${row.val} / ${row.limit}/mo` : "unlimited"}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${capped >= 100 ? "from-rose-400 to-amber-300" : "from-indigo-400 to-cyan-300"}`}
                        animate={{ width: `${capped}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <a href="#plans" className="mt-auto">
              <Button className="w-full h-12 rounded-xl bg-white/10 border border-white/15 text-white font-semibold transition-[transform,background-color] duration-150 ease-out hover:scale-[1.02] hover:bg-white/15 active:scale-[0.98]">
                See the {plan} plan
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   ComparisonTable — feature matrix across the three tiers.
--------------------------------------------------------------------------- */

type CellValue = string | boolean;

const COMPARE_ROWS: { label: string; values: [CellValue, CellValue, CellValue] }[] = [
  { label: "PR reviews / month", values: ["2", "100", "Unlimited"] },
  { label: "Automated audits / month", values: ["5", "100", "Unlimited"] },
  { label: "Repositories", values: ["Team-shared", "Unlimited", "Unlimited"] },
  { label: "AI fix quality", values: ["Basic", "Advanced", "Advanced"] },
  { label: "Real-time PR audits", values: [false, true, true] },
  { label: "White-label reports", values: [false, false, true] },
  { label: "Custom rules engine", values: [false, false, true] },
  { label: "Support", values: ["Community", "Priority", "Dedicated"] },
];

function Cell({ value, emphasized }: { value: CellValue; emphasized: boolean }) {
  return (
    <td className={`px-5 py-4 text-center text-sm ${emphasized ? "bg-indigo-500/[0.06]" : ""}`}>
      {typeof value === "boolean" ? (
        value ? (
          <Check className="mx-auto h-4.5 w-4.5 text-cyan-300" aria-label="Included" />
        ) : (
          <Minus className="mx-auto h-4 w-4 text-slate-600" aria-label="Not included" />
        )
      ) : (
        <span className="text-slate-300">{value}</span>
      )}
    </td>
  );
}

export function ComparisonTable() {
  return (
    <section id="compare" className="relative scroll-mt-24 py-20 lg:py-28 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE }}
            className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
          >
            Compare every line of the <span className="text-gradient-dark">fine print.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
            className="text-slate-400"
          >
            What you actually get on each tier — no asterisks.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: EASE }}
          className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 w-[38%]">Feature</th>
                  {["Starter", "Pro", "Agency"].map((name) => (
                    <th key={name} className={`px-5 py-5 text-center text-sm font-bold ${name === "Pro" ? "bg-indigo-500/[0.06] text-gradient-dark" : "text-slate-300"}`}>
                      {name}
                      {name === "Pro" && <span className="sr-only"> — most popular</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white/[0.015]" : ""}>
                    <th scope="row" className="px-5 py-4 text-left text-sm font-medium text-slate-400">
                      {row.label}
                    </th>
                    <Cell value={row.values[0]} emphasized={false} />
                    <Cell value={row.values[1]} emphasized={true} />
                    <Cell value={row.values[2]} emphasized={false} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   PricingFaq — accordion for billing & security questions.
--------------------------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "What counts as a PR review?",
    a: "Every open pull request that AuditPilot audits counts as one PR review. Comments you make manually or internal commits don't count — you're only billed for audit work the product performs.",
  },
  {
    q: "What happens after my free audit?",
    a: "You'll see the full findings list and two free PR reviews. Everything stays connected — after that, plans simply control how many reviews and audits you can run per month.",
  },
  {
    q: "How does the GitHub OAuth scope work?",
    a: "We request read access to the repos you select and write access limited to creating pull requests. You can revoke access from GitHub at any time, and we never push directly to your default branch.",
  },
  {
    q: "Does AuditPilot work with private repositories?",
    a: "Yes. All plans support private repos. Your code is scanned in an isolated environment, is never stored after the run, and is never used to train models.",
  },
  {
    q: "Can I cancel or change plans anytime?",
    a: "Absolutely — upgrade, downgrade, or cancel from the dashboard. Changes apply at the start of your next billing cycle, and unused product limits reset monthly.",
  },
  {
    q: "Do you support open-source projects?",
    a: "Yes — public open-source repositories get extra free PR reviews on every plan. Contact us if your project has unusual scale and we'll set you up.",
  },
];

function FaqItem({ q, a, open, onToggle, index }: { q: string; a: string; open: boolean; onToggle: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: EASE }}
      className={`rounded-2xl border transition-colors duration-200 ${open ? "border-indigo-400/30 bg-slate-900/70" : "border-white/10 bg-slate-900/40 hover:border-white/20"}`}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-sm text-slate-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PricingFaq() {
  const [openId, setOpenId] = useState<number | null>(0);
  return (
    <section id="faq" className="relative scroll-mt-24 py-20 lg:py-28 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE }}
            className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
          >
            Billing <span className="text-gradient-dark">questions, answered.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
            className="text-slate-400"
          >
            The small print, in plain language.
          </motion.p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.q}
              q={item.q}
              a={item.a}
              index={i}
              open={openId === i}
              onToggle={() => setOpenId((prev) => (prev === i ? null : i))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
