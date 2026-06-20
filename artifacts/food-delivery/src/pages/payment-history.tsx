import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CreditCard, Receipt, CheckCircle, XCircle, Clock, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Payment {
  id: number;
  orderId: number;
  amount: number;
  transactionId: string | null;
  status: string;
  createdAt: string;
  restaurantName: string;
  orderStatus: string;
}

export default function PaymentHistory() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/payments/history", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setPayments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (!user) return null;

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle size={16} className="text-green-500" />;
    if (status === "failed") return <XCircle size={16} className="text-red-500" />;
    return <Clock size={16} className="text-amber-500" />;
  };

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
  };

  const totalSpent = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <CreditCard size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
            <p className="text-sm text-muted-foreground">All your transaction records</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Payments", value: payments.length, icon: Receipt, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Successful", value: payments.filter(p => p.status === "completed").length, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
            { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-2xl border border-card-border animate-pulse" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No payments yet</p>
            <p className="text-sm mb-6">Your payment history will appear here after you place orders</p>
            <Button onClick={() => setLocation("/restaurants")}>Browse Restaurants</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, i) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="p-2.5 rounded-xl bg-muted flex-shrink-0">
                  {statusIcon(payment.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">Order #{payment.orderId}</span>
                    {statusBadge(payment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{payment.restaurantName}</p>
                  {payment.transactionId && (
                    <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                      Txn: {payment.transactionId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(payment.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-foreground">${payment.amount.toFixed(2)}</p>
                  <Button variant="ghost" size="sm" className="text-xs mt-1 h-7 px-2" onClick={() => setLocation(`/orders/${payment.orderId}`)}>
                    View Order
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
