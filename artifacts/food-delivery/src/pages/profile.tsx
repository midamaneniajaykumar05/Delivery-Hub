import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout";
import { useGetMe, useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
});

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  restaurant_owner: "Restaurant Owner",
  delivery_partner: "Delivery Partner",
  admin: "Administrator",
};

export default function Profile() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading } = useGetMe({ query: { enabled: !!authUser } });
  const updateProfile = useUpdateProfile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: me?.name || "", phone: me?.phone || "" },
    values: { name: me?.name || "", phone: me?.phone || "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    updateProfile.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Profile updated" });
      },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">My Profile</h1>

        <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground" data-testid="text-username">{me?.name}</p>
              <p className="text-sm text-muted-foreground">{me?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">{ROLE_LABELS[me?.role || ""] || me?.role}</Badge>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input data-testid="input-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input type="tel" data-testid="input-phone" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={updateProfile.isPending} data-testid="button-save-profile">
                {updateProfile.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-5 text-sm text-muted-foreground">
          <p>Member since {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}</p>
        </div>
      </div>
    </AppLayout>
  );
}
