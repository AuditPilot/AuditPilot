import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Code2,
  ExternalLink,
  FileCode2,
  FileText,
  GitPullRequest,
  Github,
  Loader2,
  Minus,
  Plus,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePulls, usePRDetail, usePRFiles, usePRAudit, usePRMerge, useUpdatePR } from "@/hooks/use-pulls";
import { useBranches } from "@/hooks/use-audits";
import { useAuthStatus } from "@/hooks/use-repos";
import { renderMarkdownLite } from "@/lib/markdown-lite";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "../DashboardLayout";

// ---------------------------------------------------------------------------
// Inline diff — parsed from GitHub's unified `file.patch` string. No extra
// network call: the /files endpoint already ships patches for text files.
// ---------------------------------------------------------------------------

/** Max rows rendered inline — bigger diffs get a "view on GitHub" note. */
const MAX_DIFF_ROWS = 1000;

interface DiffRow {
  kind: "add" | "del" | "ctx" | "hunk";
  text: string;
  oldNum: number | null;
  newNum: number | null;
}

function parsePatch(patch: string): { rows: DiffRow[]; truncated: boolean } {
  const rows: DiffRow[] = [];
  let oldNum = 0;
  let newNum = 0;

  for (const raw of (patch || "").replace(/\r\n/g, "\n").split("\n")) {
    // Unified-diff file headers (patch is already scoped to one file)
    if (raw.startsWith("diff --git") || raw.startsWith("index ") || raw.startsWith("--- ") || raw.startsWith("+++ ")) continue;
    // "\ No newline at end of file" markers
    if (raw.startsWith("\\")) continue;

    if (raw.startsWith("@@")) {
      const hunk = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunk) {
        oldNum = parseInt(hunk[1], 10);
        newNum = parseInt(hunk[2], 10);
      }
      rows.push({ kind: "hunk", text: raw, oldNum: null, newNum: null });
      continue;
    }

    const mark = raw.charAt(0);
    if (mark === "+") {
      rows.push({ kind: "add", text: raw.slice(1), oldNum: null, newNum: newNum++ });
    } else if (mark === "-") {
      rows.push({ kind: "del", text: raw.slice(1), oldNum: oldNum++, newNum: null });
    } else if (mark === " ") {
      rows.push({ kind: "ctx", text: raw.slice(1), oldNum: oldNum++, newNum: newNum++ });
    } else if (raw === "") {
      rows.push({ kind: "ctx", text: "", oldNum: null, newNum: null });
    } else if (rows.length < MAX_DIFF_ROWS) {
      rows.push({ kind: "ctx", text: raw, oldNum: null, newNum: null });
    }

    if (rows.length >= MAX_DIFF_ROWS) break;
  }

  const truncated = (patch || "").replace(/\r\n/g, "\n").split("\n").length > rows.length;
  return { rows, truncated };
}

const rowTone: Record<DiffRow["kind"], string> = {
  add: "bg-emerald-500/[0.08] text-emerald-100/90",
  del: "bg-rose-500/[0.08] text-rose-100/90",
  ctx: "text-slate-400/90",
  hunk: "bg-sky-500/10 text-sky-300/90",
};

const numTone: Record<DiffRow["kind"], string> = {
  add: "text-emerald-500/60",
  del: "text-rose-500/60",
  ctx: "text-slate-600",
  hunk: "text-slate-600",
};

function DiffView({ patch }: { patch: string }) {
  const { rows, truncated } = React.useMemo(() => parsePatch(patch), [patch]);

  if (!rows.length) {
    return <div className="px-4 py-3 font-mono text-[12px] text-slate-500">No inline diff available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="w-max min-w-full font-mono text-[12px] leading-[1.6]">
        {rows.map((row, i) => (
          <div key={i} className={`grid grid-cols-[44px_44px_16px_1fr] ${rowTone[row.kind]}`}>
            <span className={`select-none px-2 text-right ${numTone[row.kind]}`}>
              {row.oldNum == null ? "" : row.oldNum}
            </span>
            <span className={`select-none px-2 text-right ${numTone[row.kind]}`}>
              {row.newNum == null ? "" : row.newNum}
            </span>
            <span className="select-none text-center opacity-70 px-0.5">
              {row.kind === "add" ? <Plus className="inline h-3 w-3 -mt-px" /> : row.kind === "del" ? <Minus className="inline h-3 w-3 -mt-px" /> : ""}
            </span>
            <span className="whitespace-pre pr-4">{row.text === "" ? " " : row.text}</span>
          </div>
        ))}
      </div>
      {truncated && (
        <div className="px-3 py-2 text-[11px] text-slate-500 border-t border-white/5">
          Diff truncated — view the full change on GitHub.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function PullDetailPage() {
  const { number } = useParams<{ number: string }>();
  const [, setLocation] = useLocation();
  const { data: pulls, isLoading: isLoadingPulls } = usePulls();
  const { data: authStatus } = useAuthStatus();

  // The list endpoint is search-based (no body) — the dedicated detail fetch
  // supplies the full PR object (description, real base/head refs & repo).
  const listPr = pulls?.find(p => p.number === parseInt(number));

  const repoOwner = listPr?.base?.repo?.owner?.login || listPr?.repo?.owner?.login || listPr?.repo?.owner || listPr?.owner?.login || listPr?.owner;
  const repoName = listPr?.base?.repo?.name || listPr?.repo?.name || listPr?.name;

  const { data: detail } = usePRDetail(repoOwner, repoName, parseInt(number));
  const pr = detail || listPr;

  const repoFull = pr?.base?.repo?.full_name || listPr?.repo?.full_name || (repoOwner && repoName ? `${repoOwner}/${repoName}` : "");

  const { data: files, isLoading: isLoadingFiles } = usePRFiles(repoOwner, repoName, parseInt(number));
  const { data: branches } = useBranches(repoOwner, repoName);
  const auditMutation = usePRAudit();
  const mergeMutation = usePRMerge();
  const updatePRMutation = useUpdatePR();

  const [targetBranch, setTargetBranch] = useState(pr?.base?.ref || "master");
  const [openFiles, setOpenFiles] = useState<Record<string, boolean>>({});

  // Keep the selector in sync with the PR's actual base branch
  useEffect(() => {
    if (pr?.base?.ref) setTargetBranch(pr.base.ref);
  }, [pr?.base?.ref, pr?.number]);

  // Auto-expand the first changed file so the diff is visible without a hunt
  const autoExpanded = React.useRef(false);
  useEffect(() => {
    if (!autoExpanded.current && files?.length) {
      autoExpanded.current = true;
      setOpenFiles({ [files[0].filename]: true });
    }
  }, [files]);

  // Base can't be the PR's own head branch
  const branchOptions = React.useMemo(() => {
    const opts = new Set<string>();
    if (pr?.base?.ref) opts.add(pr.base.ref);
    for (const b of branches || []) {
      if (b && b !== pr?.head?.ref) opts.add(b);
    }
    return Array.from(opts);
  }, [pr?.base?.ref, pr?.head?.ref, branches]);

  const totalAdd = (files || []).reduce((sum: number, f: any) => sum + (f.additions || 0), 0);
  const totalDel = (files || []).reduce((sum: number, f: any) => sum + (f.deletions || 0), 0);

  const handleAudit = () => {
    if (!pr) return;
    auditMutation.mutate({ owner: repoOwner, repo: repoName, number: pr.number }, {
      onSuccess: (data) => {
        // For transient PR results, we'll use sessionStorage
        sessionStorage.setItem(`pr_audit_${pr.number}`, JSON.stringify(data.issues || []));
        setLocation(`/app/pulls/${pr.number}/results`);
      }
    });
  };

  const handleMerge = () => {
    if (!pr) return;
    mergeMutation.mutate({ owner: repoOwner, repo: repoName, number: pr.number }, {
      onSuccess: () => setLocation('/app/pulls')
    });
  };

  const handleBranchChange = (newBranch: string) => {
    if (!pr || newBranch === targetBranch) return;
    setTargetBranch(newBranch);
    updatePRMutation.mutate({
      owner: repoOwner,
      repo: repoName,
      number: pr.number,
      data: { base: newBranch }
    });
  };

  const toggleFile = (filename: string) =>
    setOpenFiles((prev) => ({ ...prev, [filename]: !prev[filename] }));

  if (isLoadingPulls) {
    return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-400" /></div></DashboardLayout>;
  }

  if (!pr) {
    return <DashboardLayout><div className="text-center py-20 text-slate-500 font-bold">PR Not Found</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/app/pulls')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pull Requests
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10 border-none capitalize px-3">{pr.state}</Badge>
            <Badge variant="outline" className="border-white/10">#{pr.number}</Badge>
            {pr.html_url && (
              <a
                href={pr.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                title="Open on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden">
               <CardHeader className="bg-white/[0.03] border-b border-white/5 py-4 px-6">
                <CardTitle className="text-lg font-bold text-slate-100">{pr.title}</CardTitle>
                {pr.head?.ref && pr.base?.ref && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {pr.head.ref}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-indigo-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      {pr.base.ref}
                    </span>
                    {repoFull && <span className="ml-1 text-[11px] text-slate-500">{repoFull}</span>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <img src={pr.user?.avatar_url} className="w-12 h-12 rounded-full border-2 border-white/10" alt="" />
                  <div>
                    <div className="font-bold text-slate-100 text-lg">{pr.user?.login}</div>
                    <div className="text-sm text-slate-500">opened this pull request on {new Date(pr.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h4 className="mb-2 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Description
                  </h4>
                  {pr.body ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      {renderMarkdownLite(pr.body, "pr-body")}
                    </div>
                  ) : (
                    <p className="text-[13px] italic text-slate-500">No description provided.</p>
                  )}
                </div>

                {/* Changed files (expandable inline diffs) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Code2 className="w-4 h-4" /> Changed Files ({files?.length || 0})
                    </h4>
                    {!!files?.length && (
                      <div className="flex items-center gap-2 text-[11px] font-bold font-mono">
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+{totalAdd}</span>
                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">−{totalDel}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {isLoadingFiles ? (
                      <div className="flex justify-center py-4"><Loader2 className="animate-spin w-4 h-4 text-indigo-400" /></div>
                    ) : !files?.length ? (
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[13px] text-slate-500">No file changes in this pull request.</div>
                    ) : (
                      files.map((file: any) => {
                        const isOpen = !!openFiles[file.filename];
                        return (
                          <div key={file.filename} className={`rounded-xl border transition-all ${isOpen ? "border-indigo-500/30 bg-white/[0.04]" : "border-white/5 bg-white/[0.03] hover:bg-white/5 hover:border-indigo-500/30"}`}>
                            <button
                              onClick={() => toggleFile(file.filename)}
                              className="flex w-full items-center justify-between p-3.5 text-left"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-slate-400">
                                  <FileCode2 className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-mono text-slate-300 truncate max-w-[360px] md:max-w-[420px]">{file.filename}</span>
                              </div>
                              <div className="flex shrink-0 items-center gap-2.5">
                                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">+{file.additions}</span>
                                <span className="text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">−{file.deletions}</span>
                                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                              </div>
                            </button>
                            {isOpen && (
                              <div className="border-t border-white/5">
                                {file.patch ? (
                                  <DiffView patch={file.patch} />
                                ) : (
                                  <div className="flex items-center justify-between px-4 py-3 text-[12px] text-slate-500">
                                    <span>Binary or large file — inline diff unavailable.</span>
                                    {file.blob_url && (
                                      <a href={file.blob_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300">
                                        View file <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {!!files?.length && pr.html_url && (
                    <a
                      href={`${pr.html_url}/files`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 pt-1 text-[12px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      <Github className="h-3.5 w-3.5" /> View full diff on GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card className="border-indigo-500/30 bg-indigo-500/10 shadow-lg shadow-indigo-950/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Shield className="w-20 h-20 text-indigo-600" />
              </div>
              <CardHeader>
                <CardTitle className="text-indigo-300 flex items-center gap-2 font-bold">
                  <Shield className="w-5 h-5 text-indigo-400" /> AI Review
                </CardTitle>
                <CardDescription className="text-indigo-300/70 text-sm">
                  Audit the specific code changes in this PR for vulnerabilities and performance issues.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleAudit}
                  disabled={auditMutation.isPending}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition-opacity h-12 text-white font-bold shadow-lg shadow-indigo-500/25"
                >
                  {auditMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Review with AI
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden">
               <CardHeader className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02] px-6">Branch Configuration</CardHeader>
              <CardContent className="space-y-5 pt-5 px-6 pb-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase px-1">Target Base Branch</label>
                  <Select value={targetBranch} onValueChange={handleBranchChange}>
                    <SelectTrigger className="h-10 rounded-lg border-white/10 bg-white/5 text-sm text-slate-100 hover:bg-white/10 data-[state=open]:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 focus:ring-offset-0 cursor-pointer">
                      <SelectValue placeholder="Select a base branch" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10 bg-slate-900/95 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-xl">
                      {branchOptions.length ? (
                        branchOptions.map((b) => (
                          <SelectItem key={b} value={b} className="font-mono text-[13px] rounded-lg focus:bg-white/10 focus:text-slate-100">
                            {b}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-[12px] text-slate-500">No branches available</div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-500 px-1">Changing this updates the PR on GitHub instantly.</p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={handleMerge}
                    disabled={mergeMutation.isPending}
                    className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 font-bold h-11"
                  >
                    {mergeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitPullRequest className="w-4 h-4 mr-2 text-emerald-400" />}
                    Squash & Merge
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
