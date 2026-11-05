import { useRef } from "react";
import { motion, useScroll, useReducedMotion } from "framer-motion";
import {
  Github,
  Shield,
  Zap,
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
  Lock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Head from "@/components/seo/Head";
import WalkthroughTabs, { AuditCoverage } from "@/components/WalkthroughTabs";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const steps = [
  {
    icon: Github,
    accent: "text-indigo-300",
    chip: "from-indigo-500/30 via-indigo-400/15 to-slate-900/10",
    ring: "border-indigo-400/40",
    pulse: "ring-indigo-400/40",
    title: "Connect GitHub",
    description:
      "Securely authorize AuditPilot to access your repositories via GitHub OAuth. We only request the permissions needed to scan and create PRs.",
    details: ["One-click integration", "Secure OAuth 2.0", "Repository selection control"],
  },
  {
    icon: Search,
    accent: "text-cyan-300",
    chip: "from-cyan-500/30 via-cyan-400/15 to-slate-900/10",
    ring: "border-cyan-400/40",
    pulse: "ring-cyan-400/40",
    title: "Run AI Audit",
    description:
      "Our advanced AI engine scans your codebase for security vulnerabilities, performance bottlenecks, and accessibility issues.",
    details: ["Comprehensive security scan", "Core Web Vitals check", "Accessibility audit (WCAG 2.1)"],
  },
  {
    icon: Zap,
    accent: "text-violet-300",
    chip: "from-violet-500/30 via-violet-400/15 to-slate-900/10",
    ring: "border-violet-400/40",
    pulse: "ring-violet-400/40",
    title: "Review AI Fixes",
    description:
      "AuditPilot doesn't just find problems—it generates precise code fixes. Review the 'before' and 'after' code snippets in seconds.",
    details: ["Intelligent code generation", "Side-by-side diff view", "Context-aware corrections"],
  },
  {
    icon: GitPullRequest,
    accent: "text-indigo-300",
    chip: "from-indigo-500/30 via-cyan-400/15 to-slate-900/10",
    ring: "border-indigo-400/40",
    pulse: "ring-indigo-400/40",
    title: "Push Auto-Fixes",
    description:
      "Satisfied with the suggestions? Push them directly to your repository as a new Pull Request with one click.",
    details: ["Automatic branch creation", "Detailed PR descriptions", "Clean commits"],
  },
  {
    icon: CheckCircle2,
    accent: "text-emerald-300",
    chip: "from-emerald-500/30 via-teal-400/15 to-slate-900/10",
    ring: "border-emerald-400/40",
    pulse: "ring-emerald-400/40",
    title: "Merge & Improve",
    description:
      "Review the PR on GitHub, run your tests, and merge. Your code is now more secure, faster, and more accessible.",
    details: ["Permanent code health boost", "Automatic branch cleanup", "CI/CD compatibility"],
  },
];

export default function HowItWorks() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // The rail "fills" with progress as the user scrolls through the steps.
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 78%", "end 60%"],
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      <Head
        title="How it Works - AuditPilot"
        description="Stop writing security reports and start shipping fixes. Learn how AuditPilot automates the entire code health journey."
      />
      <Navbar />

      <main className="relative pt-32 pb-20 lg:pt-40">
        {/* backdrop */}
        <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[130px]" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* header */}
          <div className="text-center mb-24 lg:mb-32">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md mb-8"
            >
              <Shield className="h-3.5 w-3.5 text-indigo-300" />
              Five steps, zero friction
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
            >
              How it <span className="text-gradient-dark">Works</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto"
            >
              Stop writing security reports and start shipping fixes. AuditPilot
              automates the entire code health journey.
            </motion.p>
          </div>

          {/* -------------------------------------------------- timeline rail */}
          <div ref={timelineRef} className="relative">
            {/* base tracks — mobile rail / desktop centre */}
            <div className="absolute left-7 top-0 bottom-0 w-px bg-white/10 lg:hidden" aria-hidden="true" />
            <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-px bg-white/10 hidden lg:block" aria-hidden="true" />
            {/* scroll-filled glow */}
            <motion.div
              aria-hidden="true"
              className="absolute left-7 top-0 bottom-0 w-px origin-top bg-gradient-to-b from-indigo-400 via-violet-400 to-cyan-300 shadow-[0_0_18px_rgba(129,140,248,0.7)] lg:hidden"
              style={{ scaleY: reducedMotion ? 0 : scrollYProgress }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-px origin-top bg-gradient-to-b from-indigo-400 via-violet-400 to-cyan-300 shadow-[0_0_18px_rgba(129,140,248,0.7)] hidden lg:block"
              style={{ scaleY: reducedMotion ? 0 : scrollYProgress }}
            />

            {/* steps */}
            <div className="space-y-20 lg:space-y-36">
              {steps.map((step, idx) => {
                const even = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    className="relative grid grid-cols-[3.5rem_1fr] gap-x-3 lg:gap-x-0 lg:grid-cols-[1fr_10rem_1fr] lg:items-center"
                  >
                    {/* node marker on the rail */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="z-10 mt-8 justify-self-center lg:col-start-2 lg:row-start-1 lg:mt-0 lg:place-self-center"
                    >
                      <span className={`relative grid h-8 w-8 place-items-center rounded-full bg-slate-950 border-2 ${step.ring}`}>
                        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-300 to-cyan-300`} />
                        {!reducedMotion && <span className={`absolute inset-0 rounded-full animate-ping ${step.pulse}`} />}
                      </span>
                    </motion.div>

                    {/* glass card */}
                    <motion.article
                      initial={{ opacity: 0, x: even ? -40 : 40, y: 24, rotateX: 0 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.65, ease: EASE }}
                      style={{ transformPerspective: 1000 }}
                      className={`group relative col-start-2 row-start-1 w-full rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-black/40 transition-[border-color,box-shadow] duration-300 ease-out hover:border-indigo-400/30 hover:shadow-[0_24px_70px_-24px_rgba(99,102,241,0.4)] lg:w-auto ${
                        even ? "lg:col-start-1" : "lg:col-start-3"
                      }`}
                    >
                      {/* ghost numeral */}
                      <span className="pointer-events-none absolute -top-2 right-6 select-none bg-gradient-to-b from-white/10 to-transparent bg-clip-text text-7xl font-black text-transparent">
                        0{idx + 1}
                      </span>

                      <h3 className="text-2xl font-bold text-white mb-4">
                        <span className={`mr-3 font-mono text-sm font-semibold align-middle ${step.accent}`}>
                          0{idx + 1}
                        </span>
                        {step.title}
                      </h3>
                      <p className="text-slate-400 mb-8 leading-relaxed">{step.description}</p>
                      <ul className="space-y-3 pt-6 border-t border-white/10">
                        {step.details.map((detail, dIdx) => (
                          <li key={dIdx} className="flex items-center gap-3 text-sm text-slate-300">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${step.accent}`} />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </motion.article>

                    {/* 3D floating icon chip (desktop) */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                      className={`hidden lg:flex justify-center ${
                        even ? "lg:col-start-3" : "lg:col-start-1"
                      } lg:row-start-1`}
                    >
                      <div style={{ perspective: "900px" }}>
                        {!reducedMotion ? (
                          <motion.div
                            animate={{ y: [0, -10, 0], rotateX: [16, 12, 16], rotateY: [even ? -22 : 22, even ? -16 : 16, even ? -22 : 22] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 }}
                            style={{ transformStyle: "preserve-3d" }}
                            className={`relative grid h-44 w-44 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br shadow-2xl shadow-indigo-500/20 ${step.chip}`}
                          >
                            {/* extruded depth layers */}
                            <span className="absolute inset-0 rounded-3xl border border-white/5 bg-slate-900/40" style={{ transform: "translateZ(-18px)" }} />
                            <span className="absolute inset-2 rounded-2xl border border-white/5 bg-slate-950/60" style={{ transform: "translateZ(-34px)" }} />
                            <step.icon className={`h-14 w-14 ${step.accent}`} style={{ transform: "translateZ(24px)" }} strokeWidth={1.6} />
                            {/* orbiting spark */}
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0"
                              style={{ transform: "translateZ(10px)" }}
                            >
                              <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                            </motion.span>
                          </motion.div>
                        ) : (
                          <div
                            className={`grid h-44 w-44 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br ${step.chip}`}
                            style={{ transform: "rotateX(16deg) rotateY(-20deg)" }}
                          >
                            <step.icon className={`h-14 w-14 ${step.accent}`} strokeWidth={1.6} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------ interactive walkthrough */}
          <WalkthroughTabs />
          <AuditCoverage />

          {/* ------------------------------------------------------ bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative mt-28 lg:mt-40 p-10 lg:p-16 rounded-[2.5rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl text-center overflow-hidden shadow-2xl shadow-indigo-500/10"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[560px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[100px]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-32 right-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-[90px]" aria-hidden="true" />
            <span className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" aria-hidden="true" />

            <h2 className="relative z-10 text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to secure your <span className="text-gradient-dark">codebase?</span>
            </h2>
            <p className="relative z-10 text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join hundreds of developers using AuditPilot to automate their
              security and performance maintenance.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth">
                <Button
                  size="lg"
                  className="group h-14 px-10 text-lg rounded-full bg-white text-slate-950 font-bold shadow-[0_10px_44px_-10px_rgba(255,255,255,0.35)] transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_14px_50px_-10px_rgba(255,255,255,0.5)]"
                >
                  <Github className="mr-3 h-6 w-6" />
                  Start Your First Audit
                </Button>
              </Link>
              <Link
                href="/pricing"
                className="text-slate-200 hover:text-white font-semibold flex items-center gap-2 h-14 px-6 border border-white/15 rounded-full backdrop-blur-md transition-colors duration-150 ease-out hover:bg-white/5"
              >
                See Pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative z-10 mt-8 flex items-center justify-center gap-8 text-xs text-white/40 uppercase tracking-widest font-bold">
              <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Secure OAuth</span>
              <span className="flex items-center gap-2"><Shield className="w-3 h-3" /> Private Repo Support</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* footer */}
      <footer className="relative py-12 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm font-medium">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AuditPilot Logo" className="w-8 h-8 rounded object-contain" />
            <span>© 2024 AuditPilot Inc.</span>
          </div>
          <div className="flex gap-8">
            <Link href="/" className="hover:text-indigo-300 transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-indigo-300 transition-colors">Pricing</Link>
            <a href="#" className="hover:text-indigo-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-300 transition-colors">Terms of Service</a>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-white/10 hover:text-white"><Github className="w-5 h-5" /></Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
