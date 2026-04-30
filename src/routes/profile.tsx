import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { useApp } from "@/providers/AppProvider";
import { supabase } from "@/integrations/supabase/client";
import { PLANS } from "@/lib/plans";
import { formatDuration, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Crown, Clock, LogOut, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

interface DownloadRow {
  id: string;
  downloaded_at: string;
  video_id: string;
  video?: {
    title: string;
    thumbnail_url: string | null;
    duration_seconds: number;
    video_url: string;
  } | null;
}

function ProfilePage() {
  const { profile, user, signOut } = useApp();
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    supabase
      .from("downloads")
      .select("id, downloaded_at, video_id, videos(title, thumbnail_url, duration_seconds, video_url)")
      .eq("user_id", user.id)
      .order("downloaded_at", { ascending: false })
      .then(({ data }) => {
        setDownloads(
          (data || []).map((d: any) => ({
            id: d.id,
            downloaded_at: d.downloaded_at,
            video_id: d.video_id,
            video: d.videos ?? null,
          }))
        );
        setLoading(false);
      });
  }, [user, navigate]);

  if (!profile || !user) return null;

  const plan = PLANS[profile.plan];
  const watchPct =
    plan.watchSeconds < 0
      ? 100
      : Math.min(100, (profile.watch_seconds_today / plan.watchSeconds) * 100);
  const watchRemaining =
    plan.watchSeconds < 0
      ? "Unlimited"
      : `${Math.max(0, Math.floor((plan.watchSeconds - profile.watch_seconds_today) / 60))}m left today`;

  const downloadsToday = profile.downloads_today;
  const downloadLimit = plan.tier === "free" ? 1 : -1;
  const canDownload = downloadLimit < 0 || downloadsToday < downloadLimit;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">

        {/* Profile header */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {(profile.display_name || user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.display_name || "User"}</h1>
            <p className="text-sm text-muted-foreground truncate">{profile.email || user.email}</p>
            {profile.city && profile.city !== "Unknown" && (
              <p className="text-xs text-muted-foreground mt-0.5">📍 {profile.city}, {profile.region_state}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </div>

        {/* Plan & watch time */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <h2 className="font-semibold">Your Plan</h2>
            </div>
            <Badge variant={profile.is_premium ? "default" : "secondary"}>
              {plan.label}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" /> Watch time today
              </span>
              <span className="font-medium">{watchRemaining}</span>
            </div>
            <Progress value={watchPct} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {plan.watchSeconds < 0
                ? "Unlimited watching"
                : `${formatDuration(profile.watch_seconds_today)} / ${formatDuration(plan.watchSeconds)}`}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Download className="h-4 w-4" /> Downloads today
              </span>
              <span className="font-medium">
                {downloadLimit < 0 ? "Unlimited" : `${downloadsToday} / ${downloadLimit}`}
              </span>
            </div>
            {downloadLimit > 0 && (
              <Progress value={(downloadsToday / downloadLimit) * 100} className="h-2" />
            )}
          </div>

          {!profile.is_premium && (
            <Button className="w-full" onClick={() => navigate({ to: "/premium" })}>
              <Crown className="mr-1.5 h-4 w-4" /> Upgrade to Premium
            </Button>
          )}
        </div>

        {/* Downloads list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Download className="h-5 w-5" /> Downloaded Videos
            </h2>
            <span className="text-sm text-muted-foreground">{downloads.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : downloads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Download className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">No downloads yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {canDownload
                  ? "Go to a video and click Download."
                  : "You've reached your daily download limit. Upgrade for unlimited downloads."}
              </p>
              {!canDownload && (
                <Button size="sm" className="mt-3" onClick={() => navigate({ to: "/premium" })}>
                  Upgrade Plan
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {downloads.map((d) => (
                <li key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {d.video?.thumbnail_url ? (
                      <img src={d.video.thumbnail_url} alt={d.video.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                    {d.video?.duration_seconds && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
                        {formatDuration(d.video.duration_seconds)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.video?.title ?? "Unknown video"}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(d.downloaded_at)}</p>
                  </div>
                  {d.video?.video_url && (
                    <a
                      href={d.video.video_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                      onClick={() => toast.success("Download started")}
                    >
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
