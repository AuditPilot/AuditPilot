import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Check,
  FileDiff,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Loader2,
  Plus,
  Settings,
  SquareKanban,
  Tag,
  Target,
  UserRoundCheck,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderMarkdownLite } from "@/lib/markdown-lite";

// ---------------------------------------------------------------------------
// Branch slug — mirrors server/modules/audits/service.ts slugifyBranchTitle so
// the live preview the user sees matches the branch GitHub creates.
// ---------------------------------------------------------------------------

export function composeBranchSlug(title: string): string {
  const slug = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "fixes";
}

// ---------------------------------------------------------------------------
// Right-rail section (GitHub "Reviewers / Assignees / Labels / Projects / …")
// ---------------------------------------------------------------------------

function RailSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-xl transition-[border-color] duration-300 hover:border-indigo-400/25">
      <header className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/5">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <span className="flex items-center gap-1 text-slate-500">
          <Settings className="h-3 w-3" />
          <Plus className="h-3.5 w-3.5" />
        </span>
      </header>
      <div className="px-3.5 py-3 text-[13px] text-slate-400">
        {children}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

export interface PRComposerProps {
  owner: string;
  repo: string;
  /** Branch the PR targets. */
  baseBranch: string;
  /** Live Preview: auditpilot-fix-<slug(title)> — updates as the title is typed. */
  headBranch: string;
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCreate: () => void;
  /** Jump to the inline diff editor tab. */
  onOpenFiles: () => void;
  creating: boolean;
  /** Loading state of the fix preview (file list unknown yet). */
  isPreviewLoading?: boolean;
  fileCount?: number;
  changedCount?: number;
  avatarUrl?: string;
  userName?: string;
}

export default function PRComposer({
  owner,
  repo,
  baseBranch,
  headBranch,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onCreate,
  onOpenFiles,
  creating,
  isPreviewLoading,
  fileCount = 0,
  changedCount = 0,
  avatarUrl,
  userName,
}: PRComposerProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  const commits = changedCount;
  const contributors = 1;

  const chip = "inline-flex min-w-0 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-300 hover:border-indigo-400/30 transition-colors";
  const repoLabel = `${owner || "repo"}/${repo || "repo"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto"
    >
      {/* ── Page heading ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="flex items-center gap-2.5 text-xl md:text-2xl font-bold tracking-tight text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <GitPullRequest className="h-5 w-5 text-emerald-400" />
          </span>
          Open a pull request
        </h2>
        <span className="px-3.5 py-1.5 rounded-full bg-white/5 text-xs font-semibold text-slate-300 border border-white/10 backdrop-blur-md">
          fixes merged as <span className="font-mono text-emerald-300">{headBranch}</span>
        </span>
      </div>

      {/* ── Compare bar: base ← compare chips + merge status ────────── */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              base:
              <GitBranch className="h-3.5 w-3.5 text-slate-500" />
            </span>
            <span className={chip}>
              <span className="text-slate-300">{repoLabel}:</span>
              <span className="font-semibold text-slate-100">{baseBranch}</span>
            </span>
            <span className="mx-1 flex h-4 w-4 items-center justify-center text-slate-600">
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              compare:
              <GitBranch className="h-3.5 w-3.5 text-emerald-500/80" />
            </span>
            <span className={`${chip} !border-emerald-500/25 !bg-emerald-500/[0.07]`}>
              <span className="text-slate-300">{repoLabel}:</span>
              <span className="font-semibold text-emerald-300" title={headBranch}>
                {headBranch.length > 34 ? `${headBranch.slice(0, 34)}…` : headBranch}
              </span>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFiles}
            className="h-8 rounded-full border-white/15 bg-white/5 text-xs font-semibold text-slate-200 backdrop-blur-md hover:bg-white/10 hover:text-white hover:-translate-y-0.5"
          >
            Edit diffs
          </Button>
        </div>

        {/* merge-status band */}
        <div className="flex items-center gap-2.5 border-b border-white/5 bg-emerald-500/[0.06] px-4 py-2.5 text-sm text-emerald-300">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <p>Able to merge. These branches can be automatically merged.</p>
        </div>

        {/* compare tabs (Commits / Files changed) */}
        <div className="flex items-center gap-5 px-4 py-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 border-b-2 border-transparent pb-1 text-slate-400">
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            {commits} Commits
          </span>
          <button
            type="button"
            onClick={onOpenFiles}
            className="flex items-center gap-1.5 border-b-2 border-indigo-500 pb-1 text-slate-100 hover:text-white"
          >
            <FileDiff className="h-3.5 w-3.5" />
            {isPreviewLoading ? "Files changed" : `${fileCount} Files changed`}
          </button>
        </div>
      </div>

      {/* ── Composer grid: main column + right rail ─────────────────── */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* ---- main composer ---- */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* avatar + title row */}
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 bg-white/[0.02]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full ring-2 ring-white/10 object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white ring-2 ring-white/10">
                {(userName || owner || "A").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 focus-within:border-indigo-500/50 focus-within:bg-white/[0.05] transition-[border-color,background-color]">
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Add a title *"
                maxLength={180}
                className="h-11 w-full border-0 bg-transparent text-[15px] font-semibold text-white placeholder:text-slate-600 outline-none"
              />
              {title.trim() ? <Check className="h-4 w-4 text-emerald-400" /> : null}
            </div>
          </div>

          {/* Write / Preview tabs */}
          <div className="flex items-center gap-2 border-b border-white/5 px-4 pt-3">
            {(["write", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-t-md px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  mode === m
                    ? "border-b-2 border-indigo-500 text-white"
                    : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
            <span className="ml-auto hidden sm:block text-[11px] text-slate-600">
              {mode === "write" ? "Markdown supported: **bold**, `code`, # headings, - lists, ```code fences```" : "How it will look on GitHub"}
            </span>
          </div>

          {/* body */}
          <div className="px-4 py-3">
            {mode === "write" ? (
              <textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={12}
                placeholder="Add a description…"
                className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] p-3.5 font-mono text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-[border-color,background-color]"
              />
            ) : (
              <div className="min-h-[290px] rounded-xl border border-white/10 bg-white/[0.02] p-4">
                {description.trim() ? (
                  renderMarkdownLite(description, "prcnt")
                ) : (
                  <p className="text-[13px] text-slate-500">Empty description.</p>
                )}
              </div>
            )}
          </div>

          {/* footer CTA */}
          <div className="flex flex-wrap items-center gap-3 border-t border-white/5 bg-white/[0.02] px-4 py-3">
            <Button
              onClick={onCreate}
              disabled={creating}
              size="sm"
              className="h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition-opacity px-4 font-bold text-white shadow-lg shadow-indigo-500/25"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitPullRequest className="h-4 w-4" />}
              &nbsp;Create pull request
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenFiles}
              className="h-9 rounded-lg border-white/15 bg-white/5 font-semibold text-slate-200 backdrop-blur-md hover:bg-white/10 hover:text-white"
            >
              Review edits first
            </Button>
            <p className="ml-auto text-[11px] text-slate-500">
              Title &amp; description are saved locally and bound to the PR when you create it.
            </p>
          </div>
        </div>

        {/* ---- right rail ---- */}
        <aside className="space-y-3">
          <RailSection icon={<Users className="h-3.5 w-3.5" />} label="Reviewers">
            <p>No reviews — yet</p>
          </RailSection>
          <RailSection icon={<UserRoundCheck className="h-3.5 w-3.5" />} label="Assignees">
            <p>None yet — {userName || owner || "you"} is creating this PR</p>
          </RailSection>
          <RailSection icon={<Tag className="h-3.5 w-3.5" />} label="Labels">
            <p>None yet</p>
          </RailSection>
          <RailSection icon={<SquareKanban className="h-3.5 w-3.5" />} label="Projects">
            <p>None yet</p>
          </RailSection>
          <RailSection icon={<Target className="h-3.5 w-3.5" />} label="Milestone">
            <p>None yet</p>
          </RailSection>
        </aside>
      </div>

      {/* ── GitHub-style status footer ──────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-xs font-semibold text-slate-400 backdrop-blur-xl">
        <span className="flex items-center gap-1.5">
          <GitCommitHorizontal className="h-4 w-4 text-slate-500" />
          {commits} Commits
        </span>
        <span className="flex items-center gap-1.5">
          <FileDiff className="h-4 w-4 text-slate-500" />
          {isPreviewLoading ? "…" : `${changedCount} Files changed`}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-slate-500" />
          {contributors} Contributor{contributors === 1 ? "" : "s"}
        </span>
        <a
          href={`https://github.com/${owner}/${repo}/branches`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1 text-slate-500 transition-colors hover:text-cyan-300"
        >
          Show all branches
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </a>
      </div>
    </motion.div>
  );
}
