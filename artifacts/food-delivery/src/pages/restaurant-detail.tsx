import { useRoute } from "wouter";
import { AppLayout } from "@/components/layout";
import { useGetRestaurant, useListReviews, useAddToCart, useGetCart, getGetCartQueryKey, getGetRestaurantQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Star, MapPin, Plus, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function RestaurantDetail() {
  const [, params] = useRoute("/restaurants/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useGetRestaurant(id, {
    query: { enabled: !!id, queryKey: getGetRestaurantQueryKey(id) }
  });
  const { data: reviews } = useListReviews({ restaurantId: id });
  const addToCart = useAddToCart();

  const handleAddToCart = (menuItemId: number, name: string) => {
    if (!user) { toast({ title: "Please sign in to add items to cart", variant: "destructive" }); return; }
    addToCart.mutate({ data: { menuItemId, quantity: 1 } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: `${name} added to cart` });
      },
      onError: () => toast({ title: "Could not add item", variant: "destructive" }),
    });
  };

  // Group menu items by category
  const grouped = restaurant?.menuItems?.reduce((acc: Record<string, any[]>, item) => {
    const key = item.categoryName || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-56 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-1/2 mb-3" />
          <Skeleton className="h-4 w-3/4 mb-8" />
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full mb-3 rounded-xl" />)}
        </div>
      </AppLayout>
    );
  }

  if (!restaurant) return <AppLayout><div className="p-8 text-center text-muted-foreground">Restaurant not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="relative h-56 rounded-2xl overflow-hidden bg-muted mb-6">
          {restaurant.image ? (
            <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-5 text-white">
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
              <span className="flex items-center gap-1"><MapPin size={14} />{restaurant.address}</span>
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-primary text-primary" />
                {restaurant.avgRating?.toFixed(1) || "New"}
                {restaurant.totalReviews! > 0 && ` (${restaurant.totalReviews} reviews)`}
              </span>
            </div>
          </div>
          {user?.role === "customer" && (
            <Link href="/cart" className="absolute top-4 right-4 bg-white/90 backdrop-blur text-foreground px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-white transition-colors">
                <ShoppingCart size={15} /> View cart
              </Link>
          )}
        </div>

        {/* Menu */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                {category}
                <span className="text-xs font-normal text-muted-foreground">({items.length} items)</span>
              </h2>
              <div className="space-y-3">
                {items.filter(i => i.available).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex gap-4 bg-card border border-card-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                    data-testid={`card-menu-item-${item.id}`}
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-card-foreground">{item.name}</h3>
                      {item.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                      <p className="text-primary font-bold mt-2">${item.price.toFixed(2)}</p>
                    </div>
                    {user?.role === "customer" && (
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item.id, item.name)}
                        disabled={addToCart.isPending}
                        className="shrink-0 self-center"
                        data-testid={`button-add-to-cart-${item.id}`}
                      >
                        <Plus size={15} />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-foreground mb-4">Reviews</h2>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-card border border-card-border rounded-xl p-4" data-testid={`card-review-${review.id}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{review.userName}</span>
                    <div className="flex">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={13} className="fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
