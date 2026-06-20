import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Star, Search, Trash2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AdminReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
  restaurantName: string;
  restaurantId: number;
  userId: number;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={13} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    if (!token) return;
    fetch("/api/admin/reviews", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setReviews(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeleting(null);
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id));
      toast({ title: "Review deleted" });
    } else {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const filtered = reviews.filter(r =>
    r.userName.toLowerCase().includes(search.toLowerCase()) ||
    r.restaurantName.toLowerCase().includes(search.toLowerCase()) ||
    (r.comment || "").toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({ r, count: reviews.filter(rv => rv.rating === r).length }));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <MessageSquare size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reviews Moderation</h1>
            <p className="text-sm text-muted-foreground">Manage customer reviews across all restaurants</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-3xl font-bold text-foreground">{reviews.length}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
              <div className="ml-auto text-right">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <Star size={18} className="text-amber-400 fill-amber-400" />
                  <span className="text-xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Platform average</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-2">RATING DISTRIBUTION</p>
            <div className="space-y-1">
              {ratingDist.map(({ r, count }) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="text-xs w-4 text-muted-foreground">{r}★</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-4">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by customer, restaurant, or content..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card rounded-2xl border border-card-border animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card border border-card-border rounded-2xl p-5 flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <StarRow rating={review.rating} />
                    <Badge variant="outline" className="text-xs">{review.restaurantName}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">by <strong className="text-foreground">{review.userName}</strong></p>
                  {review.comment ? (
                    <p className="text-sm text-foreground">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No comment</p>
                  )}
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 h-8 w-8 p-0"
                  disabled={deleting === review.id}
                  onClick={() => handleDelete(review.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
