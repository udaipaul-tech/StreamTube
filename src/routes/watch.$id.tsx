import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import YTLayout from "@/components/YTLayout";
import GestureVideoPlayer from "@/components/GestureVideoPlayer";
import CommentSection from "@/components/CommentSection";
import { VideoCard, type VideoCardData } from "@/components/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/providers/AppProvider";
import { watchLimit } from "@/lib/plans";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, Download, Bell } from "lucide-react";
import { channelFor, formatViews, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/watch/$id")({ component: WatchPage });

interface VideoRow extends VideoCardData {
  video_url: string;
}

function WatchPage() {
  const { id } = useParams({ from: "/watch/$id" });
  const navigate = useNavigate();
  const { profile, refreshProfile } = useApp();
  const [video, setVideo] = useState<VideoRow | null>(null);
  const [related, setRelated] = useState<VideoCardData[]>([]);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    supabase
      .from("videos")
      .select("id,title,description,video_url,thumbnail_url,duration_seconds,created_at")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setVideo(data as VideoRow | null));
    supabase
      .from("videos")
      .select("id,title,description,thumbnail_url,duration_seconds,created_at")
      .neq("id", id)
      .limit(20)
      .then(({ data }) => setRelated((data as VideoCardData[]) || []));
  }, [id]);

  const limit = profile ? watchLimit(profile.plan) : 5 * 60;
  const consumedToday = profile?.watch_seconds_today ?? 0;
  const remaining = limit < 0 ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - consumedToday);

  const onConsumeSecond = async (sessionSeconds: number) => {
    if (!profile) return;
    if (sessionSeconds % 5 === 0) {
      await supabase
        .from("profiles")
        .update({ watch_seconds_today: consumedToday + sessionSeconds })
        .eq("id", profile.id);
      refreshProfile();
    }
  };

  const next = () => {
    if (!related[0]) return;
    navigate({ to: "/watch/$id", params: { id: related[0].id } });
  };

  if (!video) {
    return (
      <YTLayout miniSidebar>
        <p className="p-8 text-center text-muted-foreground">Loading…</p>
      </YTLayout>
    );
  }

  const ch = channelFor(video.id);

  return (
    <YTLayout miniSidebar>
      <div className="mx-auto grid max-w-[1700px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-6">
        {/* Main column */}
        <div className="min-w-0">
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

          <h1 className="mt-3 text-xl font-semibold leading-snug">{video.title}</h1>

          {/* Channel + actions row */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: ch.color }}
              >
                {ch.initial}
              </div>
              <div>
                <p className="text-sm font-semibold">{ch.name}</p>
                <p className="text-xs text-muted-foreground">{(ch.views / 1000).toFixed(0)}K subscribers</p>
              </div>
              <Button size="sm" className="ml-2 rounded-full">
                <Bell className="mr-1 h-4 w-4" />Subscribe
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-full bg-muted">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted/70">
                  <ThumbsUp className="h-4 w-4" /> 1.2K
                </button>
                <span className="h-5 w-px bg-border" />
                <button className="px-3 py-1.5 text-sm hover:bg-muted/70" aria-label="Dislike">
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
              <Button variant="secondary" size="sm" className="rounded-full">
                <Share2 className="mr-1 h-4 w-4" />Share
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => navigate({ to: "/profile" })}
              >
                <Download className="mr-1 h-4 w-4" />Download
              </Button>
            </div>
          </div>

          {/* Description box */}
          <div
            className="mt-3 cursor-pointer rounded-xl bg-muted px-3 py-2 text-sm"
            onClick={() => setShowDesc((v) => !v)}
          >
            <p className="font-medium">
              {formatViews(ch.views)} · {video.created_at ? timeAgo(video.created_at) : "recently"}
            </p>
            <p className={`mt-1 whitespace-pre-line text-muted-foreground ${showDesc ? "" : "line-clamp-2"}`}>
              {video.description || "No description provided."}
            </p>
            <p className="mt-1 text-xs font-medium">{showDesc ? "Show less" : "Show more"}</p>
          </div>

          <div id="comments" className="mt-6">
            <CommentSection videoId={video.id} />
          </div>
        </div>

        {/* Related sidebar */}
        <aside className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Up next</h2>
          {related.map((v) => (
            <VideoCard key={v.id} video={v} layout="row" />
          ))}
          {related.length === 0 && (
            <p className="text-sm text-muted-foreground">No related videos yet.</p>
          )}
        </aside>
      </div>
    </YTLayout>
  );
}
