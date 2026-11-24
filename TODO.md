# Project Master TODO Checklist

## Phase 1: Setup, Theme & Database
- [x] Initialize Next.js 15 (App Router, TypeScript, Tailwind CSS)
- [x] Configure color tokens (`#FDFBD4`, `#C05800`, `#713600`, `#38240D`) & fonts
- [x] Set up Prisma schema for Multi-Tenant PostgreSQL models
- [x] Create `prisma/seed.ts` (Super Admin + 1 demo restaurant with tables & menu)
- [x] Verify `npm run build` passes

## Phase 2: Auth & Super Admin Panel
- [x] Build JWT cookie auth helpers (`lib/auth.ts`) & `middleware.ts`
- [x] Build `/super-admin/login` and `/super-admin` dashboard
- [x] Implement CRUD for Restaurants (create slug, details, admin credentials, toggle active/suspended)
- [x] Build unified `/admin/login` routing Restaurant Admins & Kitchen Staff to their tenant slug

## Phase 3: Restaurant Admin Dashboard
- [x] Build `/[slug]/admin` shell with `#38240D` sidebar & KPI overview
- [x] Menu Manager: Create/Edit/Delete categories & dishes (prep time, tags, images)
- [x] Quick Price Editor (inline price updates) & Stock/Availability toggles + portion counts
- [x] Table Manager + Printable QR Code Generator (`qrcode.react`)
- [x] Staff Manager (create Kitchen / Waiter accounts) & Restaurant Settings (Wi-Fi, Tax %, Google Review URL, WhatsApp)

## Phase 4: Customer QR Experience
- [x] Build `/[slug]/table/[tableNumber]` Home Dashboard (Table badge, View Menu, 4 quick actions)
- [x] Build Categorized Menu, Dish Detail Modal, Cart Context, and Order Placement API
- [x] Build Live 4-Stage Order Tracker (`/[slug]/table/[tableNumber]/track/[orderId]`)
- [x] Build Request Waiter alert trigger + Wi-Fi Modal with Copy to Clipboard

## Phase 5: Live Kitchen Display System (KDS)
- [x] Build `/[slug]/kitchen` 3-column Kanban (`NEW`, `PREPARING`, `READY`)
- [x] Add live elapsed timers per ticket and 1-click status progression
- [x] Add live Waiter Call & Bill Request alert bar with "Acknowledge" action
- [x] Verify live sync between KDS status changes and Customer Order Tracker

## Phase 6: Billing, Reviews, Analytics & Automation
- [x] Build Live Itemized Bill & 3 Payment Modes (Online, Cash at Table, Pay at Counter) + Success screen
- [x] Build Dual Review System (Stars, Compliment Chips, Live Website Reviews + Google Review redirect)
- [x] Build Daily Sales Analytics (KPI growth % + Recharts bar chart)
- [x] Build WhatsApp Notification Service (New Order, Low-Stock, Auto Daily Report + Cron route + Log Viewer)

## Phase 7: Vercel Production Deployment
- [x] Add `vercel.json` (with daily report cron job) and `.env.example`
- [x] Audit tenant isolation & auth security across all API routes
- [x] Run full TypeScript & production build check (`npx tsc --noEmit && npm run build`)
