import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import YTLayout from "@/components/YTLayout";
import { VideoCard, type VideoCardData } from "@/components/VideoCard";
import {
  Music2, Gamepad2, Newspaper, Trophy, GraduationCap, Shirt, Flame,
} from "lucide-react";

export const Route = createFileRoute("/category/$slug")({ component: CategoryPage });

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; description: string; color: string }> = {
  music:    { label: "Music",    icon: Music2,        description: "Songs, tutorials, concerts and more",         color: "from-pink-500/20 to-rose-500/10" },
  gaming:   { label: "Gaming",   icon: Gamepad2,      description: "Gameplay, reviews, tips and esports",         color: "from-purple-500/20 to-violet-500/10" },
  news:     { label: "News",     icon: Newspaper,     description: "Latest headlines and in-depth reporting",      color: "from-blue-500/20 to-sky-500/10" },
  sports:   { label: "Sports",   icon: Trophy,        description: "Highlights, training and sports analysis",     color: "from-green-500/20 to-emerald-500/10" },
  learning: { label: "Learning", icon: GraduationCap, description: "Tutorials, courses and educational content",   color: "from-yellow-500/20 to-amber-500/10" },
  fashion:  { label: "Fashion",  icon: Shirt,         description: "Style guides, trends and beauty tips",         color: "from-orange-500/20 to-red-500/10" },
  shorts:   { label: "Shorts",   icon: Flame,         description: "Quick videos under 60 seconds",               color: "from-red-500/20 to-pink-500/10" },
};

function CategoryPage() {
  const { slug } = useParams({ from: "/category/$slug" });
  const meta = CATEGORY_META[slug] ?? { label: slug, icon: Flame, description: "", color: "from-muted/20 to-muted/10" };
  const Icon = meta.icon;

  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from("videos")
      .select("id,title,description,video_url,thumbnail_url,duration_seconds,created_at")
      .order("created_at", { ascending: false });

    if (slug === "shorts") {
      query = query.lte("duration_seconds", 60);
    } else {
      // Filter by category column OR by keyword in title/description
      query = query.or(`category.eq.${slug},title.ilike.%${meta.label}%,description.ilike.%${meta.label}%`);
    }

    query.then(({ data }) => {
      setVideos((data as VideoCardData[]) || []);
      setLoading(false);
    });
  }, [slug, meta.label]);

  return (
    <YTLayout>
      <div className="px-4 py-4 sm:px-6">
        {/* Category header */}
        <div className={`mb-6 rounded-2xl bg-gradient-to-r ${meta.color} p-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 backdrop-blur">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{meta.label}</h1>
              <p className="text-sm text-muted-foreground">{meta.description}</p>
            </div>
          </div>
        </div>

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
        ) : videos.length === 0 ? (
          <div className="py-20 text-center">
            <Icon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium">No {meta.label} videos yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon for new content.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{videos.length} videos</p>
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          </>
        )}
      </div>
    </YTLayout>
  );
}
