import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { CheckCircle2, Github, ArrowRight, Shield, Zap, Eye, GitPullRequest, SearchCheck, Star, Quote } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuthStatus } from "@/hooks/use-repos";
import Navbar from "@/components/layout/Navbar";
import Head from "@/components/seo/Head";
import { APP_NAME } from "@/lib/constants";
import Hero3D from "@/components/Hero3D";
import ProductDemo from "@/components/ProductDemo";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Landing() {
  const { data: authStatus, isLoading } = useAuthStatus();
  const [, setLocation] = useLocation();
  const reducedMotion = useReducedMotion();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": APP_NAME,
    "operatingSystem": "Web",
    "applicationCategory": "DeveloperApplication",
    "description": "Automated AI-powered audits for web application security, performance, and accessibility.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  useEffect(() => {
    // Check localStorage for immediate redirect to avoid flicker
    const isAuthenticated = localStorage.getItem("authenticated") === "true";
    if (isAuthenticated) {
      setLocation("/app");
      return;
    }

    if (!isLoading && authStatus?.authenticated) {
      setLocation("/app");
    }
  }, [authStatus, isLoading, setLocation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      <Head />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />

      {/* ------------------------------------------------ Hero: 50 / 50 split */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-24">
        {/* backdrop: blueprint grid + aurora orbs */}
        <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[130px]" aria-hidden="true" />
        <div className="pointer-events-none absolute top-48 right-[-6rem] h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-[-6rem] h-72 w-72 rounded-full bg-violet-600/10 blur-[110px]" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">

            {/* ---------------------------------------------------- copy + CTAs */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-8 border border-white/10 backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
                </span>
                v2.0 Now Available
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
                className="text-5xl sm:text-6xl lg:text-[4.4rem] font-bold tracking-tight text-white mb-6 leading-[1.05]"
              >
                Audit and fix your web app{" "}
                <span className="text-gradient-dark">automatically.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
                className="text-lg sm:text-xl text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Security, performance &amp; accessibility — fixed via GitHub pull
                requests. Stop writing reports, start shipping fixes.
              </motion.p>

              {/* dual CTAs — primary is glassmorphic with an animated glow ring */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
              >
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="glow-ring group relative h-14 rounded-full px-8 text-base font-semibold text-white bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_8px_40px_-8px_rgba(99,102,241,0.45)] transition-[transform,background-color] duration-150 ease-out hover:scale-[1.03] hover:bg-white/15 active:scale-[0.97]"
                  >
                    <Github className="mr-2 h-5 w-5" />
                    Connect GitHub
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-full px-8 text-base font-semibold border-white/15 bg-white/5 text-slate-200 backdrop-blur-md transition-[background-color,border-color,transform] duration-150 ease-out hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:translate-y-0"
                  >
                    See how it works
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-slate-500"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Free audit for early users — no credit card required
                </span>
                <motion.a
                  href="#demo"
                  whileHover={{ x: 2 }}
                  className="group font-semibold text-slate-400 hover:text-cyan-300 transition-colors duration-150"
                >
                  ▸ Try the live demo first
                </motion.a>
              </motion.p>
            </div>

            {/* --------------------------------------------------- 3D showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
              className="relative"
            >
              {/* soft glow beneath the stage */}
              <div className="absolute bottom-6 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-[100%] bg-indigo-500/20 blur-3xl" aria-hidden="true" />
              <Hero3D />

              {/* floating glass telemetry chips */}
              {!reducedMotion && (
                <>
                  <motion.div
                    animate={{ y: [0, -9, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute right-2 top-10 hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-xs font-medium text-slate-200 backdrop-blur-xl shadow-lg shadow-black/30"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
                      <GitPullRequest className="h-3.5 w-3.5" />
                    </span>
                    128 fixes merged via PR
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                    className="absolute left-0 bottom-16 hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-xs font-medium text-slate-200 backdrop-blur-xl shadow-lg shadow-black/30"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-400/15 text-indigo-300">
                      <SearchCheck className="h-3.5 w-3.5" />
                    </span>
                    AI audit complete — 0 criticals
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------- Interactive live demo */}
      <ProductDemo />

      {/* ----------------------------------------------------- Features grid */}
      <section id="features" className="relative py-24 border-t border-white/5 bg-slate-950">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-indigo-300" />}
              title="Security Audits"
              description="Automatically detect and fix common vulnerabilities like XSS, CSRF, and outdated dependencies."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5 text-cyan-300" />}
              title="Performance Tuning"
              description="Optimize Core Web Vitals, image loading, and bundle sizes with one-click PRs."
            />
            <FeatureCard
              icon={<Eye className="h-5 w-5 text-violet-300" />}
              title="Accessibility"
              description="Ensure your app meets WCAG 2.1 standards with automated ARIA and semantic fixes."
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Social proof */}
      <section className="relative py-24 lg:py-32 border-t border-white/5">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* animated stats band */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 lg:mb-20">
            {[
              { value: 12400, suffix: "+", label: "issues fixed via auto-PRs" },
              { value: 310, suffix: "", label: "repos audited every week" },
              { value: 8.4, suffix: "s", label: "median time to full audit", decimals: 1 },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
                className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-8 text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gradient-dark mb-2 tabular-nums">
                  <CountUp value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* testimonial header */}
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md mb-6"
            >
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              Wall of love
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
              className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4"
            >
              Teams ship fixes <span className="text-gradient-dark">on autopilot.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
              className="text-lg text-slate-400 max-w-xl mx-auto"
            >
              The people who stopped writing audit spreadsheets and started merging PRs.
            </motion.p>
          </div>

          {/* testimonial cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "It found a stored XSS we'd missed in two pen tests — and the fix PR was open before I finished my coffee. Merge, done.",
                name: "Maya Okafor",
                role: "Staff Engineer · Fintech",
                initials: "MO",
                tint: "from-indigo-500/40 to-violet-500/40",
              },
              {
                quote: "LCP went from 2.9s to 1.4s in one sprint. The AI explains each change, so nobody has to guess what the bot touched.",
                name: "Daniel Reyes",
                role: "Frontend Lead · Commerce",
                initials: "DR",
                tint: "from-cyan-500/40 to-sky-500/40",
              },
              {
                quote: "We run it across 23 client projects. White-label reports alone sold the retainer renewals for us.",
                name: "Priya Shah",
                role: "CTO · Digital agency",
                initials: "PS",
                tint: "from-violet-500/40 to-fuchsia-500/40",
              },
            ].map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.09, ease: EASE }}
                className="relative rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl shadow-black/30 transition-[border-color,transform] duration-300 ease-out hover:-translate-y-1 hover:border-indigo-400/25"
              >
                <Quote className="absolute top-6 right-6 h-6 w-6 text-white/5" aria-hidden="true" />
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-300 text-amber-300" />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-300 leading-relaxed mb-7">“{t.quote}”</blockquote>
                <figcaption className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${t.tint}`}>
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{t.name}</span>
                    <span className="block text-xs text-slate-500">{t.role}</span>
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm font-medium">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AuditPilot Logo" className="w-8 h-8 rounded object-contain" />
            <span>© 2024 AuditPilot Inc.</span>
          </div>
          <div className="flex gap-8">
            <Link href="/" className="hover:text-indigo-300 transition-colors">Home</Link>
            <Link href="/how-it-works" className="hover:text-indigo-300 transition-colors">How it Works</Link>
            <Link href="/pricing" className="hover:text-indigo-300 transition-colors">Pricing</Link>
            <a href="#demo" className="hover:text-indigo-300 transition-colors">Live demo</a>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-300 transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: EASE }}
      className="group p-8 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-xl shadow-black/30 transition-[border-color,box-shadow,transform] duration-300 ease-out hover:border-indigo-400/30 hover:shadow-[0_20px_60px_-20px_rgba(99,102,241,0.35)] hover:-translate-y-1"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10 flex items-center justify-center mb-6 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2.5">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

/** Count-up number that resolves when scrolled into view (respects reduced motion). */
function CountUp({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const duration = 1400;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reducedMotion]);

  const text = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
  return <span ref={ref}>{text}{suffix}</span>;
}
