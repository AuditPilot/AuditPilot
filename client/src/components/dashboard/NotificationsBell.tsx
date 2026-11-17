import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Header notification bell (M8). Renders nothing while logged out; polls the
 * personal inbox every 30s via useNotifications and supports mark-read /
 * mark-all-read. Clicking a notification navigates to its workspace when
 * one is attached.
 */
export function NotificationsBell() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (isLoading || !data) return null;

  const unread = data.unreadCount;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Notifications</span>
            {unread > 0 && (
              <Button size="sm" variant="ghost" disabled={markAll.isPending}
                onClick={() => markAll.mutate()}
                className="h-6 px-2 text-[10px] text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10">
                <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">You're all caught up.</p>
            ) : (
              data.notifications.map(n => (
                <button
                  key={n.id}
                  disabled={n.read || markRead.isPending}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id);
                    if (n.workspaceId) {
                      setOpen(false);
                      window.location.assign(`/app/workspaces/${n.workspaceId}`);
                    }
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/[0.04]",
                    !n.read && "bg-indigo-500/[0.06]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-xs text-slate-200", !n.read && "font-semibold")}>{n.title}</p>
                    {!n.read && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                  </div>
                  {n.body && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
