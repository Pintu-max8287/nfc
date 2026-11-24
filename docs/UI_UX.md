# UI/UX Design Specification
## Brand Theme: Warm Artisanal Espresso & Spice

### 1. Color System (Strict Adherence)
Define these CSS variables in `globals.css` and map them in `tailwind.config.ts`:
- `--bg-cream: #FDFBD4` — Primary page background (Customer App & Admin Light Mode)
- `--surface-card: #FFFDF2` — Elevated cards, modals, bottom sheets (subtle warm lift over `#FDFBD4`)
- `--brand-orange: #C05800` — Primary CTA buttons, active category pills, cart badge, star ratings, chart bars
- `--brand-orange-hover: #A64B00` — Hover/pressed state for primary buttons
- `--brand-chestnut: #713600` — Secondary buttons, table badges, icon accents, subtle borders (`#713600/20`)
- `--brand-espresso: #38240D` — Primary headings, body text, Admin sidebar background, KDS dark canvas
- `--text-muted: #6E5438` — Secondary captions, descriptions, timestamps
- `--status-ready: #2E7D32` — Ready/Served/Paid/Available indicator
- `--status-alert: #B91C1C` — Sold Out/Urgent Timer/Waiter Call alert

### 2. Typography
- **Headings / Brand Display:** `Plus Jakarta Sans` (Weights: 600, 700, 800)
- **Body / UI / Numbers:** `Inter` or `Poppins` (Weights: 400, 500, 600; use `tabular-nums` for prices and KDS timers)

### 3. Design Principles & Component Rules
- **Mobile-First Customer Experience:** Customer routes (`/[slug]/table/[tableNumber]/*`) must feel like a native mobile app (max-width `480px` centered on desktop with subtle warm border, 16px–20px rounded cards, sticky bottom navigation/cart bar, smooth bottom-sheet modals).
- **High-Contrast Kitchen Display (KDS):** Uses `#38240D` dark espresso canvas with `#FDFBD4` / `#FFFDF2` high-legibility order ticket cards and bold `#C05800` / `#713600` status headers so chefs can read orders from across the kitchen.
- **Executive Admin & Super Admin Dashboards:** Left sidebar in `#38240D` with `#FDFBD4` text and `#C05800` active indicator pills; main workspace in `#FDFBD4` with clean `#FFFDF2` KPI cards and `1px solid rgba(113, 54, 0, 0.15)` borders.
- **Micro-Interactions:** Smooth hover elevations, instant toast feedback (e.g., "Wi-Fi Password Copied!", "Waiter Notified!"), skeleton loading states, and tactile toggle switches for Available/Sold Out items.