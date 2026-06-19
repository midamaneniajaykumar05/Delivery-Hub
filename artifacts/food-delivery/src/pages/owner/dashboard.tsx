import { AppLayout } from "@/components/layout";
import { useGetAnalyticsSummary, useListOrders, useGetMyRestaurant } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, ShoppingBag, CheckCircle, XCircle, TrendingUp, Store } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", payment_completed: "bg-blue-100 text-blue-800",
  accepted: "bg-indigo-100 text-indigo-800", preparing: "bg-orange-100 text-orange-800",
  ready_for_pickup: "bg-purple-100 text-purple-800", out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", payment_completed: "Paid", accepted: "Accepted", preparing: "Preparing",
  ready_for_pickup: "Ready", out_for_delivery: "On the way", delivered: "Delivered", cancelled: "Cancelled",
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary({ query: { enabled: !!user } });
  const { data: orders } = useListOrders({ limit: 5 }, { query: { enabled: !!user } });
  const { data: restaurant } = useGetMyRestaurant({ query: { enabled: !!user } });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{restaurant?.name || "My Restaurant"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Dashboard overview</p>
        </div>

        {!restaurant && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center gap-4">
            <Store size={36} className="text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Set up your restaurant</p>
              <p className="text-sm text-muted-foreground">Create your restaurant profile to start receiving orders.</p>
            </div>
            <Link href="/owner/menu"><Button size="sm">Get started</Button></Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loadingSummary ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : (
            <>
              <StatCard label="Total Revenue" value={`$${summary?.totalRevenue?.toFixed(2) || "0.00"}`} icon={<DollarSign size={22} className="text-green-600" />} color="bg-green-100" />
              <StatCard label="Total Orders" value={summary?.totalOrders || 0} icon={<ShoppingBag size={22} className="text-blue-600" />} color="bg-blue-100" />
              <StatCard label="Completed" value={summary?.completedOrders || 0} icon={<CheckCircle size={22} className="text-primary" />} color="bg-primary/10" />
              <StatCard label="Cancelled" value={summary?.cancelledOrders || 0} icon={<XCircle size={22} className="text-red-500" />} color="bg-red-100" />
            </>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
            <Link href="/owner/orders" className="text-sm text-primary font-medium">View all</Link>
          </div>
          <div className="space-y-3">
            {orders?.data.slice(0, 5).map(order => (
              <div key={order.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">Order #{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.items.map(i => i.name).join(", ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">${order.totalAmount.toFixed(2)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                </div>
              </div>
            ))}
            {!orders?.data.length && <p className="text-center text-muted-foreground py-8">No orders yet</p>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
