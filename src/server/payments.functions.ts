import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, type PlanTier } from "@/lib/plans";

const CreateSchema = z.object({
  plan: z.enum(["bronze", "silver", "gold"]),
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const plan = PLANS[data.plan as PlanTier];
    const amountPaise = plan.priceInr * 100;

    if (!keyId || !keySecret) {
      return {
        ok: false as const,
        error:
          "Razorpay test keys are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to use real checkout.",
      };
    }

    const auth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: { plan: data.plan, user_id: context.userId },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false as const, error: `Razorpay order error: ${res.status} ${t}` };
    }
    const order = await res.json();

    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      plan: data.plan,
      amount_inr: plan.priceInr,
      razorpay_order_id: order.id,
      status: "created",
    });

    return {
      ok: true as const,
      orderId: order.id as string,
      amount: amountPaise,
      currency: "INR" as const,
      keyId,
    };
  });

const VerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan: z.enum(["bronze", "silver", "gold"]),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VerifySchema.parse(d))
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return { ok: false as const, error: "Razorpay not configured" };

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== data.razorpay_signature) {
      return { ok: false as const, error: "Signature mismatch" };
    }

    await supabaseAdmin
      .from("payments")
      .update({
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        status: "paid",
      })
      .eq("razorpay_order_id", data.razorpay_order_id);

    await supabaseAdmin
      .from("profiles")
      .update({ plan: data.plan, is_premium: true })
      .eq("id", context.userId);

    return { ok: true as const };
  });

// "Simulated payment" fallback — when Razorpay keys aren't configured, the user can still test the upgrade flow.
const SimSchema = z.object({ plan: z.enum(["bronze", "silver", "gold"]) });
export const simulateUpgrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SimSchema.parse(d))
  .handler(async ({ data, context }) => {
    const plan = PLANS[data.plan as PlanTier];
    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      plan: data.plan,
      amount_inr: plan.priceInr,
      status: "paid",
      razorpay_order_id: `sim_${Date.now()}`,
    });
    await supabaseAdmin
      .from("profiles")
      .update({ plan: data.plan, is_premium: true })
      .eq("id", context.userId);
    return { ok: true as const };
  });
