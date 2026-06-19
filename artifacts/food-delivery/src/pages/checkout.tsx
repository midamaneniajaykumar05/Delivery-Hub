import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetCart, useCreateOrder, useCreatePaymentIntent, useConfirmPayment, getGetCartQueryKey, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, CreditCard, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Checkout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"order" | "payment" | "done">("order");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/27");
  const [cvv, setCvv] = useState("123");
  const [address, setAddress] = useState("");

  const { data: cart } = useGetCart({ query: { enabled: !!user } });
  const createOrder = useCreateOrder();
  const createPaymentIntent = useCreatePaymentIntent();
  const confirmPayment = useConfirmPayment();

  const handlePlaceOrder = () => {
    if (!cart?.restaurantId) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    createOrder.mutate({ data: { restaurantId: cart.restaurantId, deliveryAddress: address || undefined } }, {
      onSuccess: (order) => {
        setOrderId(order.id);
        setStep("payment");
      },
      onError: () => toast({ title: "Failed to create order", variant: "destructive" }),
    });
  };

  const handlePayment = () => {
    if (!orderId) return;
    createPaymentIntent.mutate({ data: { orderId } }, {
      onSuccess: (intent) => {
        const fakePaymentIntentId = `pi_${Date.now()}_simulated`;
        confirmPayment.mutate({ data: { orderId, paymentIntentId: fakePaymentIntentId } }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            setStep("done");
            toast({ title: "Payment successful!", description: "Your order is now being processed." });
          },
          onError: () => toast({ title: "Payment failed", variant: "destructive" }),
        });
      },
      onError: () => toast({ title: "Failed to initiate payment", variant: "destructive" }),
    });
  };

  if (!cart || cart.items.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center text-muted-foreground">
          <p>Your cart is empty. Add items before checking out.</p>
          <Button className="mt-4" onClick={() => setLocation("/restaurants")}>Browse restaurants</Button>
        </div>
      </AppLayout>
    );
  }

  if (step === "done") {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-green-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-6">Your payment was successful. The restaurant is being notified.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/orders")} data-testid="button-view-orders">View my orders</Button>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">Continue shopping</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-foreground font-medium">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${cart.total.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>$2.99</span></div>
              <div className="flex justify-between font-bold text-foreground text-base pt-1"><span>Total</span><span>${(cart.total + 2.99).toFixed(2)}</span></div>
            </div>

            {step === "order" && (
              <div className="mt-4">
                <Label className="text-sm mb-1.5 block">Delivery address</Label>
                <Input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="mb-3"
                  data-testid="input-delivery-address"
                />
                <Button className="w-full" onClick={handlePlaceOrder} disabled={createOrder.isPending} data-testid="button-place-order">
                  {createOrder.isPending ? "Placing order..." : "Place Order"}
                </Button>
              </div>
            )}
          </div>

          {/* Payment Form */}
          {step === "payment" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-card-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-5">
                <CreditCard size={20} className="text-primary" />
                <h2 className="font-semibold text-foreground">Payment Details</h2>
                <Lock size={14} className="text-muted-foreground ml-auto" />
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-1.5 block">Card Number</Label>
                  <Input
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="font-mono"
                    data-testid="input-card-number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm mb-1.5 block">Expiry</Label>
                    <Input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" data-testid="input-card-expiry" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">CVV</Label>
                    <Input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" data-testid="input-card-cvv" />
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mb-4">
                Test mode: use any values above to simulate payment
              </div>

              <Button
                className="w-full h-12"
                onClick={handlePayment}
                disabled={createPaymentIntent.isPending || confirmPayment.isPending}
                data-testid="button-confirm-payment"
              >
                {createPaymentIntent.isPending || confirmPayment.isPending
                  ? "Processing..."
                  : `Pay $${(cart.total + 2.99).toFixed(2)}`}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
