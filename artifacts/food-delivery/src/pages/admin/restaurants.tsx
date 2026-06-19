import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAdminListRestaurants, useUpdateRestaurant, getAdminListRestaurantsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const STATUS_LABELS: Record<string, string> = { active: "Active", inactive: "Inactive", pending: "Pending" };
const STATUS_COLORS: Record<string, string> = { active: "bg-green-100 text-green-800", inactive: "bg-muted text-muted-foreground", pending: "bg-yellow-100 text-yellow-800" };

export default function AdminRestaurants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminListRestaurants({ page }, { query: { enabled: !!user } });
  const updateRestaurant = useUpdateRestaurant();

  const handleStatusChange = (id: number, status: string) => {
    updateRestaurant.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListRestaurantsQueryKey() });
        toast({ title: "Restaurant status updated" });
      },
    });
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.total || 0} total restaurants</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {data?.data.map(r => (
              <div key={r.id} className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4" data-testid={`card-restaurant-${r.id}`}>
                {r.image && <img src={r.image} alt={r.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{r.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={12} />{r.address}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                  <Select value={r.status} onValueChange={(s) => handleStatusChange(r.id, s)}>
                    <SelectTrigger className="h-8 text-xs w-32" data-testid={`select-status-${r.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Set Active</SelectItem>
                      <SelectItem value="inactive">Set Inactive</SelectItem>
                      <SelectItem value="pending">Set Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {!data?.data.length && <p className="text-center text-muted-foreground py-16">No restaurants yet</p>}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /> Prev</Button>
            <span className="text-sm text-muted-foreground py-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={16} /></Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
