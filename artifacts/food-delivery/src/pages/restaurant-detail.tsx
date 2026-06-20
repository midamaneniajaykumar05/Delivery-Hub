import { useState } from "react";
import { useRoute } from "wouter";
import { AppLayout } from "@/components/layout";
import {
  useGetRestaurant, useListReviews, useAddToCart, useCreateReview,
  getGetCartQueryKey, getGetRestaurantQueryKey, getListReviewsQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Star, MapPin, Plus, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            size={24}
            className={cn(
              "transition-colors",
              n <= (hovered || value) ? "fill-primary text-primary" : "text-border fill-border"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function RestaurantDetail() {
  const [, params] = useRoute("/restaurants/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: restaurant, isLoading } = useGetRestaurant(id, {
    query: { enabled: !!id, queryKey: getGetRestaurantQueryKey(id) }
  });
  const { data: reviews, refetch: refetchReviews } = useListReviews({ restaurantId: id });
  const addToCart = useAddToCart();
  const createReview = useCreateReview();

  const handleAddToCart = (menuItemId: number, name: string) => {
    if (!user) { toast({ title: "Please sign in to add items to cart", variant: "destructive" }); return; }
    addToCart.mutate({ data: { menuItemId, quantity: 1 } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: `${name} added to cart ✓` });
      },
      onError: () => toast({ title: "Could not add item", variant: "destructive" }),
    });
  };

  const handleSubmitReview = () => {
    if (!rating) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    createReview.mutate({ data: { restaurantId: id, rating, comment: comment.trim() || undefined } }, {
      onSuccess: () => {
        toast({ title: "Review submitted! Thank you." });
        setComment("");
        setRating(5);
        setShowReviewForm(false);
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ restaurantId: id }) });
        queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(id) });
        refetchReviews();
      },
      onError: () => toast({ title: "Could not submit review", variant: "destructive" }),
    });
  };

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

        {/* Reviews Section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">
              Reviews {reviews && reviews.length > 0 && <span className="text-muted-foreground font-normal text-sm">({reviews.length})</span>}
            </h2>
            {user?.role === "customer" && !showReviewForm && (
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && user?.role === "customer" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-card-border rounded-2xl p-5 mb-5"
            >
              <h3 className="font-semibold text-foreground mb-4">Your Review</h3>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Rating</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Comment (optional)</p>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell others about your experience..."
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  disabled={createReview.isPending}
                  className="flex-1"
                >
                  {createReview.isPending ? "Submitting..." : "Submit Review"}
                </Button>
                <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}

          {/* Reviews List */}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-card-border rounded-xl p-4"
                  data-testid={`card-review-${review.id}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {review.userName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{review.userName}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={12}
                            className={idx < review.rating ? "fill-primary text-primary" : "fill-border text-border"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card border border-card-border rounded-2xl">
              <Star size={32} className="mx-auto mb-2 text-border" />
              <p className="text-sm">No reviews yet. Be the first!</p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
