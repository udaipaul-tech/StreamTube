import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  watchLimitSeconds: number; // -1 = unlimited
  remainingSeconds: number; // remaining at session start
  onConsumeSecond?: (totalConsumed: number) => void; // called every second
  onLimitReached?: () => void;
  onNextVideo?: () => void;
  onCloseSite?: () => void;
  onOpenComments?: () => void;
}

/**
 * Custom video player with gesture controls.
 * - Double-tap right side: +10s
 * - Double-tap left side: -10s
 * - Single tap center: pause/resume
 * - Triple tap center: next video
 * - Triple tap right: close site
 * - Triple tap left: open comments
 */
export default function GestureVideoPlayer({
  src,
  poster,
  watchLimitSeconds,
  remainingSeconds,
  onConsumeSecond,
  onLimitReached,
  onNextVideo,
  onCloseSite,
  onOpenComments,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [secondsConsumed, setSecondsConsumed] = useState(0);
  const tapCounter = useRef<{ zone: "left" | "center" | "right"; count: number; timer: number | null }>({
    zone: "center",
    count: 0,
    timer: null,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1200);
  };

  // Watch-time tracking
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setSecondsConsumed((s) => {
        const next = s + 1;
        onConsumeSecond?.(next);
        if (watchLimitSeconds > 0) {
          const remaining = remainingSeconds - next;
          if (remaining <= 0) {
            videoRef.current?.pause();
            onLimitReached?.();
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, watchLimitSeconds, remainingSeconds, onConsumeSecond, onLimitReached]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const seek = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };

  const handleZoneTap = (zone: "left" | "center" | "right") => {
    const t = tapCounter.current;
    if (t.zone !== zone) {
      t.zone = zone;
      t.count = 0;
      if (t.timer) window.clearTimeout(t.timer);
    }
    t.count += 1;

    if (t.timer) window.clearTimeout(t.timer);
    t.timer = window.setTimeout(() => {
      const count = t.count;
      const z = t.zone;
      t.count = 0;
      t.timer = null;

      if (count === 1 && z === "center") {
        togglePlay();
      } else if (count === 2 && z === "right") {
        seek(10);
        showToast("+10s ⏩");
      } else if (count === 2 && z === "left") {
        seek(-10);
        showToast("-10s ⏪");
      } else if (count >= 3 && z === "center") {
        showToast("Next video ⏭");
        onNextVideo?.();
      } else if (count >= 3 && z === "right") {
        showToast("Closing…");
        onCloseSite?.();
      } else if (count >= 3 && z === "left") {
        showToast("Opening comments 💬");
        onOpenComments?.();
      }
    }, 320);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const zone: "left" | "center" | "right" = x < w / 3 ? "left" : x > (2 * w) / 3 ? "right" : "center";
    handleZoneTap(zone);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-soft">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="aspect-video w-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />
      {/* Gesture overlay */}
      <div
        className="absolute inset-0 cursor-pointer select-none"
        onClick={handleClick}
        aria-label="Gesture overlay"
      />
      {/* Center indicator */}
      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur">
            <Play className="h-10 w-10 text-white" />
          </div>
        </div>
      )}
      {isPlaying && (
        <div className="pointer-events-none absolute right-4 top-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
            <Pause className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}
      {/* Hint bar */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-[11px] text-white/80">
        Tap center=pause · 2× right/left=±10s · 3× center=next · 3× right=exit · 3× left=comments
      </div>
    </div>
  );
}
