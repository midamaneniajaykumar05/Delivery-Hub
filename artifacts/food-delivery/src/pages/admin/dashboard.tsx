import { AppLayout } from "@/components/layout";
import { useGetAnalyticsSummary, useListOrders } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, ShoppingBag, Users, Store, CheckCircle, XCircle, TrendingUp, Percent } from "lucide-react";
import { motion } from "framer-motion";

function StatCard({ label, value, sub, icon, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-card-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetAnalyticsSummary({ query: { enabled: !!user } });
  const { data: orders } = useListOrders({ limit: 8 }, { query: { enabled: !!user } });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">FoodFleet Admin Dashboard</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Revenue" value={`$${summary?.totalRevenue?.toFixed(2) || "0.00"}`} icon={<DollarSign size={20} className="text-green-600" />} color="bg-green-100" />
            <StatCard label="Total Orders" value={summary?.totalOrders || 0} icon={<ShoppingBag size={20} className="text-blue-600" />} color="bg-blue-100" />
            <StatCard label="Total Customers" value={summary?.totalCustomers || 0} icon={<Users size={20} className="text-purple-600" />} color="bg-purple-100" />
            <StatCard label="Active Restaurants" value={summary?.activeRestaurants || 0} icon={<Store size={20} className="text-primary" />} color="bg-primary/10" />
            <StatCard label="Completed Orders" value={summary?.completedOrders || 0} icon={<CheckCircle size={20} className="text-green-600" />} color="bg-green-100" />
            <StatCard label="Cancelled Orders" value={summary?.cancelledOrders || 0} icon={<XCircle size={20} className="text-red-500" />} color="bg-red-100" />
            <StatCard label="Avg Order Value" value={`$${summary?.averageOrderValue?.toFixed(2) || "0.00"}`} icon={<TrendingUp size={20} className="text-blue-600" />} color="bg-blue-100" />
            <StatCard label="Payment Success" value={`${summary?.paymentSuccessRate?.toFixed(1) || "0"}%`} icon={<Percent size={20} className="text-primary" />} color="bg-primary/10" />
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h2>
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Order</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Restaurant</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders?.data.map((order, i) => (
                  <tr key={order.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`} data-testid={`row-order-${order.id}`}>
                    <td className="px-5 py-3 font-medium text-foreground">#{order.id}</td>
                    <td className="px-5 py-3 text-muted-foreground">{order.restaurantName}</td>
                    <td className="px-5 py-3 font-bold text-foreground">${order.totalAmount.toFixed(2)}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!orders?.data.length && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
