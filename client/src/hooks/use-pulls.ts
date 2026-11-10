import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";
import type { PullListResponse } from "@/lib/api-service";

/**
 * Legacy pull pages resolve owner/repo from the list item's GitHub-shaped
 * fields. The mirror-backed inbox returns normalized pulls — alias the
 * fields those resolvers read so the existing pages keep working.
 */
function aliasNormalizedPull(pr: any): any {
  if (!pr || typeof pr !== "object" || pr.base || !("sourceBranch" in pr)) return pr;
  const fullName = pr.repository?.fullName ?? "";
  return {
    ...pr,
    owner: fullName.split("/")[0] || "",
    name: pr.repository?.name ?? "",
    repo: { name: pr.repository?.name ?? "", full_name: fullName },
    base: { ref: pr.destinationBranch },
    head: { ref: pr.sourceBranch },
    user: pr.author ? { login: pr.author.login, avatar_url: pr.author.avatarUrl ?? undefined } : undefined,
  };
}

export function usePulls() {
    return useQuery<any[]>({
        queryKey: ["pulls"],
        queryFn: async () => {
            const data = await api.getPulls() as PullListResponse | any[];
            const list = Array.isArray(data) ? data : (data?.pulls ?? []);
            return list.map(aliasNormalizedPull);
        },
    });
}

export function usePRFiles(owner: string, repo: string, number: number) {
    return useQuery<any[]>({
        queryKey: ["pull-files", owner, repo, number],
        queryFn: async () => {
            if (!owner || !repo || !number) return [];
            return api.getPullFiles(owner, repo, number.toString());
        },
        enabled: !!owner && !!repo && !!number,
    });
}

export function usePRDetail(owner: string, repo: string, number: number) {
    return useQuery<any>({
        queryKey: ["pull-detail", owner, repo, number],
        queryFn: async () => {
            if (!owner || !repo || !number) return null;
            const pr = await api.getPullDetail(owner, repo, number.toString());
            return aliasNormalizedPull({ ...pr, repository: { name: repo, fullName: `${owner}/${repo}` } });
        },
        enabled: !!owner && !!repo && !!number,
    });
}

export function usePRAudit() {
    return useMutation({
        mutationFn: async ({ owner, repo, number }: { owner: string; repo: string; number: number }) => {
            return api.auditPull(owner, repo, number);
        },
    });
}

export function usePRFix() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ owner, repo, number, issues }: { owner: string; repo: string; number: number; issues: any[] }) => {
            return api.fixPull(owner, repo, number, issues);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["pull-files", variables.owner, variables.repo, variables.number] });
            toast({
                title: "PR Corrected",
                description: "AI has pushed fixes to the Pull Request branch.",
            });
        },
    });
}

export function usePRMerge() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ owner, repo, number }: { owner: string; repo: string; number: number }) => {
            return api.mergePull(owner, repo, number);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pulls"] });
            toast({
                title: "Success",
                description: "Pull Request merged successfully",
            });
        },
    });
}

export function useUpdatePR() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ owner, repo, number, data }: { owner: string; repo: string; number: number; data: any }) => {
            return api.updatePull(owner, repo, number, data);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["pulls"] });
            queryClient.invalidateQueries({ queryKey: ["pull-detail", variables.owner, variables.repo, variables.number] });
            toast({
                title: "PR Updated",
                description: `Successfully updated PR #${variables.number}`,
            });
        },
    });
}
