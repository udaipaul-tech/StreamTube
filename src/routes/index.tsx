import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { useApp } from "@/providers/AppProvider";
import { PLANS } from "@/lib/plans";
import { Crown, MapPin, Play, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
}

function HomePage() {
  const { profile, geo, theme } = useApp();
  const [videos, setVideos] = useState<VideoRow[]>([]);

  useEffect(() => {
    supabase.from("videos").select("id,title,description,thumbnail_url,duration_seconds").then(({ data }) => {
      setVideos((data as VideoRow[]) || []);
    });
  }, []);

  const planLabel = profile ? PLANS[profile.plan].label : "Free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl gradient-hero p-8 text-primary-foreground shadow-soft">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                <Sparkles className="h-3 w-3" /> Region-aware experience
              </div>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Watch, comment & call — anywhere, in any language.
              </h1>
              <p className="mt-3 text-sm opacity-90">
                Theme switches by your location and time. Comments translate on demand. Upgrade for more watch time and unlimited downloads.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <MapPin className="h-3 w-3" />
                  {profile?.city || geo?.city || "Detecting…"}
                  {(profile?.region_state || geo?.region) && `, ${profile?.region_state || geo?.region}`}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1">Theme: {theme}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <Crown className="h-3 w-3" />
                  Plan: {planLabel}
                </span>
              </div>
            </div>
            <Link to="/premium">
              <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow hover:bg-white/90">
                Compare plans →
              </button>
            </Link>
          </div>
        </section>

        {/* Video grid */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Trending videos</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <Link
                key={v.id}
                to="/watch/$id"
                params={{ id: v.id }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-soft"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">No thumbnail</div>
                  )}
                  <div className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                    {Math.floor(v.duration_seconds / 60)}:{String(v.duration_seconds % 60).padStart(2, "0")}
                  </div>
                  <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 font-medium">{v.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{v.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built on Lovable · Cloud-powered
      </footer>
    </div>
  );
}
