import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/providers/AppProvider";
import { containsBlockedChars, BLOCKED_CHARS_HINT } from "@/lib/specialChars";
import { translateText } from "@/server/translate.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Languages, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CommentRow {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  language: string | null;
  city_snapshot: string | null;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  // joined
  display_name?: string | null;
}

interface VoteRow {
  comment_id: string;
  vote: number;
}

const LANGS = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Spanish", "French", "German", "Japanese"];

export default function CommentSection({ videoId }: { videoId: string }) {
  const { user, profile } = useApp();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState("");
  const [targetLang, setTargetLang] = useState<string>("English");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState(false);
  const translateFn = useServerFn(translateText);

  const load = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("video_id", videoId)
      .order("created_at", { ascending: false });

    let withNames: CommentRow[] = (data as CommentRow[]) || [];
    const userIds = Array.from(new Set(withNames.map((c) => c.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      const map = new Map((profs || []).map((p) => [p.id, p.display_name]));
      withNames = withNames.map((c) => ({ ...c, display_name: map.get(c.user_id) || "User" }));
    }
    setComments(withNames);

    if (user) {
      const { data: votes } = await supabase
        .from("comment_votes")
        .select("comment_id, vote")
        .eq("user_id", user.id);
      const m: Record<string, number> = {};
      (votes as VoteRow[] | null)?.forEach((v) => (m[v.comment_id] = v.vote));
      setMyVotes(m);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`comments_${videoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `video_id=eq.${videoId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_votes" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, user?.id]);

  const submit = async () => {
    if (!user || !profile) {
      toast.error("Please sign in to comment.");
      return;
    }
    const text = draft.trim();
    if (!text) return;
    if (containsBlockedChars(text)) {
      toast.error(BLOCKED_CHARS_HINT);
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      video_id: videoId,
      user_id: user.id,
      content: text,
      language: "auto",
      city_snapshot: profile.city || "Unknown",
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
    load();
  };

  const vote = async (commentId: string, value: 1 | -1) => {
    if (!user) {
      toast.error("Sign in to vote.");
      return;
    }
    const existing = myVotes[commentId];
    if (existing === value) {
      // toggle off
      await supabase.from("comment_votes").delete().eq("comment_id", commentId).eq("user_id", user.id);
    } else {
      await supabase
        .from("comment_votes")
        .upsert(
          { comment_id: commentId, user_id: user.id, vote: value },
          { onConflict: "comment_id,user_id" }
        );
    }
    load();
  };

  const translate = async (c: CommentRow) => {
    try {
      const res = await translateFn({ data: { text: c.content, targetLang } });
      setTranslations((m) => ({ ...m, [c.id]: res.translated }));
      if (res.error) toast.message(res.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translate failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Comments</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Translate to</span>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="rounded-md border border-border bg-input px-2 py-1 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {user ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <Textarea
            placeholder="Write in any language. Special chars not allowed."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Comments with 2 dislikes are auto-removed. Your city: {profile?.city || "Unknown"}
            </p>
            <Button onClick={submit} disabled={posting || !draft.trim()}>
              {posting ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
          Sign in to post and vote on comments.
        </div>
      )}

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No comments yet. Be the first.
          </li>
        )}
        {comments.map((c) => {
          const my = myVotes[c.id];
          return (
            <li key={c.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{c.display_name || "User"}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {c.city_snapshot || "Unknown"}
                  </span>
                </div>
                <time>{new Date(c.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
              {translations[c.id] && (
                <p className="mt-2 rounded-md bg-muted p-2 text-sm italic">
                  → {translations[c.id]}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <Button
                  variant={my === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => vote(c.id, 1)}
                >
                  <ThumbsUp className="mr-1 h-3.5 w-3.5" /> {c.likes_count}
                </Button>
                <Button
                  variant={my === -1 ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => vote(c.id, -1)}
                >
                  <ThumbsDown className="mr-1 h-3.5 w-3.5" /> {c.dislikes_count}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => translate(c)}>
                  <Languages className="mr-1 h-3.5 w-3.5" /> Translate
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
