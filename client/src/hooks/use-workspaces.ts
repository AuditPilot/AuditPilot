import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";
import type { PullListResponse, RepoFindingsResponse, RepoHealthResponse, RepoAuditSummary, RepoAuditCompareResponse } from "@/lib/api-service";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const data = await api.getWorkspaces();
      return data.workspaces;
    },
  });
}

export function useWorkspace(workspaceId?: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const data = await api.getWorkspace(workspaceId!);
      return data.workspace;
    },
    enabled: !!workspaceId,
  });
}

export function useWorkspaceConnections(workspaceId?: string) {
  return useQuery({
    queryKey: ["workspace-connections", workspaceId],
    queryFn: async () => {
      const data = await api.getWorkspaceConnections(workspaceId!);
      return data.connections;
    },
    enabled: !!workspaceId,
  });
}

export function useConnectWorkspaceGithub(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => api.connectWorkspaceGithub(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-connections", workspaceId] });
      toast({
        title: "GitHub connected",
        description: "This workspace can now sync repositories from your GitHub account.",
      });
    },
  });
}

export function useGithubAppInstallUrl(workspaceId: string) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => api.getGithubAppInstallUrl(workspaceId),
    onSuccess: (data) => {
      window.location.href = data.installUrl;
    },
    onError: (err) => {
      toast({
        title: "Cannot start the GitHub App install",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });
}

export function useCompleteGithubAppInstall(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (installationId: string) =>
      api.completeGithubAppInstall(workspaceId, installationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-connections", workspaceId] });
      toast({
        title: "GitHub App connected",
        description: "Webhook-driven sync is now active for this workspace's repositories.",
      });
    },
  });
}

export function useWorkspaceRepositories(workspaceId?: string) {
  return useQuery({
    queryKey: ["workspace-repositories", workspaceId],
    queryFn: async () => {
      const data = await api.getWorkspaceRepositories(workspaceId!);
      return data.repositories;
    },
    enabled: !!workspaceId,
  });
}

export function useSyncWorkspaceRepository(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (repoId: string) => api.syncWorkspaceRepository(workspaceId, repoId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-repositories", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-repo-pulls"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-pulls"] });
      toast({
        title: "Sync complete",
        description: `${result.repository.fullName}: ${result.pullRequestsSynced} pull request${result.pullRequestsSynced === 1 ? "" : "s"} synced.`,
      });
    },
  });
}

export function useRegisterWorkspaceRepository(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: Parameters<typeof api.registerWorkspaceRepository>[1]) =>
      api.registerWorkspaceRepository(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-repositories", workspaceId] });
      toast({
        title: "Repository registered",
        description: "Run a sync to pull its pull requests into AuditPilot.",
      });
    },
  });
}

export function useWorkspaceRepoPulls(workspaceId: string, repoId: string, state: string, page: number) {
  return useQuery<PullListResponse>({
    queryKey: ["workspace-repo-pulls", workspaceId, repoId, state, page],
    queryFn: () => api.getWorkspaceRepoPulls(workspaceId, repoId, { state, page }),
    enabled: !!workspaceId && !!repoId,
  });
}

export function useWorkspacePulls(workspaceId: string, state: string, page: number) {
  return useQuery<PullListResponse>({
    queryKey: ["workspace-pulls", workspaceId, state, page],
    queryFn: () => api.getWorkspacePulls(workspaceId, { state, page }),
    enabled: !!workspaceId,
  });
}

// --- Findings lifecycle + repo audits + health (M4) ---

export function useRepoFindings(workspaceId: string, repoId: string, status: string, severity: string) {
  return useQuery<RepoFindingsResponse>({
    queryKey: ["repo-findings", workspaceId, repoId, status, severity],
    queryFn: () => api.getRepoFindings(workspaceId, repoId, { status, severity }),
    enabled: !!workspaceId && !!repoId,
  });
}

export function useRepoHealth(workspaceId: string, repoId: string) {
  return useQuery<RepoHealthResponse>({
    queryKey: ["repo-health", workspaceId, repoId],
    queryFn: () => api.getRepoHealth(workspaceId, repoId),
    enabled: !!workspaceId && !!repoId,
  });
}

export function useRepoAudits(workspaceId: string, repoId: string) {
  return useQuery<{ repository: { id: string; fullName: string }; audits: RepoAuditSummary[] }>({
    queryKey: ["repo-audits", workspaceId, repoId],
    queryFn: () => api.getRepoAudits(workspaceId, repoId),
    enabled: !!workspaceId && !!repoId,
  });
}

export function useRepoAuditCompare(workspaceId: string, repoId: string, base?: string, target?: string) {
  return useQuery<RepoAuditCompareResponse>({
    queryKey: ["repo-audit-compare", workspaceId, repoId, base, target],
    queryFn: () => api.compareRepoAudits(workspaceId, repoId, base!, target!),
    enabled: !!workspaceId && !!repoId && !!base && !!target && base !== target,
  });
}
