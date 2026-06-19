import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useListRestaurants, useListCategories } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, MapPin, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

function RestaurantCard({ restaurant }: { restaurant: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/restaurants/${restaurant.id}`} data-testid={`card-restaurant-${restaurant.id}`} className="block group rounded-2xl overflow-hidden bg-card border border-card-border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
          <div className="relative h-44 bg-muted overflow-hidden">
            {restaurant.image ? (
              <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
                <span className="text-4xl">🍽️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-card-foreground text-base leading-tight">{restaurant.name}</h3>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
              <MapPin size={13} />
              <span className="truncate">{restaurant.address}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-primary text-primary" />
                <span className="text-sm font-medium">{restaurant.avgRating?.toFixed(1) || "New"}</span>
                {restaurant.totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground">({restaurant.totalReviews})</span>
                )}
              </div>
              <span className="text-xs text-primary font-medium flex items-center gap-1">View menu <ChevronRight size={12} /></span>
            </div>
          </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { data: restaurantsData, isLoading } = useListRestaurants({ search: search || undefined, limit: 8 });
  const { data: categories } = useListCategories();

  if (user && user.role !== "customer") {
    const redirectMap: Record<string, string> = {
      restaurant_owner: "/owner/dashboard",
      delivery_partner: "/delivery/dashboard",
      admin: "/admin/dashboard",
    };
    setLocation(redirectMap[user.role] || "/");
    return null;
  }

  const handleSearch = () => setSearch(inputValue);

  return (
    <AppLayout>
      <div>
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
            <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            >
              Delicious food,<br />delivered fast
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-primary-foreground/80 mb-8"
            >
              Order from the best local restaurants with fast, reliable delivery
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 max-w-xl mx-auto"
            >
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search restaurants or cuisines..."
                className="bg-white/20 border-white/30 placeholder:text-white/60 text-white h-12 text-base backdrop-blur"
                data-testid="input-search-hero"
              />
              <Button
                onClick={handleSearch}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shrink-0"
                data-testid="button-search-hero"
              >
                <Search size={18} />
              </Button>
            </motion.div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Categories */}
          {categories && categories.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Browse by category</h2>
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    className="cursor-pointer px-4 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                    data-testid={`badge-category-${cat.id}`}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Restaurants */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {search ? `Results for "${search}"` : "Popular restaurants"}
              </h2>
              <Link href="/restaurants" className="text-sm text-primary font-medium flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-border">
                    <Skeleton className="h-44 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {restaurantsData?.data.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
              </div>
            )}

            {!isLoading && restaurantsData?.data.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No restaurants found{search ? ` for "${search}"` : ""}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
