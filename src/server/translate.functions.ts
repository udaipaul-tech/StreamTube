import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  text: z.string().min(1).max(2000),
  targetLang: z.string().min(2).max(20),
});

// Translate using Lovable AI Gateway (no API key needed by user — uses LOVABLE_API_KEY)
export const translateText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Schema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { translated: data.text, error: "AI not configured" };
    }
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a translator. Reply with ONLY the translated text. No quotes, no explanations.",
            },
            {
              role: "user",
              content: `Translate the following text to ${data.targetLang}:\n\n${data.text}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        return { translated: data.text, error: `Translate failed (${res.status})` };
      }
      const json = await res.json();
      const translated: string = json?.choices?.[0]?.message?.content?.trim() || data.text;
      return { translated, error: null as string | null };
    } catch (e) {
      return { translated: data.text, error: e instanceof Error ? e.message : "unknown" };
    }
  });
