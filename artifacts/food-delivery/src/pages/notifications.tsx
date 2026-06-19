import { AppLayout } from "@/components/layout";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications({ query: { enabled: !!user } });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ data: { id } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "All notifications marked as read" });
      },
    });
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} data-testid="button-mark-all-read">
              <CheckCheck size={15} className="mr-1.5" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={56} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={cn(
                  "flex gap-4 p-4 rounded-xl border cursor-pointer transition-colors",
                  n.isRead
                    ? "bg-card border-card-border"
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                )}
                data-testid={`card-notification-${n.id}`}
              >
                <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", n.isRead ? "bg-transparent" : "bg-primary")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", n.isRead ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
