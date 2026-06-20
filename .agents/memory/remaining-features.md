---
name: FoodFleet remaining features status
description: What was built and what still needs environment variable configuration to work end-to-end.
---

## Built and working (no config needed)
- Simulated payment flow at /checkout (fallback when Razorpay keys absent)
- Payment history page at /payment-history (requires login as customer)
- Admin: Payments at /admin/payments, Reviews at /admin/reviews, Delivery Partners at /admin/delivery-partners
- Food image upload: POST /api/upload/image (multer), owner menu now has drag-drop file upload
- WebSocket real-time: server at /ws, frontend hook useRealtimeNotifications auto-connects on login
- Swagger UI at /api/docs (serves openapi.yaml)
- Docker: Dockerfile.api, Dockerfile.web, docker-compose.yml, nginx.conf, .env.example
- Order reject: already existed as "Cancel" button in owner/orders.tsx

## Requires environment variable configuration
- **Razorpay**: set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET → checkout auto-switches to Razorpay widget
- **Email notifications**: set GMAIL_USER + GMAIL_APP_PASSWORD (App Password, not Gmail password)
- **FRONTEND_URL**: set to production domain for email links to work

**Why:** These services require external accounts and credentials. The code gracefully falls back (simulated payments, silent email skip) when vars are absent.

**How to apply:** All vars documented in .env.example at project root.
