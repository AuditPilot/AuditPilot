import { useEffect, useRef, useState } from "react";
import { useParams, useSearch } from "wouter";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompleteGithubAppInstall } from "@/hooks/use-workspaces";

/**
 * GitHub App install callback (M3): GitHub redirects here with
 * ?installation_id=… after the org admin approves the install. We verify the
 * installation server-side and persist the workspace connection, then send
 * the user back to the workspace registry.
 */
export default function GithubAppCallback() {
  const params = useParams<{ wsId?: string }>();
  const wsId = params?.wsId ?? "";
  const search = useSearch();
  const installationId = new URLSearchParams(search).get("installation_id");
  const complete = useCompleteGithubAppInstall(wsId);
  const fired = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!installationId) {
      setError("Missing installation id in the callback URL.");
      return;
    }
    complete.mutate(installationId, {
      onError: (err) => setError(err instanceof Error ? err.message : "Unexpected error"),
      onSuccess: () => setDone(true),
    });
  }, [installationId, complete]);

  const backHref = `/app/workspaces/${wsId}`;

  return (
    <div className="p-6 max-w-md mx-auto mt-24">
      <Card className="p-8 bg-slate-900/60 border border-white/10 text-center">
        {error ? (
          <>
            <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <h2 className="font-semibold text-slate-100">Installation not connected</h2>
            <p className="text-sm text-rose-300 mt-2">{error}</p>
            <Button className="mt-6 bg-indigo-500 hover:bg-indigo-400 text-white" onClick={() => { window.location.href = backHref; }}>
              Back to workspace
            </Button>
          </>
        ) : done ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-semibold text-slate-100">GitHub App connected</h2>
            <p className="text-sm text-slate-400 mt-2">
              Webhook-driven sync is active. Sending you back to the workspace…
            </p>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-spin" />
            <h2 className="font-semibold text-slate-100">Completing the GitHub App install…</h2>
            <p className="text-sm text-slate-400 mt-2">Verifying the installation with GitHub.</p>
          </>
        )}
      </Card>
      {done && <meta httpEquiv="refresh" content="1.5;url=/app/workspaces" />}
    </div>
  );
}
