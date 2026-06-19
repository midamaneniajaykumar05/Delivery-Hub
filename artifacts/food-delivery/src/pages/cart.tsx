import { AppLayout } from "@/components/layout";
import { useGetCart, useRemoveFromCart, useClearCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export default function Cart() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({ query: { enabled: !!user } });
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();

  const handleRemove = (itemId: number, name: string) => {
    removeFromCart.mutate({ itemId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: `${name} removed from cart` });
      },
    });
  };

  const handleClear = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Cart cleared" });
      },
    });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-4">Sign in to view your cart</p>
          <Link href="/login"><Button>Sign in</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Your Cart</h1>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={56} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-6">Add some delicious items from a restaurant</p>
            <Link href="/restaurants"><Button>Browse restaurants</Button></Link>
          </div>
        ) : (
          <div>
            {cart.restaurantName && (
              <div className="mb-4 px-4 py-2 bg-primary/10 rounded-lg text-sm text-primary font-medium">
                From: {cart.restaurantName}
              </div>
            )}
            <div className="space-y-3 mb-6">
              {cart.items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 bg-card border border-card-border rounded-xl p-4"
                  data-testid={`card-cart-item-${item.id}`}
                >
                  {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-primary font-bold">${item.subtotal.toFixed(2)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id, item.name)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    data-testid={`button-remove-cart-item-${item.id}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery fee</span><span>$2.99</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground text-lg">
                <span>Total</span><span>${(cart.total + 2.99).toFixed(2)}</span>
              </div>
              <Button
                className="w-full h-12 text-base"
                onClick={() => setLocation("/checkout")}
                data-testid="button-proceed-checkout"
              >
                Proceed to Checkout <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button variant="outline" className="w-full" onClick={handleClear} data-testid="button-clear-cart">
                Clear cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
