import { Button } from "@/components/ui/button";
import {
  Github,
  Gitlab,
  Loader2,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Eye,
  Lock,
  Sparkles,
  Star,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuthStatus } from "@/hooks/use-repos";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api-service";
import Head from "@/components/seo/Head";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Official Bitbucket mark (simple-icons) — lucide has no Bitbucket glyph. */
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
    </svg>
  );
}

/* --------------------------------------------------------------------------- */
/*  Connectors — GitHub is live via the real OAuth flow; the other Git hosts    */
/*  are visible so users know multi-host support is on the way.                 */
/* --------------------------------------------------------------------------- */

type Connector = {
  id: "github" | "gitlab" | "bitbucket";
  name: string;
  live: boolean;
  icon: React.ReactNode;
};

const CONNECTORS: Connector[] = [
  {
    id: "github",
    name: "GitHub",
    live: true,
    icon: <Github className="h-5 w-5" />,
  },
  {
    id: "gitlab",
    name: "GitLab",
    live: false,
    icon: <Gitlab className="h-5 w-5 text-[#fc6d26]" />,
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    live: false,
    icon: <BitbucketIcon className="h-5 w-5 text-[#2684ff]" />,
  },
];

const HOST_CHIPS = [
  { name: "GitHub", icon: <Github className="h-3.5 w-3.5 text-white" /> },
  { name: "GitLab", icon: <Gitlab className="h-3.5 w-3.5 text-[#fc6d26]" /> },
  { name: "Bitbucket", icon: <BitbucketIcon className="h-3.5 w-3.5 text-[#2684ff]" /> },
];

const PILLARS = [
  {
    icon: <ShieldCheck className="h-4 w-4 text-cyan-300" />,
    title: "Security",
    text: "XSS, CSRF, and dependency risks fixed before they merge.",
  },
  {
    icon: <Zap className="h-4 w-4 text-indigo-300" />,
    title: "Performance",
    text: "Core Web Vitals tuned on every push.",
  },
  {
    icon: <Eye className="h-4 w-4 text-violet-300" />,
    title: "Accessibility",
    text: "WCAG 2.1 issues found and remediated.",
  },
];

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: authStatus, isLoading: isAuthLoading } = useAuthStatus();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Immediate redirect based on localStorage
    if (localStorage.getItem("authenticated") === "true") {
      setLocation("/app");
      return;
    }

    if (!isAuthLoading && authStatus?.authenticated) {
      setLocation("/app");
    }
  }, [authStatus, isAuthLoading, setLocation]);

  const handleLogin = () => {
    setIsLoading(true);
    // Top-level navigation to the API origin (single-origin or split deploy)
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  const notifyComingSoon = (provider: string) => {
    toast({
      title: `${provider} connector is coming soon`,
      description:
        "GitHub sign-in is live today. GitLab and Bitbucket connectors ship next.",
      className:
        "rounded-xl border-white/10 bg-slate-900/90 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-lg [&_[data-toast-close]]:text-slate-400 [&_[data-toast-close]]:hover:text-white",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Head />

      {/* backdrop: grid + aurora blobs */}
      <div
        className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[130px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" aria-hidden="true" />

      {/* compact mobile header */}
      <div className="relative flex items-center justify-between px-6 pt-6 lg:hidden">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="AuditPilot logo" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-base font-bold text-white">AuditPilot</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-0">
        {/* ------------------------------------------------------- brand rail */}
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.7, ease: EASE }}
          className="hidden flex-col justify-center lg:flex"
        >
          <Link href="/" className="mb-8 flex w-fit items-center gap-3">
            <img src="/logo.png" alt="AuditPilot logo" className="h-10 w-10 rounded-lg object-contain" />
            <span className="text-lg font-bold text-white">AuditPilot</span>
          </Link>

          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Sign in to your workspace
          </span>
          <h1 className="mb-4 max-w-md text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight text-white">
            One sign-in.{" "}
            <span className="text-gradient-dark">Every repo, always healthy.</span>
          </h1>
          <p className="mb-7 max-w-md text-base leading-relaxed text-slate-400">
            Connect your Git host — AuditPilot audits every push and ships AI
            fixes as review-ready pull requests.
          </p>

          <ul className="mb-7 space-y-3">
            {PILLARS.map((p) => (
              <li key={p.title} className="flex max-w-md items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5">
                  {p.icon}
                </span>
                <span>
                  <span className="block font-semibold text-white">{p.title}</span>
                  <span className="block text-slate-400">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mb-7 w-fit">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-slate-600">
              Works with your host
            </span>
            <div className="flex items-center gap-2">
              {HOST_CHIPS.map((h) => (
                <span
                  key={h.name}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  {h.icon}
                  {h.name}
                </span>
              ))}
            </div>
          </div>

          <figure className="glass-dark-card max-w-md rounded-2xl border border-white/10 p-5">
            <div className="mb-2.5 flex gap-1">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              ))}
            </div>
            <blockquote className="mb-4 text-sm leading-normal text-slate-300">
              “It found a stored XSS we'd missed in two pen tests — and the fix
              PR was open before I finished my coffee. Merge, done.”
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 text-xs font-bold text-white">
                MO
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Maya Okafor</span>
                <span className="block text-xs text-slate-500">Staff Engineer · Fintech</span>
              </span>
            </figcaption>
          </figure>

          <p className="mt-6 font-mono text-[11px] text-slate-600">
            12,400+ fixes shipped · 310 repos audited weekly · 8.4s median audit
          </p>
        </motion.aside>

        {/* ------------------------------------------------------ connect card */}
        <motion.main
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : 0.12, ease: EASE }}
          className="mx-auto w-full max-w-md lg:justify-self-end"
        >
          <div className="glass-dark-card rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/40 sm:p-10">
            <div className="mx-auto mb-7 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-[0_0_44px_-10px_rgba(99,102,241,0.55)]">
              <img src="/logo.png" alt="AuditPilot logo" className="h-full w-full object-contain" />
            </div>

            <h2 className="text-center text-2xl font-bold tracking-tight text-white">
              Welcome to AuditPilot
            </h2>
            <p className="mt-2.5 text-center text-sm leading-relaxed text-slate-400">
              Connect the Git host you already use — your first AI-audited pull
              request lands in under a minute.
            </p>

            {/* connectors */}
            <div className="mt-8 space-y-3">
              {CONNECTORS.map((c) =>
                c.live ? (
                  <Button
                    key={c.id}
                    onClick={handleLogin}
                    disabled={isLoading}
                    size="lg"
                    className="group relative h-14 w-full rounded-xl bg-white text-base font-semibold text-slate-950 shadow-[0_10px_40px_-12px_rgba(255,255,255,0.4)] transition-[transform,box-shadow] duration-150 ease-out hover:scale-[1.02] hover:shadow-[0_14px_46px_-12px_rgba(255,255,255,0.55)] active:scale-[0.98] disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2.5 h-5 w-5 animate-spin text-slate-700" />
                    ) : (
                      c.icon
                    )}
                    {isLoading ? (
                      "Connecting to GitHub…"
                    ) : (
                      <>
                        Continue with GitHub
                        <ChevronRight className="ml-auto h-4 w-4 text-slate-500 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <button
                    key={c.id}
                    onClick={() => notifyComingSoon(c.name)}
                    className="group relative flex h-14 w-full items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-base font-semibold text-slate-200 backdrop-blur-md transition-[background-color,border-color,transform] duration-150 ease-out hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.99]"
                  >
                    {c.icon}
                    Continue with {c.name}
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      soon
                    </span>
                  </button>
                ),
              )}
            </div>

            {/* trust row */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400/80" />
                Read-only repos
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
                Revocable anytime
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-400/80" />
                Code never stored
              </span>
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
              By connecting a Git host, you agree to our{" "}
              <a href="#" className="underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-400">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-400">
                Privacy Policy
              </a>
              .
            </p>

            <div className="mt-6 flex items-center justify-center gap-5 border-t border-white/5 pt-5 text-xs">
              <Link href="/" className="flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-300">
                <ArrowLeft className="h-3 w-3" />
                Back to home
              </Link>
              <span className="h-3 w-px bg-white/10" aria-hidden="true" />
              <Link href="/how-it-works" className="flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-300">
                See how it works
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
