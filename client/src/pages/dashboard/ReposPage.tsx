import React from "react";
import { motion } from "framer-motion";
import { Github, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRepos } from "@/hooks/use-repos";
import { useLocation } from "wouter";
import DashboardLayout from "./DashboardLayout";

import { useState } from "react";
import { BranchSelectModal } from "@/components/dashboard/BranchSelectModal";
import type { NormalizedRepository } from "@/lib/api-service";

export default function ReposPage() {
  const { data: repos, isLoading: isLoadingRepos, isError, refetch } = useRepos();
  const [, setLocation] = useLocation();

  const [selectedRepo, setSelectedRepo] = useState<NormalizedRepository | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (repo: NormalizedRepository) => {
    setSelectedRepo(repo);
    setIsModalOpen(true);
  };

  const handleConfirmBranch = (branch: string) => {
    if (selectedRepo) {
      setLocation(`/app/audit/${selectedRepo.ownerLogin}/${selectedRepo.name}/${branch}`);
    }
    setIsModalOpen(false);
  };

  if (isLoadingRepos) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {isError ? (
          <Card className="p-8 text-center border-rose-500/20 bg-rose-500/5">
            <p className="text-rose-300 text-sm mb-4">Failed to load repositories.</p>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm" onClick={() => refetch()}>
              Try again
            </button>
          </Card>
        ) : !repos || repos.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Github className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100">No Repositories Found</h3>
            <p className="text-slate-500 mb-6">Make sure you have repositories in your GitHub account.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map((repo: NormalizedRepository) => (
              <div
                key={repo.providerExternalId}
                onClick={() => handleSelect(repo)}
                className="group bg-slate-900/60 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
                      <Github className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 truncate max-w-[240px]">{repo.fullName}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span>{repo.language || "Unknown"}</span>
                        {repo.updatedAt && (
                          <>
                            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                            <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/5 text-slate-300 group-hover:bg-indigo-500/10 group-hover:text-indigo-300">
                    {repo.stargazersCount ?? 0} ★
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-400">{repo.defaultBranch || "main"} branch</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 -mr-2"
                  >
                    Run Audit <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <BranchSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        repo={selectedRepo ? { name: selectedRepo.name, owner: { login: selectedRepo.ownerLogin }, default_branch: selectedRepo.defaultBranch ?? undefined } : null}
        onConfirm={handleConfirmBranch}
      />
    </DashboardLayout>
  );
}

