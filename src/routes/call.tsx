import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import NavBar from "@/components/NavBar";
import { useApp } from "@/providers/AppProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  PhoneOff, Circle, Square, Copy, Phone,
} from "lucide-react";

export const Route = createFileRoute("/call")({ component: CallPage });

// ── WebRTC helpers ────────────────────────────────────────────────────────────
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ── Main component ────────────────────────────────────────────────────────────
function CallPage() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"lobby" | "call">("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isHost, setIsHost] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <Phone className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <h1 className="text-2xl font-bold">Video Calls</h1>
          <p className="mt-2 text-muted-foreground">Sign in to start or join a video call.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
        </main>
      </div>
    );
  }

  if (phase === "call") {
    return <CallRoom roomCode={roomCode} isHost={isHost} userId={user.id} onLeave={() => setPhase("lobby")} />;
  }

  const startCall = async () => {
    const code = makeRoomCode();
    await supabase.from("call_sessions").insert({ room_code: code, host_user_id: user.id });
    setRoomCode(code);
    setIsHost(true);
    setPhase("call");
  };

  const joinCall = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { toast.error("Enter a room code."); return; }
    const { data } = await supabase.from("call_sessions").select("id").eq("room_code", code).maybeSingle();
    if (!data) { toast.error("Room not found."); return; }
    setRoomCode(code);
    setIsHost(false);
    setPhase("call");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8">
          <Video className="mx-auto h-12 w-12 text-primary mb-3" />
          <h1 className="text-3xl font-bold">Video Calls</h1>
          <p className="mt-2 text-muted-foreground">
            Start a call or join with a room code. Screen sharing and recording included.
          </p>
        </div>

        <div className="space-y-4">
          <Button className="w-full h-12 text-base" onClick={startCall}>
            <Video className="mr-2 h-5 w-5" /> Start New Call
          </Button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or join existing</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter room code (e.g. AB12CD)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinCall()}
              className="font-mono tracking-widest uppercase"
              maxLength={6}
            />
            <Button onClick={joinCall} variant="outline">Join</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Call Room ─────────────────────────────────────────────────────────────────
interface CallRoomProps {
  roomCode: string;
  isHost: boolean;
  userId: string;
  onLeave: () => void;
}

function CallRoom({ roomCode, isHost, userId, onLeave }: CallRoomProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Connecting…");

  // ── Setup ──────────────────────────────────────────────────────────────────
  const setupPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = async (e) => {
      if (!e.candidate) return;
      await supabase.from("call_signals").insert({
        room_code: roomCode,
        from_user: userId,
        payload: { type: "candidate", candidate: e.candidate.toJSON() },
      });
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      setConnected(true);
      setStatus("Connected");
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "disconnected" || s === "failed") setStatus("Disconnected");
    };

    return pc;
  }, [roomCode, userId]);

  useEffect(() => {
    let lastSignalId = 0;

    const init = async () => {
      // Get local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = setupPC();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        // Subscribe to signals
        channelRef.current = supabase
          .channel(`call_${roomCode}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "call_signals", filter: `room_code=eq.${roomCode}` },
            async (payload) => {
              const sig = payload.new as { id: number; from_user: string; payload: any };
              if (sig.from_user === userId || sig.id <= lastSignalId) return;
              lastSignalId = sig.id;
              const p = sig.payload;

              if (p.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await supabase.from("call_signals").insert({
                  room_code: roomCode,
                  from_user: userId,
                  payload: { type: "answer", sdp: answer },
                });
              } else if (p.type === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
              } else if (p.type === "candidate") {
                await pc.addIceCandidate(new RTCIceCandidate(p.candidate));
              }
            }
          )
          .subscribe();

        // Host creates offer
        if (isHost) {
          setStatus("Waiting for peer…");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await supabase.from("call_signals").insert({
            room_code: roomCode,
            from_user: userId,
            payload: { type: "offer", sdp: offer },
          });
        } else {
          setStatus("Joining call…");
        }
      } catch (err) {
        toast.error("Camera/mic access denied. Check browser permissions.");
        setStatus("Permission denied");
      }
    };

    init();

    return () => {
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomCode, userId, isHost, setupPC]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (screenSharing) {
      // Stop screen share, restore camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(camTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screen;
        const screenTrack = screen.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        screenTrack.onended = () => toggleScreenShare();
        setScreenSharing(true);
        toast.success("Screen sharing started");
      } catch {
        toast.error("Screen share cancelled or denied.");
      }
    }
  };

  const toggleRecording = () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
    } else {
      const stream = remoteVideoRef.current?.srcObject as MediaStream | null;
      if (!stream) { toast.error("No remote stream to record."); return; }
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `call-recording-${roomCode}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Recording saved to your device.");
      };
      rec.start(1000);
      recorderRef.current = rec;
      setRecording(true);
      toast.success("Recording started");
    }
  };

  const leaveCall = () => {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (recording) recorderRef.current?.stop();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    onLeave();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied!");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/70">Room</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 font-mono text-sm font-bold hover:bg-white/20 transition"
          >
            {roomCode} <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`} />
          <span className="text-xs text-white/60">{status}</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
        {/* Local video */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
          <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium">
            You {screenSharing ? "(Screen)" : ""}
          </div>
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <VideoOff className="h-12 w-12 text-white/30" />
            </div>
          )}
        </div>

        {/* Remote video */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <p className="text-sm text-white/50">{status}</p>
              {isHost && (
                <p className="text-xs text-white/30">Share code <span className="font-mono font-bold text-white/60">{roomCode}</span> with your friend</p>
              )}
            </div>
          )}
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium">
            Remote
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-black/80 backdrop-blur border-t border-white/10">
        <ControlBtn onClick={toggleMic} active={micOn} activeIcon={<Mic className="h-5 w-5" />} inactiveIcon={<MicOff className="h-5 w-5" />} label="Mic" />
        <ControlBtn onClick={toggleCam} active={camOn} activeIcon={<Video className="h-5 w-5" />} inactiveIcon={<VideoOff className="h-5 w-5" />} label="Camera" />
        <ControlBtn onClick={toggleScreenShare} active={!screenSharing} activeIcon={<Monitor className="h-5 w-5" />} inactiveIcon={<MonitorOff className="h-5 w-5" />} label="Screen" highlight={screenSharing} />
        <ControlBtn onClick={toggleRecording} active={!recording} activeIcon={<Circle className="h-5 w-5" />} inactiveIcon={<Square className="h-5 w-5" />} label="Record" highlight={recording} danger={recording} />
        <button
          onClick={leaveCall}
          className="flex flex-col items-center gap-1 rounded-2xl bg-red-600 hover:bg-red-700 px-5 py-3 transition"
          aria-label="Leave call"
        >
          <PhoneOff className="h-5 w-5" />
          <span className="text-[10px] font-medium">Leave</span>
        </button>
      </div>
    </div>
  );
}

function ControlBtn({
  onClick, active, activeIcon, inactiveIcon, label, highlight, danger,
}: {
  onClick: () => void;
  active: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  label: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-3 transition ${
        danger
          ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
          : highlight
          ? "bg-primary/20 text-primary hover:bg-primary/30"
          : active
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-white/5 text-white/40 hover:bg-white/10"
      }`}
      aria-label={label}
    >
      {active ? activeIcon : inactiveIcon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
