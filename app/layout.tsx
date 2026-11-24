import type { Metadata, Viewport } from "next";
import "./globals.css";

// ── App Metadata & Viewport ───────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: "#FDFBD4",
};

export const metadata: Metadata = {
  title: {
    default: "DineFlow — Smart QR Restaurant Ordering",
    template: "%s | DineFlow",
  },
  description:
    "Multi-tenant QR-based dine-in ordering, live kitchen display, and automated billing for modern restaurants.",
  keywords: ["restaurant ordering", "QR menu", "kitchen display", "dine-in"],
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-cream text-espresso font-inter">
        {children}
      </body>
    </html>
  );
}
