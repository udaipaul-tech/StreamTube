import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RequestSchema = z.object({
  identifier: z.string().min(3).max(255),
  channel: z.enum(["email", "sms"]),
});

export const requestOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RequestSchema.parse(d))
  .handler(async ({ data }) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin.from("otp_codes").insert({
      identifier: data.identifier,
      channel: data.channel,
      code,
      expires_at,
    });

    // Try to actually send via Twilio if SMS, or via Resend if email — both optional.
    let delivered = false;
    let deliveryNote = "";

    if (data.channel === "sms") {
      const tSid = process.env.TWILIO_ACCOUNT_SID;
      const tToken = process.env.TWILIO_AUTH_TOKEN;
      const tFrom = process.env.TWILIO_FROM_NUMBER;
      if (tSid && tToken && tFrom) {
        try {
          const r = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${tSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${tSid}:${tToken}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: data.identifier,
                From: tFrom,
                Body: `Your verification code is ${code}. Valid 10 minutes.`,
              }),
            }
          );
          delivered = r.ok;
          if (!r.ok) deliveryNote = `Twilio error ${r.status}`;
        } catch (e) {
          deliveryNote = e instanceof Error ? e.message : "twilio failed";
        }
      } else {
        deliveryNote = "Twilio not configured — OTP shown in dev response";
      }
    } else {
      // Email path: not wiring full SMTP; just leave note. The OTP is returned in dev mode.
      deliveryNote = "Email provider not wired — OTP shown in dev response";
    }

    return {
      ok: true,
      delivered,
      deliveryNote,
      // DEV ONLY — exposes the OTP so the user can test the flow without Twilio/email setup.
      devCode: code,
    };
  });

const VerifySchema = z.object({
  identifier: z.string().min(3).max(255),
  code: z.string().min(4).max(8),
});

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => VerifySchema.parse(d))
  .handler(async ({ data }) => {
    const { data: rows } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("identifier", data.identifier)
      .eq("code", data.code)
      .eq("consumed", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!rows || rows.length === 0) {
      return { ok: false, error: "Invalid or expired code" };
    }

    await supabaseAdmin.from("otp_codes").update({ consumed: true }).eq("id", rows[0].id);
    return { ok: true, error: null as string | null };
  });
