import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Sparkles, Github } from "lucide-react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Head from "@/components/seo/Head";
import { API_BASE } from "@/lib/api-service";
import { PlanFinder, ComparisonTable, PricingFaq } from "@/components/PricingExtras";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      const response = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toLowerCase() }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      <Head
        title="Pricing - AuditPilot"
        description="Choose the perfect plan for your team's code health and security needs. Start with a free audit today."
      />
      <Navbar />

      <div className="relative pt-32 pb-24 lg:pt-40">
        {/* backdrop */}
        <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[130px]" aria-hidden="true" />
        <div className="pointer-events-none absolute top-64 left-[-8rem] h-72 w-72 rounded-full bg-violet-600/10 blur-[110px]" aria-hidden="true" />
        <div className="pointer-events-none absolute top-72 right-[-6rem] h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px]" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Simple, transparent pricing
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6"
          >
            Pick your <span className="text-gradient-dark">flight plan.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
            className="text-lg sm:text-xl text-slate-400 mb-16 max-w-2xl mx-auto"
          >
            Choose the plan that's right for your team. All plans include our
            core security and performance auditing features.
          </motion.p>

          <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto items-start pb-10 scroll-mt-24">
            {/* Starter */}
            <PricingCard
              name="Starter"
              tagline="Taxi & takeoff"
              price="Free"
              description="Perfect for solo developers and side projects."
              features={[
                "2 PR reviews only",
                "5 run audits only",
                "Basic AI Audit",
                "Community support",
                "Weekly automated audits",
              ]}
              buttonText="Current Plan"
              onClick={() => {}}
              disabled={true}
            />

            {/* Pro — elevated + animated glow border */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
              className="relative z-10 md:-translate-y-6 md:scale-[1.03]"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-2xl pointer-events-none" aria-hidden="true" />
              <PricingCard
                featured
                name="Pro"
                tagline="Cruise altitude"
                price="$149"
                description="For growing startups and serious teams."
                features={[
                  "100 PR reviews",
                  "100 run audits",
                  "Unlimited Repositories",
                  "Advanced AI Insights",
                  "Priority Support",
                  "Real-time PR Audits",
                  "Custom Fix Suggestions",
                ]}
                buttonText="Upgrade to Pro"
                loading={loadingPlan === 'Pro'}
                onClick={() => handleUpgrade('pro')}
              />
            </motion.div>

            {/* Agency */}
            <PricingCard
              name="Agency"
              tagline="Full fleet"
              price="Custom"
              description="For agencies managing multiple client projects."
              features={[
                "Unlimited PR reviews",
                "Unlimited run audits",
                "White-label reports",
                "Dedicated success manager",
                "Custom rules engine",
                "Enterprise Security",
              ]}
              buttonText="Contact Sales"
              loading={loadingPlan === 'Agency'}
              onClick={() => handleUpgrade('agency')}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-14 text-center"
          >
            <p className="text-slate-500 text-sm mb-4">No credit card required for initial audit</p>
            <Link href="/auth">
              <Button
                variant="link"
                className="text-indigo-300 hover:text-indigo-200 text-lg transition-colors"
              >
                Start your free audit now &rarr;
              </Button>
            </Link>
            <p className="mt-8">
              <a
                href="#planner"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-[background-color,color] duration-150 ease-out hover:bg-white/10 hover:text-white"
              >
                <Sparkles className="h-4 w-4 text-violet-300" />
                Not sure? Slide your usage and we'll pick your tier
              </a>
            </p>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------- Usage planner */}
      <PlanFinder />

      {/* ------------------------------------------------- Feature matrix */}
      <ComparisonTable />

      {/* ------------------------------------------------- FAQ */}
      <PricingFaq />

      {/* footer */}
      <footer className="relative py-12 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm font-medium">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AuditPilot Logo" className="w-8 h-8 rounded object-contain" />
            <span>© 2024 AuditPilot Inc.</span>
          </div>
          <div className="flex gap-8">
            <Link href="/" className="hover:text-indigo-300 transition-colors">Home</Link>
            <Link href="/how-it-works" className="hover:text-indigo-300 transition-colors">How it Works</Link>
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

/**
 * Pointer-driven 3D tilt (vanilla CSS perspective — no extra dependency).
 * CSS vars are written straight to the DOM node so pointer-moves cause zero
 * React re-renders; a 160ms ease-out transform smooths the tracking.
 */
function PricingCard({
  name,
  tagline,
  price,
  description,
  features,
  featured = false,
  buttonText,
  onClick,
  loading,
  disabled,
}: {
  name: string;
  tagline?: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
  buttonText: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const setTilt = (e: ReactPointerEvent<HTMLDivElement>, gx: number, gy: number, rx: number, ry: number, s: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--gx", `${gx * 100}%`);
    el.style.setProperty("--gy", `${gy * 100}%`);
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--s", `${s}`);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || (e.pointerType !== "mouse" && e.pointerType !== "pen")) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt(e, px, py, (0.5 - py) * 8, (px - 0.5) * 8, 1.02);
  };

  const onEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || (e.pointerType !== "mouse" && e.pointerType !== "pen")) return;
    const el = ref.current;
    if (el) el.style.setProperty("--s", "1.02");
  };

  const onLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    setTilt(e, 0.5, 0.5, 0, 0, 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="h-full"
    >
      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        className={`tilt group relative flex h-full flex-col rounded-3xl p-8 ${
          featured
            ? "glow-ring border border-indigo-400/30 bg-gradient-to-b from-indigo-500/10 via-slate-900/70 to-slate-900/80 shadow-[0_30px_80px_-20px_rgba(99,102,241,0.45)]"
            : "border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-black/40 transition-[border-color] duration-300 hover:border-indigo-400/25"
        }`}
      >
        {/* cursor glare */}
        <div className="tilt-glare pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />

        {featured && (
          <>
            <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-600/40">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>
          </>
        )}

        <div className="relative z-[2] mb-7">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            {name}
            {tagline && <span className="text-xs font-medium text-slate-500">· {tagline}</span>}
          </h3>
          <div className="flex items-baseline gap-1 mt-3">
            <span className={`text-5xl font-bold tracking-tight ${featured ? "text-gradient-dark" : "text-white"}`}>
              {price}
            </span>
            {price !== 'Custom' && price !== 'Free' && <span className="text-slate-500">/month</span>}
          </div>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed">{description}</p>
        </div>

        <ul className="relative z-[2] space-y-4 mb-8 text-left flex-1">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <AnimatedCheck delay={0.25 + i * 0.08} featured={featured} />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          onClick={onClick}
          disabled={disabled || loading}
          className={`relative z-[2] w-full h-12 rounded-xl font-semibold transition-[transform,box-shadow,background-color] duration-150 ease-out active:scale-[0.98] ${
            featured
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 hover:shadow-indigo-500/60 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.015]"
              : disabled
                ? "bg-white/5 text-slate-500 border border-white/10 cursor-default"
                : "bg-white/10 border border-white/15 text-white hover:bg-white/15 hover:scale-[1.015]"
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : buttonText || 'Get Started'}
        </Button>
      </div>
    </motion.div>
  );
}

/** Feature check that draws itself in when scrolled into view. */
function AnimatedCheck({ delay, featured }: { delay: number; featured: boolean }) {
  const color = featured ? "text-cyan-300" : "text-indigo-400";
  return (
    <motion.svg
      viewBox="0 0 20 20"
      className={`h-5 w-5 shrink-0 ${color}`}
      fill="none"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      aria-hidden="true"
    >
      <motion.circle
        cx="10"
        cy="10"
        r="8.5"
        strokeWidth="1.4"
        className="stroke-current"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 0.38,
            transition: { duration: 0.5, delay, ease: "easeOut" },
          },
        }}
      />
      <motion.path
        d="M5.8 10.4 L9 13.4 L14.2 6.9"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-current"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 0.4, delay: delay + 0.16, ease: "easeOut" } },
        }}
      />
    </motion.svg>
  );
}
