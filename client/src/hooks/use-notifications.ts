import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";
import type { NotificationsPage } from "@/lib/api-service";

const INBOX_KEY = ["notifications"];

/** Personal notification inbox — polled so the header badge stays fresh. */
export function useNotifications(page = 1) {
  return useQuery<NotificationsPage>({
    queryKey: [...INBOX_KEY, page],
    queryFn: () => api.getNotifications(page),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      if (data.markedRead > 0) {
        toast({ title: "Inbox cleared", description: `${data.markedRead} notification(s) marked as read.` });
      }
    },
  });
}
