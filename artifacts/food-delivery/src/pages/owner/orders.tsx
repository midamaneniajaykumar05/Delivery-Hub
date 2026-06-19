import { AppLayout } from "@/components/layout";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", payment_completed: "Paid", accepted: "Accepted",
  preparing: "Preparing", ready_for_pickup: "Ready", out_for_delivery: "On the way",
  delivered: "Delivered", cancelled: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", payment_completed: "bg-blue-100 text-blue-800",
  accepted: "bg-indigo-100 text-indigo-800", preparing: "bg-orange-100 text-orange-800",
  ready_for_pickup: "bg-purple-100 text-purple-800", out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
};

const TRANSITIONS: Record<string, string[]> = {
  payment_completed: ["accepted", "cancelled"],
  accepted: ["preparing"],
  preparing: ["ready_for_pickup"],
  ready_for_pickup: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
};

export default function OwnerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useListOrders({}, { query: { enabled: !!user, refetchInterval: 30000 } });
  const updateStatus = useUpdateOrderStatus();

  const handleUpdate = (orderId: number, status: string) => {
    updateStatus.mutate({ id: orderId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: `Order status updated to ${STATUS_LABELS[status]}` });
      },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    });
  };

  const activeOrders = data?.data.filter(o => !["delivered", "cancelled"].includes(o.status)) || [];
  const pastOrders = data?.data.filter(o => ["delivered", "cancelled"].includes(o.status)) || [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Incoming Orders</h1>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20"><ClipboardList size={48} className="mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No orders yet</p></div>
        ) : (
          <div className="space-y-8">
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-foreground mb-4">Active ({activeOrders.length})</h2>
                <div className="space-y-4">
                  {activeOrders.map((order, i) => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card border border-card-border rounded-2xl p-5" data-testid={`card-order-${order.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                      </div>
                      <div className="space-y-1 mb-4">
                        {order.items.map(item => (
                          <p key={item.id} className="text-sm text-muted-foreground">{item.name} x{item.quantity} — ${(item.price * item.quantity).toFixed(2)}</p>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-foreground">${order.totalAmount.toFixed(2)}</p>
                        {TRANSITIONS[order.status] && (
                          <div className="flex gap-2">
                            {TRANSITIONS[order.status].map(s => (
                              <Button key={s} size="sm" variant={s === "cancelled" ? "destructive" : "default"} onClick={() => handleUpdate(order.id, s)} disabled={updateStatus.isPending} data-testid={`button-status-${s}-${order.id}`}>
                                {STATUS_LABELS[s]}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-muted-foreground mb-4">Past Orders ({pastOrders.length})</h2>
                <div className="space-y-3">
                  {pastOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-card border border-card-border rounded-xl px-4 py-3 opacity-70" data-testid={`card-past-order-${order.id}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.items.map(i => i.name).join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground text-sm">${order.totalAmount.toFixed(2)}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
