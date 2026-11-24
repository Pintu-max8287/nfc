# Product Requirements Document (PRD)
## Project Name: DineFlow (Multi-Tenant Smart QR Restaurant Ordering SaaS)

### 1. Executive Summary
A multi-tenant, Vercel-hosted SaaS platform that allows multiple restaurants to run end-to-end QR-based dine-in ordering, live kitchen displays (KDS), automated billing, WhatsApp/daily report alerts, and dual customer reviews from a single web application.

### 2. Tech Stack (Vercel-Optimized & Serverless)
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS + Lucide React Icons
- **Database:** PostgreSQL (Neon or Supabase free tier — zero local filesystem writes)
- **ORM:** Prisma ORM
- **Authentication:** Custom JWT stored in HTTP-Only Cookies (`jose` + `bcryptjs`), strictly role-based and tenant-isolated
- **Real-Time Sync:** SWR auto-polling (3–5s intervals) across KDS, Customer Tracker, and Owner Dashboard (100% Vercel Serverless compatible)
- **Utilities:** `qrcode.react` (printable table QRs), `recharts` (Daily Sales bar chart), `zod` (API validation)

### 3. User Roles & Multi-Tenant Routing
1. **Super Admin (`/super-admin`)**
   - Protected by Super Admin credentials (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` seeded in DB).
   - Creates, edits, suspends, or activates multiple restaurants on one platform.
   - Assigns unique URL slug (`/[slug]`), restaurant details (name, logo URL, address, currency, tax %, Wi-Fi SSID/password, Google Review URL, WhatsApp number), and creates/resets each restaurant's Admin login credentials.
   - Views platform-wide stats (total restaurants, active orders, total GMV).

2. **Restaurant Admin / Owner (`/[slug]/admin`)**
   - Secure login at `/admin/login` (strictly isolated to their assigned `restaurantId`).
   - Sidebar modules: Overview KPIs, Menu, Prices (inline edit), Availability & Stock (toggle + portion count), Tables (add tables + download/print unique QR codes), Live Orders, Staff (add/manage kitchen/waiter accounts), Sales Analytics, Reviews, Automation & Settings.

3. **Kitchen Staff (`/[slug]/kitchen`)**
   - Protected by Restaurant Admin or Kitchen Staff credentials.
   - 3-column live Kanban board: `NEW` → `PREPARING` → `READY` (plus `SERVED` archive).
   - Displays Order ID, Table Badge (e.g., `T05`), itemized quantities, special notes, and live elapsed timer.
   - Live alert banner for incoming "Request Waiter" and "Request Bill" pings from tables.

4. **Dine-In Customer (`/[slug]/table/[tableNumber]`)**
   - Zero login / zero app install. Scanning a table's QR opens the web app pre-bound to that restaurant and table.
   - **Home Screen:** Active Table badge, primary "View Menu" CTA, and 4 quick-action tiles: `Request Waiter`, `WiFi`, `Request Bill`, `Reviews`.
   - **Digital Menu:** Category tabs (`Starters`, `Mains`, `Drinks`, `Desserts`), search, dish cards with images/prices/`+` quick-add, Dish Detail bottom-sheet modal (full description, prep time, spice/dietary tags, Add to Cart), floating cart + sticky bottom bar.
   - **Live Order Tracking:** Order number, preparation countdown bar, 4-stage live progress stepper (`Order Received` → `Preparing` → `Ready` → `Served`).
   - **Utility Services:** One-tap "Request Waiter" alert + Wi-Fi details card with one-tap Copy Password button.
   - **Digital Billing & Payments:** Live itemized bill (Subtotal, configurable Tax %, Grand Total), "Request Bill" trigger, 3 payment options (`Online Payment` simulated/UPI-ready, `Cash at Table`, `Pay at Counter`), and Payment Successful screen.
   - **Dual Review System:** 1–5 star rating, quick compliment chips (`Tasty food`, `Fast service`, `Great ambience`, `Clean tables`), optional comment → publishes to restaurant's Website Reviews feed + displays Thank-You screen with direct "Review on Google" redirect button.

### 4. Automation & Notification System
- **WhatsApp Notification Engine:** Modular webhook/provider service (`lib/notifications.ts`) supporting Meta WhatsApp Cloud API / Twilio via environment variables, plus an Admin Notification Log viewer so alerts are testable even without paid API keys.
- **Triggers:**
  1. New Order Received (Order #, Table #, Total).
  2. Low-Stock Alert (fires automatically when an item's `stockCount` drops to or below `lowStockThreshold`, e.g., 4 portions left).
  3. Automated Daily Sales Report (Vercel Cron endpoint `/api/cron/daily-report` + manual "Generate & Send EOD Report" button in Admin).

### 5. Security Requirements
- Passwords hashed with `bcryptjs` (salt rounds: 10).
- JWT signed with `JWT_SECRET` using `jose`, stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- Next.js `middleware.ts` enforces role + tenant slug verification on `/super-admin`, `/[slug]/admin`, and `/[slug]/kitchen`.
- All API routes validate `restaurantId` ownership on the server—never trust client-sent tenant IDs.