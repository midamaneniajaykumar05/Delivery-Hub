import { AppLayout } from "@/components/layout";
import { useGetAnalyticsSummary, useGetRevenueAnalytics, useGetOrdersChart, useGetTopFoods } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div><p className="text-2xl font-bold text-foreground">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
    </div>
  );
}

export default function OwnerAnalytics() {
  const { user } = useAuth();
  const { data: summary } = useGetAnalyticsSummary({ query: { enabled: !!user } });
  const { data: revenue } = useGetRevenueAnalytics({ period: "daily" }, { query: { enabled: !!user } });
  const { data: ordersChart } = useGetOrdersChart({ days: 14 }, { query: { enabled: !!user } });
  const { data: topFoods } = useGetTopFoods({ query: { enabled: !!user } });

  const chartData = revenue?.map(d => ({ date: d.date.slice(5), revenue: d.revenue, orders: d.orders })) || [];
  const ordersData = ordersChart?.map(d => ({ date: d.date.slice(5), orders: d.orders })) || [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Analytics</h1>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Revenue" value={`$${summary?.totalRevenue?.toFixed(2) || "0.00"}`} icon={<DollarSign size={22} className="text-green-600" />} color="bg-green-100" />
          <StatCard label="Total Orders" value={String(summary?.totalOrders || 0)} icon={<ShoppingBag size={22} className="text-blue-600" />} color="bg-blue-100" />
          <StatCard label="Avg Order Value" value={`$${summary?.averageOrderValue?.toFixed(2) || "0.00"}`} icon={<TrendingUp size={22} className="text-primary" />} color="bg-primary/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Revenue Trend (14 days)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Orders per Day</h2>
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

        {topFoods && topFoods.length > 0 && (
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Top Menu Items</h2>
            <div className="space-y-3">
              {topFoods.slice(0, 5).map((item, i) => (
                <div key={item.id} className="flex items-center gap-4">
                  <span className="text-muted-foreground text-sm w-5 font-medium">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.totalOrdered} orders · ${item.revenue.toFixed(2)} revenue</p>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(item.totalOrdered / (topFoods[0].totalOrdered || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
