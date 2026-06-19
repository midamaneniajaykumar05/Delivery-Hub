# FoodFleet

A production-ready food delivery web app connecting customers, restaurant owners, delivery partners, and admins.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Recharts
- API: Express 5 + Pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (HS256), `food_token` / `food_user` in localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Routing: Wouter v3 (do NOT nest `<a>` inside `<Link>` — use className prop directly on `<Link>`)

## Where things live

- `artifacts/api-server/src/routes/` — all Express routers (auth, restaurants, menu, cart, orders, payments, reviews, notifications, analytics, delivery, admin)
- `artifacts/food-delivery/src/pages/` — all React pages
- `artifacts/food-delivery/src/components/layout.tsx` — sidebar/nav layout
- `artifacts/food-delivery/src/hooks/use-auth.tsx` — auth context
- `lib/db/src/schema/` — Drizzle schema (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/` — generated React Query hooks + Zod schemas

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks. Always run codegen after spec changes.
- JWT auth injected via `setAuthTokenGetter` from `@workspace/api-client-react/custom-fetch` — the custom fetch intercepts all API calls.
- Payments are simulated (no real Stripe key); the `/api/payments` routes simulate the full checkout flow.
- Real-time notifications use polling (no WebSockets) — `useListNotifications` refetches on focus.
- Wouter v3's `<Link>` renders as `<a>` — never nest another `<a>` inside `<Link>`.

## Product

- **Customer**: Browse restaurants, view menus, add to cart, checkout (simulated payment), track orders, write reviews, get notifications.
- **Restaurant Owner**: Manage menu items, view and update incoming orders, see revenue/order analytics.
- **Delivery Partner**: View available/assigned deliveries, update delivery status.
- **Admin**: Manage all users and restaurants, view platform-wide analytics.

## Test accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foodfleet.com | admin123 |
| Customer | customer@test.com | test123 |
| Delivery | delivery@test.com | test123 |
| Owner (Pizza Palace) | marco@pizzapalace.com | pass123 |
| Owner (Classic Burgers) | sarah@burgerking.com | pass123 |
| Owner (Spice House) | raj@spicehouse.com | pass123 |
| Owner (Sakura Sushi) | yuki@sakurasushi.com | pass123 |

## User preferences

- Keep the amber/saffron color theme consistent across all pages.

## Gotchas

- Do NOT nest `<a>` inside Wouter `<Link>` — pass className directly to `<Link>`.
- `useRemoveFromCart` mutate signature: `{ itemId: number }`. `useClearCart` takes `void`.
- Do NOT run `pnpm dev` at workspace root — use `restart_workflow` instead.
- `lib/api-client-react` must export `./custom-fetch` in its `exports` field for Vite to resolve it.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
