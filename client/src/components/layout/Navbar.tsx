import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Github } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <img src="/logo.png" alt="AuditPilot Logo" className="w-9 h-9 rounded-lg object-contain" />
              <span className="font-bold text-lg tracking-tight text-white transition-colors hover:text-indigo-300">
                AuditPilot
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              How it Works
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth">
              <span className="hidden md:block text-sm font-medium text-slate-400 hover:text-white cursor-pointer transition-colors">
                Log in
              </span>
            </Link>
            <Link href="/auth">
              <Button
                size="sm"
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-full px-5 backdrop-blur-md transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Github className="w-4 h-4 mr-2" />
                Connect GitHub
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* hairline aurora under the bar */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
    </nav>
  );
}
