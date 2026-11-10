import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Honest sync-state badge — mirrors Repository.syncState on the backend. */
export function SyncStateBadge({ state }: { state: string }) {
  const map: Record<string, { className: string; label: string }> = {
    active: { className: "bg-emerald-500/10 text-emerald-300 border-none", label: "active" },
    pending: { className: "bg-amber-500/10 text-amber-300 border-none", label: "pending" },
    error: { className: "bg-rose-500/10 text-rose-300 border-none", label: "error" },
    revoked: { className: "bg-slate-500/10 text-slate-400 border-none", label: "revoked" },
  };
  const item = map[state] ?? { className: "bg-slate-500/10 text-slate-400 border-none", label: state };
  return <Badge variant="secondary" className={cn("capitalize", item.className)}>{item.label}</Badge>;
}

export function PullStateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    open: "bg-emerald-500/10 text-emerald-300 border-none",
    merged: "bg-violet-500/10 text-violet-300 border-none",
    closed: "bg-slate-500/10 text-slate-400 border-none",
  };
  return (
    <Badge variant="secondary" className={cn("capitalize", map[state] ?? "bg-slate-500/10 text-slate-400 border-none")}>
      {state}
    </Badge>
  );
}

export function VisibilityBadge({ visibility }: { visibility: string }) {
  return (
    <Badge variant="secondary" className="capitalize bg-white/5 text-slate-400 border-none">
      {visibility}
    </Badge>
  );
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function Pager({
  page,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <div className="flex items-center justify-end gap-2 mt-6">
      <span className="text-xs text-slate-500 mr-2">Page {page}</span>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}
        className="border-white/10 text-slate-300 hover:bg-white/5">
        Prev
      </Button>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={onNext}
        className="border-white/10 text-slate-300 hover:bg-white/5">
        Next
      </Button>
    </div>
  );
}
