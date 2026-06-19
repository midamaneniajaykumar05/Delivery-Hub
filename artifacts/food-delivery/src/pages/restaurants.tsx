import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useListRestaurants, useListCategories, getListRestaurantsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Restaurants() {
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useListRestaurants(
    { search: search || undefined, page, limit },
    { query: { queryKey: getListRestaurantsQueryKey({ search: search || undefined, page, limit }) } }
  );
  const { data: categories } = useListCategories();

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const handleSearch = () => { setSearch(inputValue); setPage(1); };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">All Restaurants</h1>
          <p className="text-muted-foreground text-sm">{data?.total || 0} restaurants available</p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search restaurants..."
            className="h-11"
            data-testid="input-search-restaurants"
          />
          <Button onClick={handleSearch} className="h-11 px-5" data-testid="button-search-restaurants">
            <Search size={17} />
          </Button>
        </div>

        {/* Categories */}
        {categories && (
          <div className="flex gap-2 flex-wrap mb-8">
            <Badge
              variant={!search ? "default" : "secondary"}
              className="cursor-pointer px-3 py-1"
              onClick={() => { setSearch(""); setInputValue(""); }}
              data-testid="badge-all-categories"
            >
              All
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat.id}
                variant="secondary"
                className="cursor-pointer px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                data-testid={`badge-category-${cat.id}`}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data?.data.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/restaurants/${r.id}`} data-testid={`card-restaurant-${r.id}`} className="block group rounded-2xl overflow-hidden bg-card border border-card-border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {r.image ? (
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
                          <span className="text-5xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-card-foreground">{r.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
                        <MapPin size={13} /><span className="truncate">{r.address}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={14} className="fill-primary text-primary" />
                        <span className="text-sm font-medium">{r.avgRating?.toFixed(1) || "New"}</span>
                        {r.totalReviews! > 0 && <span className="text-xs text-muted-foreground">({r.totalReviews})</span>}
                      </div>
                    </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && data?.data.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No restaurants found{search ? ` for "${search}"` : ""}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
              <ChevronLeft size={16} /> Prev
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
              Next <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
