import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import { useApp } from "@/providers/AppProvider";
import { PLANS, type PlanTier } from "@/lib/plans";
import { loadRazorpay } from "@/lib/razorpay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Clock, Download, Zap } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createRazorpayOrder, verifyRazorpayPayment, simulateUpgrade } from "@/server/payments.functions";

export const Route = createFileRoute("/premium")({ component: PremiumPage });

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: ["5 minutes watch/day", "1 download/day", "Comments & voting", "Basic quality"],
  bronze: ["7 minutes watch/day", "Unlimited downloads", "Comments & voting", "HD quality"],
  silver: ["10 minutes watch/day", "Unlimited downloads", "Priority support", "Full HD quality"],
  gold: ["Unlimited watching", "Unlimited downloads", "Priority support", "4K quality", "Early access"],
};

const PLAN_ICONS: Record<PlanTier, string> = {
  free: "🎬",
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
};

function PremiumPage() {
  const { profile, refreshProfile } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<PlanTier | null>(null);

  const createOrderFn = useServerFn(createRazorpayOrder);
  const verifyFn = useServerFn(verifyRazorpayPayment);
  const simulateFn = useServerFn(simulateUpgrade);

  const handleUpgrade = async (tier: PlanTier) => {
    if (tier === "free") return;
    if (!profile) {
      toast.error("Please sign in first.");
      navigate({ to: "/auth" });
      return;
    }
    if (profile.plan === tier) {
      toast.info("You're already on this plan.");
      return;
    }

    setLoading(tier);
    try {
      const order = await createOrderFn({ data: { plan: tier } });

      if (!order.ok) {
        // Razorpay not configured — use simulated upgrade for testing
        toast.info("Using test mode (Razorpay not configured). Upgrading plan…");
        const sim = await simulateFn({ data: { plan: tier } });
        if (sim.ok) {
          await refreshProfile();
          toast.success(`🎉 Upgraded to ${PLANS[tier].label}! (Test mode)`);
          navigate({ to: "/profile" });
        } else {
          toast.error("Upgrade failed.");
        }
        return;
      }

      // Load Razorpay checkout
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        toast.error("Could not load Razorpay. Please try again.");
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "StreamHub",
        description: `${PLANS[tier].label} Plan`,
        order_id: order.orderId,
        prefill: {
          email: profile.email || "",
          name: profile.display_name || "",
        },
        theme: { color: "#ef4444" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verify = await verifyFn({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: tier,
              },
            });
            if (verify.ok) {
              await refreshProfile();
              toast.success(`🎉 Payment successful! Welcome to ${PLANS[tier].label}!`);
              navigate({ to: "/profile" });
            } else {
              toast.error("Payment verification failed. Contact support.");
            }
          } catch {
            toast.error("Verification error. Contact support.");
          }
        },
        modal: {
          ondismiss: () => toast.info("Payment cancelled."),
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const currentTier = profile?.plan ?? "free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-4">
            <Crown className="h-4 w-4" /> Premium Plans
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Choose your plan</h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Unlock more watch time, unlimited downloads, and premium features. Payments via Razorpay (test mode available).
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.values(PLANS) as typeof PLANS[PlanTier][]).map((plan) => {
            const isCurrent = currentTier === plan.tier;
            const isGold = plan.tier === "gold";
            const features = PLAN_FEATURES[plan.tier];

            return (
              <div
                key={plan.tier}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                  isGold
                    ? "border-yellow-500 bg-gradient-to-b from-yellow-500/10 to-card shadow-lg"
                    : isCurrent
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {isGold && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-black text-xs px-3">Most Popular</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="default" className="text-xs px-3">Current</Badge>
                  </div>
                )}

                <div className="text-3xl mb-3">{PLAN_ICONS[plan.tier]}</div>
                <h3 className="text-lg font-bold">{plan.label}</h3>
                <div className="mt-1 mb-4">
                  <span className="text-3xl font-bold">
                    {plan.priceInr === 0 ? "Free" : `₹${plan.priceInr}`}
                  </span>
                  {plan.priceInr > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                </div>

                <ul className="space-y-2 flex-1 mb-5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.tier === "free" ? (
                  <Button variant="outline" disabled className="w-full">
                    {isCurrent ? "Current Plan" : "Free"}
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${isGold ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}`}
                    disabled={isCurrent || loading === plan.tier}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {loading === plan.tier ? (
                      "Processing…"
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      <>
                        <Zap className="mr-1.5 h-4 w-4" />
                        Upgrade to {plan.label}
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Feature</th>
                  {Object.values(PLANS).map((p) => (
                    <th key={p.tier} className="text-center py-2 px-3 font-semibold">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2.5 pr-4 flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Watch time/day
                  </td>
                  <td className="text-center py-2.5 px-3">5 min</td>
                  <td className="text-center py-2.5 px-3">7 min</td>
                  <td className="text-center py-2.5 px-3">10 min</td>
                  <td className="text-center py-2.5 px-3 text-green-500 font-medium">∞</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 flex items-center gap-1.5 text-muted-foreground">
                    <Download className="h-4 w-4" /> Downloads/day
                  </td>
                  <td className="text-center py-2.5 px-3">1</td>
                  <td className="text-center py-2.5 px-3 text-green-500 font-medium">∞</td>
                  <td className="text-center py-2.5 px-3 text-green-500 font-medium">∞</td>
                  <td className="text-center py-2.5 px-3 text-green-500 font-medium">∞</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            * Payments processed via Razorpay. Test mode uses simulated payments when Razorpay keys are not configured.
          </p>
        </div>
      </main>
    </div>
  );
}
