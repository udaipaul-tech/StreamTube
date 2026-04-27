import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import GestureVideoPlayer from "@/components/GestureVideoPlayer";
import CommentSection from "@/components/CommentSection";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/providers/AppProvider";
import { watchLimit } from "@/lib/plans";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/watch/$id")({ component: WatchPage });

interface VideoRow { id: string; title: string; description: string | null; video_url: string; thumbnail_url: string | null; }

function WatchPage() {
  const { id } = useParams({ from: "/watch/$id" });
  const navigate = useNavigate();
  const { profile, refreshProfile } = useApp();
  const [video, setVideo] = useState<VideoRow | null>(null);
  const [allIds, setAllIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("videos").select("id,title,description,video_url,thumbnail_url").eq("id", id).maybeSingle()
      .then(({ data }) => setVideo(data as VideoRow | null));
    supabase.from("videos").select("id").then(({ data }) => setAllIds((data || []).map((v) => v.id)));
  }, [id]);

  const limit = profile ? watchLimit(profile.plan) : 5 * 60;
  const consumedToday = profile?.watch_seconds_today ?? 0;
  const remaining = limit < 0 ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - consumedToday);

  const onConsumeSecond = async (sessionSeconds: number) => {
    if (!profile) return;
    if (sessionSeconds % 5 === 0) {
      await supabase.from("profiles").update({ watch_seconds_today: consumedToday + sessionSeconds }).eq("id", profile.id);
      refreshProfile();
    }
  };

  const next = () => {
    const idx = allIds.indexOf(id);
    const nextId = allIds[(idx + 1) % allIds.length];
    if (nextId) navigate({ to: "/watch/$id", params: { id: nextId } });
  };

  if (!video) return <div className="min-h-screen bg-background"><NavBar /><p className="p-8 text-center text-muted-foreground">Loading…</p></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <GestureVideoPlayer
          src={video.video_url}
          poster={video.thumbnail_url || undefined}
          watchLimitSeconds={limit}
          remainingSeconds={remaining}
          onConsumeSecond={onConsumeSecond}
          onLimitReached={() => toast.warning("Daily watch limit reached. Upgrade your plan for more.")}
          onNextVideo={next}
          onCloseSite={() => navigate({ to: "/exit" })}
          onOpenComments={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" })}
        />
        <h1 className="mt-4 text-2xl font-bold">{video.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{video.description}</p>

        <div id="comments" className="mt-8">
          <CommentSection videoId={video.id} />
        </div>
      </main>
    </div>
  );
}
