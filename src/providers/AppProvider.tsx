import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchGeoInfo, shouldUseLightTheme } from "@/lib/regions";
import type { PlanTier } from "@/lib/plans";

export interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  city: string;
  region_state: string;
  country: string;
  plan: PlanTier;
  watch_seconds_today: number;
  downloads_today: number;
  usage_day: string;
  is_premium: boolean;
}

interface AppContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  loading: boolean;
  geo: { city: string; region: string; country: string } | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppContextValue | null>(null);
const THEME_KEY = "streamhub_theme_override";

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [geo, setGeo] = useState<AppContextValue["geo"]>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  // null = auto (region/time based), "light" | "dark" = user override
  const [userOverride, setUserOverride] = useState<"light" | "dark" | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  });

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) setProfile(data as ProfileRow);
  }, []);

  // Geo detection
  useEffect(() => {
    fetchGeoInfo().then(setGeo);
  }, []);

  // Auth bootstrap
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  // Sync profile city/region with geo on first detect
  useEffect(() => {
    if (!profile || !geo) return;
    if (profile.city !== geo.city || profile.region_state !== geo.region || profile.country !== geo.country) {
      supabase
        .from("profiles")
        .update({ city: geo.city, region_state: geo.region, country: geo.country })
        .eq("id", profile.id)
        .then(() => loadProfile(profile.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, profile?.id]);

  // Theme decision — user override takes priority, then auto (region + time)
  useEffect(() => {
    const decide = () => {
      if (userOverride) {
        setTheme(userOverride);
        return;
      }
      const region = profile?.region_state || geo?.region || null;
      setTheme(shouldUseLightTheme(region) ? "light" : "dark");
    };
    decide();
    const t = setInterval(decide, 60_000);
    return () => clearInterval(t);
  }, [geo, profile?.region_state, userOverride]);

  // Apply theme to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setUserOverride((prev) => {
      const next = prev === "dark" || (!prev && theme === "dark") ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, [theme]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        geo,
        theme,
        toggleTheme,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
