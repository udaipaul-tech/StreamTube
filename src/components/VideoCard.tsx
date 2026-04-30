import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { channelFor, formatDuration, formatViews, timeAgo } from "@/lib/format";

export interface VideoCardData {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url: string | null;
  video_url?: string | null;
  duration_seconds: number;
  created_at?: string;
}

// Reliable public domain thumbnails for seeded videos
const KNOWN_THUMBS: Record<string, string> = {
  "Big Buck Bunny": "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=640&q=80",
  "Elephants Dream": "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=640&q=80",
  "Sintel": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&q=80",
  "Tears of Steel": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&q=80",
  "For Bigger Blazes": "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=640&q=80",
};

function Thumb({ video, className }: { video: VideoCardData; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const ch = channelFor(video.id);

  const primarySrc = video.thumbnail_url;
  const fallbackSrc = KNOWN_THUMBS[video.title] ?? null;

  if (primarySrc && !imgError) {
    return (
      <img
        src={primarySrc}
        alt={video.title}
        className={className}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  if (fallbackSrc && !fallbackError) {
    return (
      <img
        src={fallbackSrc}
        alt={video.title}
        className={className}
        loading="lazy"
        onError={() => setFallbackError(true)}
      />
    );
  }

  // Final fallback: colored placeholder
  return (
    <div
      className={`flex items-center justify-center ${className ?? ""}`}
      style={{ backgroundColor: ch.color + "33" }}
    >
      <span className="text-4xl font-bold opacity-40" style={{ color: ch.color }}>
        {ch.initial}
      </span>
    </div>
  );
}

export function VideoCard({ video, layout = "grid" }: { video: VideoCardData; layout?: "grid" | "row" }) {
  const ch = channelFor(video.id);

  if (layout === "row") {
    return (
      <Link to="/watch/$id" params={{ id: video.id }} className="flex gap-2 rounded-lg p-1 hover:bg-muted">
        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Thumb video={video} className="h-full w-full object-cover" />
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="line-clamp-2 text-sm font-medium">{video.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{ch.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatViews(ch.views)} · {video.created_at ? timeAgo(video.created_at) : "recently"}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to="/watch/$id" params={{ id: video.id }} className="group block">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        <Thumb video={video} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration_seconds)}
        </span>
      </div>
      <div className="mt-3 flex gap-3">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: ch.color }}
        >
          {ch.initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">{video.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{ch.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatViews(ch.views)} · {video.created_at ? timeAgo(video.created_at) : "recently"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function CategoryChips({ active, onPick }: { active: string; onPick: (c: string) => void }) {
  const chips = ["All", "Music", "Gaming", "News", "Live", "Sports", "Learning", "Comedy", "Mixes", "Recently uploaded", "New to you"];
  return (
    <div className="sticky top-14 z-30 -mx-4 mb-4 flex gap-3 overflow-x-auto border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border-0">
      {chips.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
            active === c ? "bg-foreground text-background" : "bg-muted hover:bg-muted/70"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
