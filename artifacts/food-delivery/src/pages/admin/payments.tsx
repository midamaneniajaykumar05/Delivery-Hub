import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreditCard, Search, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AdminPayment {
  id: number;
  orderId: number;
  amount: number;
  status: string;
  transactionId: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export default function AdminPayments() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/payments", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPayments(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = payments.filter(p =>
    p.userName.toLowerCase().includes(search.toLowerCase()) ||
    p.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    String(p.orderId).includes(search) ||
    (p.transactionId || "").includes(search)
  );

  const total = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const successful = payments.filter(p => p.status === "completed").length;
  const failed = payments.filter(p => p.status === "failed").length;

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <CreditCard size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Management</h1>
            <p className="text-sm text-muted-foreground">All platform transactions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `$${total.toFixed(2)}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Transactions", value: payments.length, icon: CreditCard, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Successful", value: successful, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
            { label: "Failed", value: failed, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}><stat.icon size={18} className={stat.color} /></div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by user, order ID, or transaction..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Payment ID", "Order", "Customer", "Amount", "Status", "Transaction ID", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No payments found</td></tr>
              ) : filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">#{p.id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">#{p.orderId}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{p.userName}</p>
                    <p className="text-xs text-muted-foreground">{p.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground">${p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground max-w-[140px] truncate">{p.transactionId || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
