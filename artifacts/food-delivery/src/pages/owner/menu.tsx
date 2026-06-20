import { useRef, useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetMyRestaurant, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useListCategories, useCreateRestaurant, getGetMyRestaurantQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Pencil, Trash2, UtensilsCrossed, Upload, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setPreview(url);
      onChange(url);
    } catch {
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">Food Image</Label>
      <div className="flex gap-2">
        <div
          className="relative w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors flex-shrink-0"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <ImageIcon size={24} className="mx-auto text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Upload</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2">Or enter image URL:</p>
          <Input
            value={preview}
            onChange={e => { setPreview(e.target.value); onChange(e.target.value); }}
            placeholder="https://example.com/image.jpg"
            className="text-sm"
          />
          {preview && (
            <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs text-muted-foreground px-2" onClick={() => { setPreview(""); onChange(""); }}>
              Clear image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItemForm({ item, restaurantId, categories, onSuccess }: any) {
  const [name, setName] = useState(item?.name || "");
  const [desc, setDesc] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [image, setImage] = useState(item?.image || "");
  const [categoryId, setCategoryId] = useState(item?.categoryId?.toString() || "");
  const [available, setAvailable] = useState(item?.available ?? true);
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!name || !price) { toast({ title: "Name and price are required", variant: "destructive" }); return; }
    const data = { restaurantId, name, description: desc || undefined, price: parseFloat(price), image: image || undefined, categoryId: categoryId ? parseInt(categoryId) : undefined, available };
    if (item) {
      updateItem.mutate({ id: item.id, data }, { onSuccess });
    } else {
      createItem.mutate({ data }, { onSuccess });
    }
  };

  return (
    <div className="space-y-4">
      <div><Label className="text-sm mb-1.5 block">Name *</Label><Input value={name} onChange={e => setName(e.target.value)} data-testid="input-item-name" /></div>
      <div><Label className="text-sm mb-1.5 block">Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} data-testid="input-item-description" /></div>
      <div><Label className="text-sm mb-1.5 block">Price ($) *</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" data-testid="input-item-price" /></div>
      <ImageUpload value={image} onChange={setImage} />
      <div>
        <Label className="text-sm mb-1.5 block">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2"><Switch checked={available} onCheckedChange={setAvailable} /><Label className="text-sm">Available</Label></div>
      <Button className="w-full" onClick={handleSubmit} disabled={createItem.isPending || updateItem.isPending} data-testid="button-save-menu-item">
        {createItem.isPending || updateItem.isPending ? "Saving..." : item ? "Update item" : "Add item"}
      </Button>
    </div>
  );
}

function RestaurantSetupForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const createRestaurant = useCreateRestaurant();
  const { toast } = useToast();

  const handleSubmit = () => {
    createRestaurant.mutate({ data: { name, address, phone: phone || undefined } }, {
      onSuccess, onError: () => toast({ title: "Failed to create restaurant", variant: "destructive" })
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-foreground">Set Up Your Restaurant</h2>
      <div><Label className="text-sm mb-1.5 block">Restaurant Name</Label><Input value={name} onChange={e => setName(e.target.value)} data-testid="input-restaurant-name" /></div>
      <div><Label className="text-sm mb-1.5 block">Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} data-testid="input-restaurant-address" /></div>
      <div><Label className="text-sm mb-1.5 block">Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} data-testid="input-restaurant-phone" /></div>
      <Button className="w-full" onClick={handleSubmit} disabled={createRestaurant.isPending} data-testid="button-create-restaurant">
        {createRestaurant.isPending ? "Creating..." : "Create Restaurant"}
      </Button>
    </div>
  );
}

export default function OwnerMenu() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: restaurant, isLoading } = useGetMyRestaurant({ query: { enabled: !!user } });
  const { data: categories } = useListCategories();
  const deleteItem = useDeleteMenuItem();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetMyRestaurantQueryKey() });
    setDialogOpen(false);
    setEditItem(null);
    toast({ title: "Menu updated" });
  };

  const handleDelete = (id: number) => {
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyRestaurantQueryKey() });
        toast({ title: "Item deleted" });
      },
    });
  };

  if (isLoading) return <AppLayout><div className="max-w-4xl mx-auto px-4 py-8 space-y-4"><Skeleton className="h-8 w-48" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div></AppLayout>;

  if (!restaurant) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-12">
          <RestaurantSetupForm onSuccess={() => queryClient.invalidateQueries({ queryKey: getGetMyRestaurantQueryKey() })} />
        </div>
      </AppLayout>
    );
  }

  const grouped = restaurant.menuItems?.reduce((acc: Record<string, any[]>, item: any) => {
    const key = item.categoryName || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}) || {};

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
            <p className="text-sm text-muted-foreground">{restaurant.name}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-menu-item"><Plus size={17} className="mr-1" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
              </DialogHeader>
              <MenuItemForm item={editItem} restaurantId={restaurant.id} categories={categories} onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {restaurant.menuItems?.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-4">No menu items yet</p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-item"><Plus size={16} className="mr-1" /> Add your first item</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-base font-semibold text-foreground mb-3">{category}</h2>
                <div className="space-y-3">
                  {(items as any[]).map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 bg-card border border-card-border rounded-xl p-4"
                      data-testid={`card-menu-item-${item.id}`}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <ImageIcon size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                        <p className="text-primary font-bold mt-1">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.available ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {item.available ? "Available" : "Unavailable"}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setDialogOpen(true); }} data-testid={`button-edit-item-${item.id}`}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive" data-testid={`button-delete-item-${item.id}`}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
