import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Truck, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DeliveryPartner {
  id: number;
  userId: number;
  vehicleNumber: string | null;
  totalDeliveries: number;
  name: string;
  email: string;
  phone: string | null;
}

export default function AdminDeliveryPartners() {
  const { token } = useAuth();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/delivery-partners", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPartners(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.vehicleNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalDeliveries = partners.reduce((s, p) => s + p.totalDeliveries, 0);
  const topPartner = partners.length > 0 ? [...partners].sort((a, b) => b.totalDeliveries - a.totalDeliveries)[0] : null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Truck size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Delivery Partners</h1>
            <p className="text-sm text-muted-foreground">Manage all delivery personnel</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10"><Truck size={20} className="text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{partners.length}</p>
              <p className="text-xs text-muted-foreground">Total Partners</p>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50"><Package size={20} className="text-green-500" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalDeliveries}</p>
              <p className="text-xs text-muted-foreground">Total Deliveries</p>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50"><Truck size={20} className="text-blue-500" /></div>
            <div>
              <p className="text-lg font-bold text-foreground truncate">{topPartner?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">Top Performer</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email, or vehicle number..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Partner", "Email", "Phone", "Vehicle #", "Deliveries"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No delivery partners found</td></tr>
              ) : filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.phone || "—"}</td>
                  <td className="px-4 py-3">
                    {p.vehicleNumber ? (
                      <Badge variant="outline" className="font-mono text-xs">{p.vehicleNumber}</Badge>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{p.totalDeliveries}</span>
                      <span className="text-xs text-muted-foreground">deliveries</span>
                    </div>
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
