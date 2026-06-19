# FoodFleet 🍔

A production-ready full-stack food delivery web application built with React, Node.js, and PostgreSQL. Supports four user roles: Customer, Restaurant Owner, Delivery Partner, and Admin.

---

## 🚀 Live Demo

Deployed on Replit — see the app running at your Replit deployment URL.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Node.js, Express 5, Pino logging |
| Database | PostgreSQL, Drizzle ORM |
| Auth | JWT (HS256), bcryptjs |
| API Contract | OpenAPI 3.0 → Orval codegen (React Query hooks + Zod schemas) |
| Charts | Recharts |
| Routing | Wouter v3 |
| Package Manager | pnpm workspaces (monorepo) |

---

## 📁 Project Structure

```
├── artifacts/
│   ├── api-server/          # Express API server (port 8080)
│   │   └── src/
│   │       ├── routes/      # auth, restaurants, menu, cart, orders,
│   │       │                  payments, reviews, notifications,
│   │       │                  analytics, delivery, admin
│   │       └── middlewares/ # JWT auth middleware
│   └── food-delivery/       # React + Vite frontend
│       └── src/
│           ├── pages/       # All page components
│           ├── components/  # Layout, UI components
│           └── hooks/       # useAuth, custom hooks
├── lib/
│   ├── db/                  # Drizzle ORM schema + migrations
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   └── api-client-react/    # Generated React Query hooks
└── scripts/                 # Utility scripts
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 24+
- pnpm 9+
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Fill in DATABASE_URL and SESSION_SECRET

# Push database schema
pnpm --filter @workspace/db run push

# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend (in a new terminal)
pnpm --filter @workspace/food-delivery run dev
```

### Useful Commands

```bash
# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Full typecheck
pnpm run typecheck

# Build all packages
pnpm run build
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | All users (customers, owners, delivery, admin) |
| `restaurants` | Restaurant profiles |
| `categories` | Food categories |
| `menu_items` | Menu items per restaurant |
| `carts` | Customer carts |
| `cart_items` | Items in cart |
| `orders` | Order records |
| `order_items` | Items per order |
| `payments` | Payment records (simulated) |
| `reviews` | Customer reviews |
| `notifications` | In-app notifications |
| `delivery_partners` | Delivery partner profiles |

---

## 👥 User Roles & Features

### Customer
- Browse restaurants and menus
- Add items to cart
- Place orders with simulated payment
- Track order status in real time
- Write reviews and ratings
- Receive notifications

### Restaurant Owner
- Manage menu items (add, edit, delete)
- View and update incoming orders
- Revenue and order analytics dashboard

### Delivery Partner
- View available deliveries
- Accept and update delivery status

### Admin
- Manage all users and restaurants
- Platform-wide analytics and reporting

---

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foodfleet.com | admin123 |
| Customer | customer@test.com | test123 |
| Delivery Partner | delivery@test.com | test123 |
| Owner – Pizza Palace | marco@pizzapalace.com | pass123 |
| Owner – Classic Burgers | sarah@burgerking.com | pass123 |
| Owner – Spice House | raj@spicehouse.com | pass123 |
| Owner – Sakura Sushi | yuki@sakurasushi.com | pass123 |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | List all restaurants |
| GET | `/api/restaurants/:id` | Get restaurant details |
| POST | `/api/restaurants` | Create restaurant (owner) |
| PUT | `/api/restaurants/:id` | Update restaurant (owner) |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu/:restaurantId` | Get menu for restaurant |
| POST | `/api/menu` | Add menu item (owner) |
| PUT | `/api/menu/:id` | Update menu item (owner) |
| DELETE | `/api/menu/:id` | Delete menu item (owner) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List user orders |
| GET | `/api/orders/:id` | Get order details |
| POST | `/api/orders` | Place new order |
| PUT | `/api/orders/:id/status` | Update order status |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/initiate` | Initiate payment |
| POST | `/api/payments/confirm` | Confirm payment |

### Other
- `GET/POST /api/cart` — Cart management
- `GET/POST /api/reviews` — Reviews
- `GET /api/notifications` — Notifications
- `GET /api/analytics/*` — Analytics (owner/admin)
- `GET /api/delivery/*` — Delivery partner routes
- `GET /api/admin/*` — Admin routes

---

## 🎨 Design

- **Color theme:** Amber/saffron primary color
- **Dark mode:** Not yet implemented
- **Responsive:** Mobile-first with sidebar nav on desktop, bottom nav on mobile

---

## 📝 License

MIT
