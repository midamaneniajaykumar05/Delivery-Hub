import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Restaurants from "@/pages/restaurants";
import RestaurantDetail from "@/pages/restaurant-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import OwnerDashboard from "@/pages/owner/dashboard";
import OwnerMenu from "@/pages/owner/menu";
import OwnerOrders from "@/pages/owner/orders";
import OwnerAnalytics from "@/pages/owner/analytics";
import DeliveryDashboard from "@/pages/delivery/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminRestaurants from "@/pages/admin/restaurants";
import AdminAnalytics from "@/pages/admin/analytics";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/restaurants/:id" component={RestaurantDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetail} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/owner/dashboard" component={OwnerDashboard} />
      <Route path="/owner/menu" component={OwnerMenu} />
      <Route path="/owner/orders" component={OwnerOrders} />
      <Route path="/owner/analytics" component={OwnerAnalytics} />
      <Route path="/delivery/dashboard" component={DeliveryDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/restaurants" component={AdminRestaurants} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
