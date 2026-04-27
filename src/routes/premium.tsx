import { createFileRoute } from "@tanstack/react-router";
import NavBar from "@/components/NavBar";
import { PLANS } from "@/lib/plans";

export const Route = createFileRoute("/premium")({ component: PremiumPage });

function PremiumPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold">Choose a plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Razorpay test checkout will be wired in the next step.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(PLANS).map((p) => (
            <div key={p.tier} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">{p.label}</h3>
              <p className="mt-1 text-2xl font-bold">{p.priceInr === 0 ? "Free" : `₹${p.priceInr}`}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
