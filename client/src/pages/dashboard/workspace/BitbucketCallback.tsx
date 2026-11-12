import { useEffect, useRef, useState } from "react";
import { useParams, useSearch } from "wouter";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompleteBitbucketConnection } from "@/hooks/use-workspaces";

/**
 * Bitbucket Cloud OAuth callback (M5): Atlassian redirects here with
 * ?code=…&state=… after the user approves the consumer. We verify the signed
 * state server-side, exchange the code, persist the workspace connection,
 * and send the user back to the workspace registry.
 */
export default function BitbucketCallback() {
  const params = useParams<{ wsId?: string }>();
  const wsId = params?.wsId ?? "";
  const search = useSearch();
  const code = new URLSearchParams(search).get("code");
  const state = new URLSearchParams(search).get("state");
  const complete = useCompleteBitbucketConnection(wsId);
  const fired = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!code || !state) {
      setError("Missing authorization code or state in the callback URL.");
      return;
    }
    complete.mutate(
      { code, state },
      {
        onError: (err) => setError(err instanceof Error ? err.message : "Unexpected error"),
        onSuccess: () => setDone(true),
      },
    );
  }, [code, state, complete]);

  const backHref = `/app/workspaces/${wsId}`;

  return (
    <div className="p-6 max-w-md mx-auto mt-24">
      <Card className="p-8 bg-slate-900/60 border border-white/10 text-center">
        {error ? (
          <>
            <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <h2 className="font-semibold text-slate-100">Bitbucket not connected</h2>
            <p className="text-sm text-rose-300 mt-2">{error}</p>
            <Button className="mt-6 bg-indigo-500 hover:bg-indigo-400 text-white" onClick={() => { window.location.href = backHref; }}>
              Back to workspace
            </Button>
          </>
        ) : done ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-semibold text-slate-100">Bitbucket Cloud connected</h2>
            <p className="text-sm text-slate-400 mt-2">
              This workspace can now sync Bitbucket repositories. Sending you back…
            </p>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-spin" />
            <h2 className="font-semibold text-slate-100">Completing the Bitbucket connection…</h2>
            <p className="text-sm text-slate-400 mt-2">Verifying the authorization with Atlassian.</p>
          </>
        )}
      </Card>
      {done && <meta httpEquiv="refresh" content="1.5;url=/app/workspaces" />}
    </div>
  );
}
