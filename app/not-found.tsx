import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6 px-4">
      <h1
        className="text-6xl font-heading font-bold"
        style={{ color: "var(--brand-orange)" }}
      >
        404
      </h1>
      <p className="text-lg" style={{ color: "var(--text-muted)" }}>
        Page not found — scan your table QR to get started.
      </p>
      <Link href="/" className="btn-primary">
        <Home className="w-4 h-4" />
        Go Home
      </Link>
    </main>
  );
}
