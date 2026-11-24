"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6 px-4">
        <h1
          className="text-3xl font-heading font-bold"
          style={{ color: "var(--status-alert)" }}
        >
          Something went wrong
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {error.message ?? "An unexpected error occurred."}
        </p>
        <div className="flex gap-4">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
