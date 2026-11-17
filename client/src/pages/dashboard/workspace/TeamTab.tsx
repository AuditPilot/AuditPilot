import { useState } from "react";
import {
  Loader2, Mail, Trash2, UserMinus, Shield, Activity, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  useWorkspace, useWorkspaceMembers, useWorkspaceInvites,
  useCreateInvite, useRevokeInvite, useChangeMemberRole, useRemoveMember, useWorkspaceActivity,
} from "@/hooks/use-workspaces";
import { useAuthStatus } from "@/hooks/use-repos";
import { type WorkspaceInviteRow, type ActivityEntry } from "@/lib/api-service";
import { timeAgo } from "./shared";

const ASSIGNABLE_ROLES = ["admin", "developer", "viewer"] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const ROLE_CHIP: Record<string, string> = {
  owner: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  admin: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  developer: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  viewer: "bg-slate-500/10 text-slate-300 border-slate-500/20",
};

function activityText(entry: ActivityEntry): string {
  const who = entry.actor?.username ?? "someone";
  switch (entry.action) {
    case "member.added":
      return `${who} added a member${entry.meta.role ? ` as ${entry.meta.role}` : ""}`;
    case "member.role_changed":
      return `${who} changed a member's role${entry.meta.role ? ` to ${entry.meta.role}` : ""}`;
    case "member.removed":
      return `${who} removed a member`;
    case "member.joined":
    case "member.rejoined":
      return `${who} ${entry.action === "member.joined" ? "joined" : "rejoined"} the workspace${entry.meta.role ? ` as ${entry.meta.role}` : ""}`;
    case "invite.created":
      return `${who} invited ${entry.meta.email ?? "someone"} as ${entry.meta.role ?? "member"}`;
    case "invite.revoked":
      return `${who} revoked an invitation`;
    case "finding.assigned":
      return `${who} assigned a finding${entry.meta.assignee ? ` to ${entry.meta.assignee}` : ""}`;
    case "finding.unassigned":
      return `${who} cleared a finding assignment`;
    case "audit.completed":
      return `Audit completed on ${entry.meta.repository ?? "a repository"}${entry.meta.branch ? ` (${entry.meta.branch})` : ""}${typeof entry.meta.created === "number" ? ` — ${entry.meta.created} new, ${entry.meta.reopened ?? 0} reopened` : ""}`;
    case "fix.pr_linked":
      return `Fix PR #${entry.meta.prNumber ?? ""} linked${typeof entry.meta.findingsLinked === "number" ? ` to ${entry.meta.findingsLinked} finding(s)` : ""}`;
    default:
      return `${who} · ${entry.action}`;
  }
}

/**
 * Team tab (M8): members with role management, pending invitations, and the
 * workspace activity feed. Admin-only controls degrade gracefully by role.
 */
export function WorkspaceTeamTab({ wsId }: { wsId: string }) {
  const { data: workspace } = useWorkspace(wsId);
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(wsId);
  const { data: invites, isLoading: invitesLoading } = useWorkspaceInvites(wsId);
  const [activityPage, setActivityPage] = useState(1);
  const { data: activity, isLoading: activityLoading } = useWorkspaceActivity(wsId, activityPage);
  const { data: authStatus } = useAuthStatus();

  const isAdmin = workspace?.role === "owner" || workspace?.role === "admin";
  const selfUserId = (authStatus?.user as unknown as { _id?: string } | undefined)?._id;

  const changeRole = useChangeMemberRole(wsId);
  const removeMember = useRemoveMember(wsId);
  const createInvite = useCreateInvite(wsId);
  const revokeInvite = useRevokeInvite(wsId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AssignableRole>("developer");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const submitInvite = () => {
    createInvite.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: (data) => {
          setInviteOpen(false);
          setInviteEmail("");
          setCopiedUrl(`${window.location.origin}${data.inviteUrl}`);
        },
      },
    );
  };

  const pendingInvites = (invites ?? []).filter(i => i.status === "pending");

  return (
    <div className="space-y-8">
      {/* ── Members ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Members</h3>
          {isAdmin && (
            <Button size="sm" onClick={() => setInviteOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white">
              <Mail className="w-4 h-4 mr-1.5" /> Invite people
            </Button>
          )}
        </div>
        {copiedUrl && (
          <Card className="p-3 mb-3 border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-200 flex items-center gap-2">
            <span className="truncate flex-1 font-mono">{copiedUrl}</span>
            <Button size="sm" variant="outline" className="shrink-0 h-7 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
              onClick={() => { void navigator.clipboard?.writeText(copiedUrl); setCopiedUrl(null); }}>
              Copy &amp; close
            </Button>
          </Card>
        )}
        {membersLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Member</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Joined</th>
                  {isAdmin && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(members ?? []).map(m => {
                  const isSelf = m.userId === selfUserId;
                  const isOwner = m.role === "owner";
                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold">
                              {(m.username ?? "?")[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-slate-100 font-medium">{m.username ?? "Unknown"}</div>
                            {isSelf && <div className="text-[10px] text-slate-500">you</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_CHIP[m.role] ?? ROLE_CHIP.viewer}`}>
                          {m.role}
                        </span>
                        {m.status !== "active" && (
                          <span className="ml-2 text-[10px] text-amber-400">{m.status}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-xs text-slate-500">
                        {m.joinedAt ? timeAgo(m.joinedAt) : "—"}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isOwner && (
                              <select
                                value={m.role}
                                disabled={changeRole.isPending}
                                onChange={e => changeRole.mutate({ userId: m.userId, role: e.target.value })}
                                className="bg-slate-900 border border-white/10 rounded-md text-xs text-slate-200 px-2 py-1.5 focus:outline-none focus:border-indigo-400/50"
                              >
                                {ASSIGNABLE_ROLES.map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            )}
                            {!isOwner && !isSelf && (
                              <Button
                                size="sm" variant="ghost"
                                disabled={removeMember.isPending}
                                onClick={() => removeMember.mutate(m.userId)}
                                title="Remove from workspace"
                                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Pending invites (admin only) ────────────────────────────── */}
      {isAdmin && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-3">Pending invitations</h3>
          {invitesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : pendingInvites.length === 0 ? (
            <Card className="p-6 text-center border-dashed text-sm text-slate-500">
              No open invitations. Invite a teammate with the button above.
            </Card>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 font-semibold">Role</th>
                    <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Expires</th>
                    <th className="text-right px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingInvites.map((inv: WorkspaceInviteRow) => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 text-slate-200">{inv.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_CHIP[inv.role] ?? ROLE_CHIP.viewer}`}>
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-xs text-slate-500">{timeAgo(inv.expiresAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="ghost" disabled={revokeInvite.isPending}
                          onClick={() => revokeInvite.mutate(inv.id)}
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Activity feed ───────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" /> Recent activity
        </h3>
        {activityLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ) : (activity?.activity.length ?? 0) === 0 ? (
          <Card className="p-6 text-center border-dashed text-sm text-slate-500">
            Nothing has happened in this workspace yet.
          </Card>
        ) : (
          <>
            <div className="space-y-1">
              {activity!.activity.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <Shield className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300 flex-1">{activityText(entry)}</p>
                  <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(entry.createdAt)}</span>
                </div>
              ))}
            </div>
            {activity!.hasNext && (
              <button
                onClick={() => setActivityPage(p => p + 1)}
                className="mt-3 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Show more <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </section>

      {/* ── Invite dialog ───────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              Create a one-week invitation link. The recipient must sign in with the invited email address to redeem it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email address</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="bg-slate-950 border-white/10 text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as AssignableRole)}
                className="w-full bg-slate-950 border border-white/10 rounded-md text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-400/50"
              >
                {ASSIGNABLE_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Admins manage repositories and teammates · Developers assign findings and run actions · Viewers read only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={submitInvite}
              disabled={createInvite.isPending || inviteEmail.trim().length < 3}
              className="bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              {createInvite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
