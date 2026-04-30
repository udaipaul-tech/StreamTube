import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/providers/AppProvider";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { requestOtp, verifyOtp } from "@/server/otp.functions";
import { Mail, Phone, Lock, User as UserIcon, KeyRound } from "lucide-react";
import { isSouthIndia } from "@/lib/regions";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user, geo } = useApp();

  // Auto-detect OTP channel based on region
  const otpChannel: "email" | "sms" = isSouthIndia(geo?.region) ? "email" : "sms";
  const otpLabel = otpChannel === "email" ? "Email OTP" : "Phone OTP";

  if (user) {
    setTimeout(() => navigate({ to: "/" }), 0);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h1 className="text-2xl font-bold">Welcome to StreamHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to comment, save downloads and start video calls.
          </p>
          {geo?.region && (
            <p className="mt-1 text-xs text-muted-foreground">
              📍 Detected: {geo.region} → OTP via <strong>{otpChannel === "email" ? "Email" : "SMS"}</strong>
            </p>
          )}

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="otp">{otpLabel}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <SignInForm onDone={() => navigate({ to: "/" })} />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignUpForm onDone={() => navigate({ to: "/" })} />
            </TabsContent>
            <TabsContent value="otp" className="mt-4">
              <OtpForm onDone={() => navigate({ to: "/" })} channel={otpChannel} />
            </TabsContent>
          </Tabs>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to our friendly terms. Be kind in comments — 2 dislikes auto-removes a comment.
        </p>
      </main>
    </div>
  );
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Welcome back!");
      onDone();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field icon={<Mail className="h-4 w-4" />} label="Email">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field icon={<Lock className="h-4 w-4" />} label="Password">
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </Field>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { display_name: name } },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Account created — check your email to confirm, then sign in.");
      onDone();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field icon={<UserIcon className="h-4 w-4" />} label="Display name">
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane" />
      </Field>
      <Field icon={<Mail className="h-4 w-4" />} label="Email">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field icon={<Lock className="h-4 w-4" />} label="Password">
        <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
      </Field>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}

function OtpForm({ onDone, channel }: { onDone: () => void; channel: "email" | "sms" }) {
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtpFn = useServerFn(requestOtp);
  const verifyOtpFn = useServerFn(verifyOtp);

  const placeholder = channel === "email" ? "you@example.com" : "+91 98xxxxxxxx";
  const inputType = channel === "email" ? "email" : "tel";
  const fieldLabel = channel === "email" ? "Email address" : "Phone (with country code)";

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await requestOtpFn({ data: { identifier, channel } });
      setDevCode(res.devCode ?? null);
      setStep("verify");
      toast.success(res.delivered ? `OTP sent via ${channel}` : `OTP generated (${res.deliveryNote})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOtpFn({ data: { identifier, code } });
      if (!res.ok) {
        toast.error(res.error || "Invalid code");
        return;
      }
      const syntheticEmail =
        channel === "email"
          ? identifier
          : `phone_${identifier.replace(/[^0-9]/g, "")}@otp.local`;
      const syntheticPassword =
        channel === "email"
          ? `email-otp-${identifier}-streamhub`
          : `otp-${identifier.replace(/[^0-9]/g, "")}-streamhub`;

      const signIn = await supabase.auth.signInWithPassword({ email: syntheticEmail, password: syntheticPassword });
      if (signIn.error) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: syntheticEmail,
          password: syntheticPassword,
          options: { data: { display_name: identifier } },
        });
        if (signUpError) { toast.error(signUpError.message); return; }
        const second = await supabase.auth.signInWithPassword({ email: syntheticEmail, password: syntheticPassword });
        if (second.error) { toast.message("Account created — confirm your email or use email sign-in."); return; }
      }
      toast.success("Signed in!");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "request") {
    return (
      <form onSubmit={send} className="space-y-3">
        <Field icon={channel === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />} label={fieldLabel}>
          <Input type={inputType} required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={placeholder} />
        </Field>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : `Send OTP via ${channel === "email" ? "Email" : "SMS"}`}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-3">
      <Field icon={<KeyRound className="h-4 w-4" />} label="Enter 6-digit code">
        <Input required inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
      </Field>
      {devCode && (
        <div className="rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Dev mode — your code is <span className="font-mono font-semibold">{devCode}</span>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("request")}>Back</Button>
        <Button type="submit" disabled={loading} className="flex-1">{loading ? "Verifying…" : "Verify & sign in"}</Button>
      </div>
    </form>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </Label>
      {children}
    </div>
  );
}
