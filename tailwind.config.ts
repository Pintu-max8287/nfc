/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── DineFlow Brand Palette ─────────────────────────────────────────
        cream: "#FDFBD4",        // Primary page background
        surface: "#FFFDF2",      // Elevated cards / modals
        orange: {
          DEFAULT: "#C05800",    // Primary CTAs, active pills, cart badge
          hover: "#A64B00",      // Hover / pressed state
        },
        chestnut: "#713600",     // Secondary buttons, table badges, borders
        espresso: "#38240D",     // Headings, body text, sidebar background
        muted: "#6E5438",        // Captions, descriptions, timestamps
        status: {
          ready: "#2E7D32",      // Ready / Served / Paid / Available
          alert: "#B91C1C",      // Sold Out / Urgent / Waiter Call
        },
      },
      fontFamily: {
        jakarta: ["var(--font-plus-jakarta-sans)", "'Plus Jakarta Sans'", "sans-serif"],
        inter: ["var(--font-inter)", "'Inter'", "sans-serif"],
        heading: ["var(--font-plus-jakarta-sans)", "'Plus Jakarta Sans'", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(56, 36, 13, 0.08)",
        "card-hover": "0 6px 24px rgba(56, 36, 13, 0.14)",
        modal: "0 20px 60px rgba(56, 36, 13, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
