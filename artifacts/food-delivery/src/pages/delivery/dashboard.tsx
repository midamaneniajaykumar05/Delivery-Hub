import { AppLayout } from "@/components/layout";
import { useListDeliveryOrders, useGetDeliveryEarnings, useUpdateOrderStatus, getListDeliveryOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, Package, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  ready_for_pickup: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
};

function EarningsCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div><p className="text-xl font-bold text-foreground">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
    </div>
  );
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useListDeliveryOrders({ query: { enabled: !!user, refetchInterval: 20000 } });
  const { data: earnings } = useGetDeliveryEarnings({ query: { enabled: !!user } });
  const updateStatus = useUpdateOrderStatus();

  const handlePickup = (orderId: number) => {
    updateStatus.mutate({ id: orderId, data: { status: "out_for_delivery", deliveryPartnerId: user?.id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeliveryOrdersQueryKey() });
        toast({ title: "Order picked up — now out for delivery" });
      },
    });
  };

  const handleDeliver = (orderId: number) => {
    updateStatus.mutate({ id: orderId, data: { status: "delivered" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeliveryOrdersQueryKey() });
        toast({ title: "Order marked as delivered!" });
      },
    });
  };

  const activeOrders = orders?.filter(o => o.status !== "delivered") || [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Delivery Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <EarningsCard label="Total Earnings" value={`$${earnings?.totalEarnings?.toFixed(2) || "0.00"}`} icon={<DollarSign size={22} className="text-green-600" />} color="bg-green-100" />
          <EarningsCard label="This Week" value={`$${earnings?.weekEarnings?.toFixed(2) || "0.00"}`} icon={<TrendingUp size={22} className="text-blue-600" />} color="bg-blue-100" />
          <EarningsCard label="Today" value={`$${earnings?.todayEarnings?.toFixed(2) || "0.00"}`} icon={<Calendar size={22} className="text-primary" />} color="bg-primary/10" />
          <EarningsCard label="Total Deliveries" value={earnings?.totalDeliveries || 0} icon={<Package size={22} className="text-purple-600" />} color="bg-purple-100" />
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4">Available & Active Orders</h2>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4" />
            <p>No active orders available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-card-border rounded-2xl p-5" data-testid={`card-delivery-order-${order.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">Order #{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.restaurantName}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mb-3">
                  {order.items.map(item => (
                    <p key={item.id} className="text-sm text-muted-foreground">{item.name} x{item.quantity}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">${order.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-green-600 font-medium">Earning: $3.50</p>
                  </div>
                  <div className="flex gap-2">
                    {order.status === "ready_for_pickup" && (
                      <Button size="sm" onClick={() => handlePickup(order.id)} disabled={updateStatus.isPending} data-testid={`button-pickup-${order.id}`}>
                        Pick Up
                      </Button>
                    )}
                    {order.status === "out_for_delivery" && order.deliveryPartnerId === user?.id && (
                      <Button size="sm" onClick={() => handleDeliver(order.id)} disabled={updateStatus.isPending} data-testid={`button-deliver-${order.id}`}>
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
