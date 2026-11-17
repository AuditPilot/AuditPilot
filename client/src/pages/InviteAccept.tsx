import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { Loader2, Mail, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStatus } from "@/hooks/use-repos";
import { api } from "@/lib/api-service";
import { API_BASE } from "@/lib/api-service";

/**
 * Public invitation redemption (M8). Anyone with the link can SEE the invite;
 * only an authenticated user whose account email matches can ACCEPT it.
 */
export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const [, setLocation] = useLocation();
  const { data: authStatus } = useAuthStatus();
  const [preview, setPreview] = useState<{ email: string; role: string; status: string; expiresAt: string } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<{ workspaceId: string; workspaceName: string | null; role: string } | null>(null);

  const loadPreview = async () => {
    try {
      const data = await api.getInvitePreview(token);
      setPreview(data.invite);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Invitation not found");
    }
  };

  const accept = async () => {
    setAccepting(true);
    setAcceptError(null);
    try {
      const data = await api.acceptInvite(token);
      setAccepted({ workspaceId: data.workspace.id, workspaceName: data.workspace.name, role: data.role });
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Failed to accept the invitation");
    } finally {
      setAccepting(false);
    }
  };

  useEffect(() => {
    void loadPreview();
  }, [token]);

  const expired = preview?.status !== "pending";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-mesh-light" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-black/40"
      >
        {previewError ? (
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-100">Invitation unavailable</h1>
            <p className="text-sm text-slate-500 mt-2">{previewError}</p>
            <Button variant="outline" className="mt-6 border-white/10 text-slate-300" onClick={() => setLocation("/")}>
              Back to home
            </Button>
          </div>
        ) : !preview ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
          </div>
        ) : accepted ? (
          <div className="text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-100">You're in!</h1>
            <p className="text-sm text-slate-400 mt-2">
              You joined <span className="font-semibold text-slate-200">{accepted.workspaceName ?? "the workspace"}</span> as{" "}
              <span className="font-semibold text-indigo-300">{accepted.role}</span>.
            </p>
            <Button className="mt-6 bg-indigo-500 hover:bg-indigo-400 text-white" onClick={() => setLocation(`/app/workspaces/${accepted.workspaceId}`)}>
              Open workspace <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">You've been invited</h1>
            <p className="text-sm text-slate-400 mt-2">
              Join as <span className="font-semibold text-indigo-300 capitalize">{preview.role}</span> using the account{" "}
              <span className="font-mono text-slate-200">{preview.email}</span>.
            </p>
            {expired ? (
              <p className="mt-6 text-sm text-amber-300">This invitation is no longer active (status: {preview.status}).</p>
            ) : authStatus?.authenticated ? (
              <div className="mt-6">
                <Button onClick={accept} disabled={accepting} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white">
                  {accepting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Accept invitation
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <a href={`${API_BASE}/api/auth/github`} className="block">
                  <Button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white">
                    Sign in with GitHub
                  </Button>
                </a>
                <p className="text-[11px] text-slate-500">
                  After signing in, reopen this invitation link to redeem it.
                </p>
              </div>
            )}
            {acceptError && (
              <p className="mt-4 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                {acceptError}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
