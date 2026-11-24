export default function Loading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing brand logo */}
        <div
          className="w-12 h-12 rounded-2xl animate-pulse"
          style={{ backgroundColor: "var(--brand-orange)" }}
        />
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Loading DineFlow…
        </p>
      </div>
    </div>
  );
}
