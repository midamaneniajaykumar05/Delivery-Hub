import { AppLayout } from "@/components/layout";
import { useListOrders } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { ClipboardList } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  payment_completed: "bg-blue-100 text-blue-800",
  accepted: "bg-indigo-100 text-indigo-800",
  preparing: "bg-orange-100 text-orange-800",
  ready_for_pickup: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  payment_completed: "Payment Confirmed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function Orders() {
  const { user } = useAuth();
  const { data, isLoading } = useListOrders({}, { query: { enabled: !!user } });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList size={56} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No orders yet</p>
            <p className="text-sm text-muted-foreground">Order some food to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.data.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/orders/${order.id}`} className="block bg-card border border-card-border rounded-2xl p-5 hover:shadow-md transition-shadow" data-testid={`card-order-${order.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{order.restaurantName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Order #{order.id} · {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
                    </p>
                    <p className="font-bold text-foreground">${order.totalAmount.toFixed(2)}</p>
                  </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
