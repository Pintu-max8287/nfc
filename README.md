# DineFlow — Smart QR Restaurant Ordering SaaS

A multi-tenant, cloud-native QR ordering system, Live Kitchen Display System (KDS), and automated billing platform built on Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

---

## 🎨 Brand Design Tokens

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Cream** | `#FDFBD4` | Warm background canvas & mobile frame |
| **Surface** | `#FFFDF2` | Elevated cards, bottom sheets & modals |
| **Orange** | `#C05800` | Primary CTA, active highlights, key accents |
| **Chestnut** | `#713600` | Table badges, secondary borders, badges |
| **Espresso** | `#38240D` | Typography, sidebar background, headers |
| **Status Ready** | `#2E7D32` | Available dishes, ready tickets, paid bills |
| **Status Alert** | `#B91C1C` | Sold out items, 15m+ urgent tickets |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested with Node 20 / 22)
- Free PostgreSQL instance (Neon, Supabase, or local PostgreSQL)

### 2. Clone & Install
```bash
git clone <repository-url>
cd NFC
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your values:
```env
# PostgreSQL connection string (use Pooled URL on Vercel)
DATABASE_URL="postgresql://user:password@ep-cool-sample.us-east-2.aws.neon.tech/dineflow?sslmode=require"

# JWT Secret (min 32 characters)
JWT_SECRET="xM9jHBL6InpKpf_DhX9hPJV3q-Utrizha9554PUDqZI"

# WhatsApp Cloud API (Optional - simulated if omitted)
WHATSAPP_API_TOKEN="your-meta-bearer-token"
WHATSAPP_PHONE_ID="your-meta-phone-id"

# Vercel Cron Secret
CRON_SECRET="your-secure-random-cron-secret"
```

### 4. Push Schema & Seed Initial Data
```bash
# Push Prisma schema to your PostgreSQL database
npx prisma db push

# Seed Super Admin, Demo Restaurant (spice-roast), Admin, Kitchen, Tables & Menu
npm run db:seed
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials (from Seed)

| Portal | URL | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/super-admin/login` | `superadmin@dineflow.com` | `SuperAdmin@123` |
| **Restaurant Admin** | `/admin/login` | `admin@spiceroast.com` | `Admin@123` |
| **Kitchen Staff** | `/admin/login` | `kitchen@spiceroast.com` | `Kitchen@123` |
| **Customer Demo** | `/spice-roast/table/05` | *Public Access* | *No login needed* |
| **Live Kitchen (KDS)** | `/spice-roast/kitchen` | *Kitchen / Admin Access* | *Authenticated* |

---

## ☁️ Vercel Production Deployment Guide

### Step 1: Connect a Free PostgreSQL Database

#### Option A: Neon (Recommended)
1. Sign up at [neon.tech](https://neon.tech) and create a project named `dineflow`.
2. Under **Connection Details**, select **Prisma** or **Pooled Connection**.
3. Copy the pooled connection string (`?sslmode=require&pgbouncer=true`).

#### Option B: Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings &rarr; Database &rarr; Connection Pooling**.
3. Copy the connection string using port `6543` with `pgbouncer=true` and `?sslmode=require`.

---

### Step 2: Push Database Schema & Seed Data
From your local terminal connected to your remote DB:
```bash
# 1. Export remote DATABASE_URL
export DATABASE_URL="your-remote-pooled-url"

# 2. Push Prisma models
npx prisma db push

# 3. Seed initial Super Admin and demo restaurant
npm run db:seed
```

---

### Step 3: Deploy to Vercel

1. Push your code to GitHub / GitLab / Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com):
   - Click **Add New &rarr; Project**.
   - Import your repository.
   - Framework preset will automatically detect **Next.js**.
   - Build Command: `prisma generate && next build` (configured automatically via `package.json`).
3. Add the following **Environment Variables** in the Vercel project settings:
   - `DATABASE_URL`: Your pooled PostgreSQL connection string.
   - `JWT_SECRET`: Random 32+ character string.
   - `CRON_SECRET`: Random secret string (protects the daily report cron).
   - `WHATSAPP_API_TOKEN`: (Optional) Meta Cloud API token.
   - `WHATSAPP_PHONE_ID`: (Optional) Meta Cloud Phone number ID.
4. Click **Deploy**.

---

### Step 4: Automated Vercel Cron Job
`vercel.json` is pre-configured to run the **Daily Sales Report** cron job every day at **18:00 UTC (11:30 PM IST)**:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 18 * * *"
    }
  ]
}
```

Vercel automatically triggers this endpoint with `Authorization: Bearer <CRON_SECRET>`, summarizing daily revenue and dispatching WhatsApp alerts to all active restaurants.

---

## 🛡️ Security & Multi-Tenancy Architecture

1. **Strict Tenant Isolation:** Every tenant table (`Table`, `Category`, `MenuItem`, `Order`, `ServiceRequest`, `Review`, `NotificationLog`) enforces a `restaurantId` foreign key with compound unique constraints.
2. **Server-Side Verification:** `requireAdminForSlug(req, slug)` verifies the HTTP-only JWT cookie against the database record before any mutation occurs; client-supplied tenant IDs are never trusted.
3. **100% Serverless-Safe:** No filesystem writes (`fs`). All state, media URLs, audit logs, and analytics are persisted in PostgreSQL.
4. **Zod Validation:** All incoming API payloads are strictly validated using Zod schemas with formatted error reporting.
5. **Offline Resilient KDS Chime:** Uses synthetic Web Audio API oscillators, producing two-tone melodic alerts without loading external `.mp3` assets over the network.
