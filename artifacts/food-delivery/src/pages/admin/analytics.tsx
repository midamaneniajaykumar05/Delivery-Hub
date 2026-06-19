import { AppLayout } from "@/components/layout";
import { useGetAnalyticsSummary, useGetRevenueAnalytics, useGetOrdersChart, useGetTopFoods, useGetTopRestaurants } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingBag, Users, Store, TrendingUp, Percent, Star } from "lucide-react";
import { motion } from "framer-motion";

function StatCard({ label, value, icon, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div><p className="text-xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </motion.div>
  );
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const { data: summary } = useGetAnalyticsSummary({ query: { enabled: !!user } });
  const { data: revenue } = useGetRevenueAnalytics({ period: "daily" }, { query: { enabled: !!user } });
  const { data: ordersChart } = useGetOrdersChart({ days: 14 }, { query: { enabled: !!user } });
  const { data: topFoods } = useGetTopFoods({ query: { enabled: !!user } });
  const { data: topRestaurants } = useGetTopRestaurants({ query: { enabled: !!user } });

  const revenueData = revenue?.map(d => ({ date: d.date.slice(5), revenue: d.revenue })) || [];
  const ordersData = ordersChart?.map(d => ({ date: d.date.slice(5), orders: d.orders })) || [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Platform Analytics</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Revenue" value={`$${summary?.totalRevenue?.toFixed(2) || "0.00"}`} icon={<DollarSign size={18} className="text-green-600" />} color="bg-green-100" />
          <StatCard label="Total Orders" value={summary?.totalOrders || 0} icon={<ShoppingBag size={18} className="text-blue-600" />} color="bg-blue-100" />
          <StatCard label="Customers" value={summary?.totalCustomers || 0} icon={<Users size={18} className="text-purple-600" />} color="bg-purple-100" />
          <StatCard label="Restaurants" value={summary?.activeRestaurants || 0} icon={<Store size={18} className="text-primary" />} color="bg-primary/10" />
          <StatCard label="Completed" value={summary?.completedOrders || 0} icon={<TrendingUp size={18} className="text-green-600" />} color="bg-green-100" />
          <StatCard label="Cancelled" value={summary?.cancelledOrders || 0} icon={<TrendingUp size={18} className="text-red-500" />} color="bg-red-100" />
          <StatCard label="Avg Order" value={`$${summary?.averageOrderValue?.toFixed(2) || "0.00"}`} icon={<DollarSign size={18} className="text-blue-600" />} color="bg-blue-100" />
          <StatCard label="Pay Success" value={`${summary?.paymentSuccessRate?.toFixed(0) || "0"}%`} icon={<Percent size={18} className="text-primary" />} color="bg-primary/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Revenue Trend (14 days)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Daily Orders</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topFoods && topFoods.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-4">Top Menu Items</h2>
              <div className="space-y-3">
                {topFoods.slice(0, 8).map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs w-5 font-semibold">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.totalOrdered} orders</p>
                    </div>
                    <span className="text-xs font-bold text-foreground">${item.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topRestaurants && topRestaurants.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-4">Top Restaurants</h2>
              <div className="space-y-3">
                {topRestaurants.slice(0, 8).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs w-5 font-semibold">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.totalOrders} orders</p>
                    </div>
                    <span className="text-xs font-bold text-foreground">${r.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
