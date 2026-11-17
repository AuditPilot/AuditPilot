import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";
import type {
  PullListResponse, RepoFindingsResponse, RepoHealthResponse, RepoAuditSummary, RepoAuditCompareResponse,
  WorkspaceMemberRow, WorkspaceInviteRow, ActivityPage,
} from "@/lib/api-service";

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

// --- Bitbucket Cloud connect flow (M5) ---

export function useBitbucketAuthorizeUrl(workspaceId: string) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => api.getBitbucketAuthorizeUrl(workspaceId),
    onSuccess: (data) => {
      window.location.href = data.authorizeUrl;
    },
    onError: (err) => {
      toast({
        title: "Cannot start the Bitbucket connect flow",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });
}

export function useCompleteBitbucketConnection(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: { code: string; state: string }) =>
      api.completeBitbucketConnection(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-connections", workspaceId] });
      toast({
        title: "Bitbucket Cloud connected",
        description: "This workspace can now sync repositories from your Bitbucket account.",
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

// --- Team collaboration (M8) ---

const MEMBERS_KEY = (wsId: string) => ["workspace-members", wsId];
const INVITES_KEY = (wsId: string) => ["workspace-invites", wsId];

export function useWorkspaceMembers(workspaceId?: string) {
  return useQuery<WorkspaceMemberRow[]>({
    queryKey: MEMBERS_KEY(workspaceId ?? ""),
    queryFn: async () => (await api.getWorkspaceMembers(workspaceId!)).members,
    enabled: !!workspaceId,
  });
}

export function useWorkspaceInvites(workspaceId?: string) {
  return useQuery<WorkspaceInviteRow[]>({
    queryKey: INVITES_KEY(workspaceId ?? ""),
    queryFn: async () => (await api.getWorkspaceInvites(workspaceId!)).invites,
    enabled: !!workspaceId,
  });
}

export function useChangeMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { userId: string; role: string }) =>
      api.changeWorkspaceMemberRole(workspaceId, input.userId, input.role),
    onSuccess: (data, input) => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY(workspaceId) });
      toast({ title: "Role updated", description: `Member is now a ${data.member.role}.` });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => api.removeWorkspaceMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY(workspaceId) });
      toast({ title: "Member removed", description: "They no longer have access to this workspace." });
    },
  });
}

export function useCreateInvite(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { email: string; role: string }) =>
      api.createWorkspaceInvite(workspaceId, input.email, input.role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVITES_KEY(workspaceId) });
      toast({
        title: "Invitation created",
        description: `Share the link with ${data.invite.email} — it lets them join as ${data.invite.role} for one week.`,
      });
    },
  });
}

export function useRevokeInvite(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (inviteId: string) => api.revokeWorkspaceInvite(workspaceId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITES_KEY(workspaceId) });
      toast({ title: "Invite revoked", description: "The invitation link no longer works." });
    },
  });
}

export function useWorkspaceActivity(workspaceId: string, page: number) {
  return useQuery<ActivityPage>({
    queryKey: ["workspace-activity", workspaceId, page],
    queryFn: () => api.getWorkspaceActivity(workspaceId, page),
    enabled: !!workspaceId,
  });
}

export function useAssignFinding(workspaceId: string, repoId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { findingId: string; assignedTo: string | null }) =>
      api.assignRepoFinding(workspaceId, repoId, input.findingId, input.assignedTo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["repo-findings", workspaceId, repoId] });
      toast({
        title: data.assignee ? `Assigned to ${data.assignee.username}` : "Assignment cleared",
      });
    },
  });
}
