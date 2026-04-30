import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  watchLimitSeconds: number;
  remainingSeconds: number;
  onConsumeSecond?: (totalConsumed: number) => void;
  onLimitReached?: () => void;
  onNextVideo?: () => void;
  onCloseSite?: () => void;
  onOpenComments?: () => void;
}

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);

  // Tap gesture state
  const tapRef = useRef<{ zone: "left" | "center" | "right"; count: number; timer: ReturnType<typeof setTimeout> | null }>({
    zone: "center", count: 0, timer: null,
  });

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [gestureHint, setGestureHint] = useState<string | null>(null);

  const showGestureHint = useCallback((msg: string) => {
    setGestureHint(msg);
    setTimeout(() => setGestureHint(null), 900);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 3000);
  }, []);

  // Reset state when src changes
  useEffect(() => {
    if (!src) return;
    sessionRef.current = 0;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setControlsVisible(true);
  }, [src]);

  // Watch-time tracking
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      sessionRef.current += 1;
      onConsumeSecond?.(sessionRef.current);
      if (watchLimitSeconds > 0 && remainingSeconds > 0) {
        if (sessionRef.current >= remainingSeconds) {
          videoRef.current?.pause();
          onLimitReached?.();
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [playing, watchLimitSeconds, remainingSeconds, onConsumeSecond, onLimitReached]);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch((e) => console.warn("Play blocked:", e));
    } else {
      v.pause();
    }
  }, []);

  const seek = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setCurrentTime(ratio * v.duration);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  // ── Gesture handler ──────────────────────────────────────────────────────
  const handleGestureClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    showControls();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const zone: "left" | "center" | "right" =
      x < w / 3 ? "left" : x > (2 * w) / 3 ? "right" : "center";

    const t = tapRef.current;

    // Reset if zone changed
    if (t.zone !== zone) {
      t.zone = zone;
      t.count = 0;
      if (t.timer) clearTimeout(t.timer);
      t.timer = null;
    }

    t.count += 1;

    // Immediate play/pause on first center tap (satisfies browser autoplay policy)
    if (zone === "center" && t.count === 1) {
      togglePlay();
    }

    if (t.timer) clearTimeout(t.timer);
    t.timer = setTimeout(() => {
      const count = t.count;
      const z = t.zone;
      t.count = 0;
      t.timer = null;

      if (count === 2 && z === "right") {
        seek(10);
        showGestureHint("⏩ +10s");
      } else if (count === 2 && z === "left") {
        seek(-10);
        showGestureHint("⏪ -10s");
      } else if (count >= 3 && z === "center") {
        // undo the single-tap toggle, then go next
        togglePlay();
        showGestureHint("⏭ Next video");
        onNextVideo?.();
      } else if (count >= 3 && z === "right") {
        showGestureHint("✕ Closing…");
        onCloseSite?.();
      } else if (count >= 3 && z === "left") {
        showGestureHint("💬 Comments");
        onOpenComments?.();
      }
    }, 300);
  }, [togglePlay, seek, showControls, showGestureHint, onNextVideo, onCloseSite, onOpenComments]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-black select-none"
      style={{ cursor: controlsVisible ? "default" : "none" }}
      onMouseMove={showControls}
      onMouseLeave={() => { if (playing) setControlsVisible(false); }}
    >
      {/* Video element */}
      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="aspect-video w-full block"
          playsInline
          preload="metadata"
          onPlay={() => { setPlaying(true); showControls(); }}
          onPause={() => { setPlaying(false); setControlsVisible(true); }}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) setDuration(v.duration);
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v) return;
            setCurrentTime(v.currentTime);
            if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onError={() => {
            const v = videoRef.current;
            console.warn("Video error:", v?.error?.message ?? "unknown");
          }}
        />
      ) : (
        <div className="aspect-video w-full flex items-center justify-center bg-black">
          <span className="text-white/40 text-sm">Loading video…</span>
        </div>
      )}

      {/* Gesture overlay — covers video area above controls */}
      <div
        className="absolute inset-x-0 top-0 cursor-pointer"
        style={{ bottom: "56px" }}
        onClick={handleGestureClick}
        aria-label="Video gesture area"
      />

      {/* Big play button when paused */}
      {!playing && src && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center" style={{ bottom: "56px" }}>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="h-10 w-10 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Gesture hint toast */}
      {gestureHint && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm">
          {gestureHint}
        </div>
      )}

      {/* Gesture guide (bottom-left, subtle) */}
      <div
        className={`pointer-events-none absolute left-3 top-3 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white/60 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
      >
        2× left/right = ±10s · 1× center = play · 3× center = next
      </div>

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}
      >
        {/* Progress bar */}
        <div className="px-3 pt-6 pb-1">
          <div
            ref={progressRef}
            className="group relative h-1 w-full cursor-pointer rounded-full bg-white/20 hover:h-2 transition-all duration-150"
            onClick={handleProgressClick}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/25" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-red-500" style={{ width: `${progressPct}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-red-500 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-2 px-3 pb-3">
          <button
            onClick={togglePlay}
            className="text-white hover:text-white/80 transition"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-5 w-5" fill="white" /> : <Play className="h-5 w-5" fill="white" />}
          </button>

          <button onClick={onNextVideo} className="text-white hover:text-white/80 transition" aria-label="Next video">
            <SkipForward className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-white hover:text-white/80 transition" aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range" min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 accent-white cursor-pointer"
              aria-label="Volume"
            />
          </div>

          <span className="flex-1 text-xs text-white/80 font-mono tabular-nums">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>

          <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition" aria-label="Fullscreen">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
