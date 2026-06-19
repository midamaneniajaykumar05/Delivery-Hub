import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications } from "@workspace/api-client-react";
import { ShoppingCart, Bell, User, LogOut, ChefHat, Bike, LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3, Users, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem { href: string; label: string; icon: React.ReactNode }

function getNavItems(role: string): NavItem[] {
  if (role === "restaurant_owner") return [
    { href: "/owner/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/owner/menu", label: "Menu", icon: <UtensilsCrossed size={18} /> },
    { href: "/owner/orders", label: "Orders", icon: <ClipboardList size={18} /> },
    { href: "/owner/analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
  ];
  if (role === "delivery_partner") return [
    { href: "/delivery/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  ];
  if (role === "admin") return [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/admin/users", label: "Users", icon: <Users size={18} /> },
    { href: "/admin/restaurants", label: "Restaurants", icon: <Store size={18} /> },
    { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
  ];
  return [
    { href: "/", label: "Home", icon: <ChefHat size={18} /> },
    { href: "/restaurants", label: "Restaurants", icon: <UtensilsCrossed size={18} /> },
    { href: "/orders", label: "My Orders", icon: <ClipboardList size={18} /> },
  ];
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { data: notifications } = useListNotifications({ query: { enabled: !!user } });
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <GuestNav />
        <main>{children}</main>
      </div>
    );
  }

  const navItems = getNavItems(user.role);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 z-50 border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ChefHat size={16} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">FoodFleet</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location === item.href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {user.role === "customer" && (
            <Link href="/cart" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location === "/cart"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}>
              <ShoppingCart size={18} />
              Cart
            </Link>
          )}
          <Link href="/notifications" className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
            location === "/notifications"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}>
            <Bell size={18} />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-auto h-5 min-w-5 px-1 text-xs bg-destructive text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Link>
          <Link href="/profile" className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            location === "/profile"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}>
            <User size={18} />
            Profile
          </Link>
          <button
            onClick={logout}
            data-testid="button-logout"
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-sidebar-foreground">
          <ChefHat size={20} className="text-primary" />
          FoodFleet
        </Link>
        <div className="flex items-center gap-2">
          {user.role === "customer" && (
            <Link href="/cart"><ShoppingCart size={20} className="text-sidebar-foreground" /></Link>
          )}
          <Link href="/notifications" className="relative">
            <Bell size={20} className="text-sidebar-foreground" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">{unreadCount}</span>}
          </Link>
          <button onClick={logout}><LogOut size={20} className="text-sidebar-foreground" /></button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-sidebar border-t border-sidebar-border flex justify-around py-2">
        {navItems.slice(0, 4).map(item => (
          <Link key={item.href} href={item.href} className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-xs",
            location === item.href ? "text-primary" : "text-muted-foreground"
          )}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <main className="flex-1 md:ml-60 md:p-0">
        <div className="md:p-0 pt-14 pb-20 md:pb-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

function GuestNav() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ChefHat size={16} className="text-primary-foreground" />
          </div>
          <span className="text-foreground">FoodFleet</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" data-testid="link-login">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" data-testid="link-register">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
