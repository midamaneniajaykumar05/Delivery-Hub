import { useRoute } from "wouter";
import { AppLayout } from "@/components/layout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ORDER_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "payment_completed", label: "Payment Confirmed" },
  { key: "accepted", label: "Restaurant Accepted" },
  { key: "preparing", label: "Preparing Your Food" },
  { key: "ready_for_pickup", label: "Ready for Pickup" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_INDEX: Record<string, number> = Object.fromEntries(ORDER_STEPS.map((s, i) => [s.key, i]));

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = parseInt(params?.id || "0");

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id), refetchInterval: 15000 }
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!order) return <AppLayout><div className="p-8 text-center text-muted-foreground">Order not found</div></AppLayout>;

  const currentStep = STATUS_INDEX[order.status] ?? -1;
  const isCancelled = order.status === "cancelled";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Order #{order.id}</h1>
          <p className="text-sm text-muted-foreground mt-1">From {order.restaurantName} · {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        {/* Status Timeline */}
        {!isCancelled ? (
          <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-5">Order Status</h2>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-5">
                {ORDER_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-4"
                      data-testid={`status-step-${step.key}`}
                    >
                      <div className="relative z-10 flex-shrink-0">
                        {done ? (
                          <CheckCircle2 size={28} className={cn("fill-primary text-primary-foreground", active && "animate-pulse")} />
                        ) : (
                          <Circle size={28} className="text-border" />
                        )}
                      </div>
                      <span className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                        {step.label}
                      </span>
                      {active && <Clock size={14} className="text-primary ml-auto animate-spin-slow" />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 mb-6 text-destructive font-medium">
            This order was cancelled.
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-card-border rounded-2xl p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-3" data-testid={`order-item-${item.id}`}>
                {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-3 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span data-testid="text-order-total">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {order.deliveryPartnerName && (
          <div className="bg-card border border-card-border rounded-2xl p-4 text-sm text-foreground">
            Delivery partner: <span className="font-medium">{order.deliveryPartnerName}</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
