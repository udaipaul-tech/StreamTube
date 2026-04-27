import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import YTLayout from "@/components/YTLayout";
import { VideoCard, CategoryChips, type VideoCardData } from "@/components/VideoCard";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => {
    const q = typeof s.q === "string" && s.q.length > 0 ? s.q : undefined;
    return q ? { q } : {};
  },
  component: HomePage,
});

function HomePage() {
  const { q = "" } = Route.useSearch();
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    setLoading(true);
    supabase
      .from("videos")
      .select("id,title,description,thumbnail_url,duration_seconds,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setVideos((data as VideoCardData[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!q) return videos;
    const needle = q.toLowerCase();
    return videos.filter(
      (v) => v.title.toLowerCase().includes(needle) || (v.description || "").toLowerCase().includes(needle)
    );
  }, [videos, q]);

  return (
    <YTLayout>
      <div className="px-4 py-4 sm:px-6">
        <CategoryChips active={category} onPick={setCategory} />

        {q && (
          <p className="mb-4 text-sm text-muted-foreground">
            Results for <span className="font-medium text-foreground">"{q}"</span> · {filtered.length} videos
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-muted" />
                <div className="mt-3 flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium text-foreground">No videos found</p>
            <p className="mt-1 text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </div>
    </YTLayout>
  );
}
