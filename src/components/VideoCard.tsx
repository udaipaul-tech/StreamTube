import { Link } from "@tanstack/react-router";
import { channelFor, formatDuration, formatViews, timeAgo } from "@/lib/format";

export interface VideoCardData {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  created_at?: string;
}

export function VideoCard({ video, layout = "grid" }: { video: VideoCardData; layout?: "grid" | "row" }) {
  const ch = channelFor(video.id);

  if (layout === "row") {
    return (
      <Link to="/watch/$id" params={{ id: video.id }} className="flex gap-2 rounded-lg p-1 hover:bg-muted">
        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No thumb</div>
          )}
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
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">No thumbnail</div>
        )}
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
