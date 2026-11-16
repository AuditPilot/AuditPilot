import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-service";
import { Loader2, GitBranch, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BranchRepoInfo {
  name: string;
  /** Provider account/org that owns the repo (normalized ScmRepository.ownerAccount). */
  ownerAccount: string;
  defaultBranch?: string | null;
}

interface BranchSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: BranchRepoInfo | null;
  onConfirm: (branch: string) => void;
}

export function BranchSelectModal({ isOpen, onClose, repo, onConfirm }: BranchSelectModalProps) {
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!isOpen || !repo) return;
    if (!repo.name || !repo.ownerAccount) {
      setErrorMsg("Repository information is incomplete — close and reopen this dialog.");
      return;
    }

    // StrictMode-safe: ignore stale responses from double-invoked effects.
    let cancelled = false;
    setIsLoading(true);
    setErrorMsg(null);
    setBranches([]);
    setSelectedBranch("");

    api.getBranches(repo.ownerAccount, repo.name)
      .then((data) => {
        if (cancelled) return;
        setBranches(data);
        // Auto-select the repo's default branch (falls back to main/master/first).
        const preferred = data.includes(repo.defaultBranch || "")
          ? repo.defaultBranch!
          : data.includes("main")
            ? "main"
            : data.includes("master")
              ? "master"
              : (data[0] ?? "");
        setSelectedBranch(preferred);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Failed to fetch branches from your repository provider");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, repo, retryNonce]);

  const handleConfirm = () => {
    if (selectedBranch) onConfirm(selectedBranch);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10">
        <DialogHeader>
          <DialogTitle>Select Branch</DialogTitle>
          <DialogDescription>
            Choose the branch you want to audit for {repo?.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              <span className="text-xs">Fetching branches…</span>
            </div>
          ) : errorMsg ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm">
              <div className="flex items-start gap-2 text-rose-300">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-all">{errorMsg}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                onClick={() => setRetryNonce((n) => n + 1)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try again
              </Button>
            </div>
          ) : branches.length === 0 ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
              No branches were returned for this repository — it may be empty or your connection may not
              have access. Try reconnecting in Settings.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {branches.length >= 100 && (
                <p className="text-[10px] text-slate-500 px-1">
                  Showing the 100 most recent branches.
                </p>
              )}
              {branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => setSelectedBranch(branch)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                    selectedBranch === branch
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-4 h-4 opacity-50" />
                    <span className="font-medium text-sm">{branch}</span>
                  </div>
                  {selectedBranch === branch && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!selectedBranch || isLoading}
            onClick={handleConfirm}
            title={selectedBranch ? undefined : "Select a branch to continue"}
          >
            Start Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
