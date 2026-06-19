import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAdminListUsers, useAdminUpdateUser, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ROLES = ["customer", "restaurant_owner", "delivery_partner", "admin"];
const ROLE_LABELS: Record<string, string> = {
  customer: "Customer", restaurant_owner: "Owner", delivery_partner: "Delivery", admin: "Admin"
};
const ROLE_COLORS: Record<string, string> = {
  customer: "bg-blue-100 text-blue-800", restaurant_owner: "bg-orange-100 text-orange-800",
  delivery_partner: "bg-green-100 text-green-800", admin: "bg-purple-100 text-purple-800"
};

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<string>("");

  const { data, isLoading } = useAdminListUsers(
    { role: roleFilter !== "all" ? roleFilter : undefined, page },
    { query: { enabled: !!user } }
  );
  const updateUser = useAdminUpdateUser();

  const handleRoleUpdate = (userId: number) => {
    updateUser.mutate({ id: userId, data: { role: editRole } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        setEditingId(null);
        toast({ title: "User role updated" });
      },
    });
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">{data?.total || 0} total users</p>
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40" data-testid="select-role-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : (
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Role</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Joined</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((u, i) => (
                  <tr key={u.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`} data-testid={`row-user-${u.id}`}>
                    <td className="px-5 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3">
                      {editingId === u.id ? (
                        <Select value={editRole} onValueChange={setEditRole}>
                          <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      {editingId === u.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRoleUpdate(u.id)} disabled={updateUser.isPending} data-testid={`button-save-user-${u.id}`}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(u.id); setEditRole(u.role); }} data-testid={`button-edit-user-${u.id}`}>Edit</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} /> Prev
            </Button>
            <span className="text-sm text-muted-foreground py-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
