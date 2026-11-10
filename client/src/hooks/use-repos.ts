import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-service";
import type { NormalizedRepository } from "@/lib/api-service";

export function useRepos() {
    return useQuery<NormalizedRepository[]>({
        queryKey: ["repos"],
        queryFn: () => api.getRepos(),
    });
}

export function useAuthStatus() {
    return useQuery({
        queryKey: ["auth-status"],
        queryFn: async () => {
            try {
                const data = await api.getAuthStatus();
                if (data.authenticated) {
                    localStorage.setItem("authenticated", "true");
                } else {
                    localStorage.removeItem("authenticated");
                }
                return data;
            } catch (err) {
                localStorage.removeItem("authenticated");
                return { authenticated: false };
            }
        },
        retry: false
    });
}
