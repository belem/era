import { createClient } from "@/lib/supabase/client";
import { poemToRecitationText } from "./tts";

export interface PlaylistItem {
  poemId: string;
  title: string;
  author: string;
  text: string;
  stability: number;
  repetitions: number;
}

export async function generatePlaylist(
  studentId: string,
  mode: "passive" | "active",
  options?: { maxReviewsPerSession?: number }
): Promise<PlaylistItem[]> {
  const supabase = createClient();
  const maxTotal = options?.maxReviewsPerSession ?? 15;

  const { data } = await supabase
    .from("poem_reviews")
    .select("poem_id, repetitions, last_reviewed_at, interval_days, fsrs_stability, sort_order, poems(title, author, dynasty, content_lines)")
    .eq("student_id", studentId)
    .lte("next_review_at", new Date().toISOString())
    .order("sort_order", { ascending: true })
    .order("interval_days", { ascending: true });

  if (!data || data.length === 0) return [];

  const reviewed = data.filter((r: any) => r.repetitions > 0 || r.last_reviewed_at);

  return reviewed
    .slice(0, maxTotal)
    .filter((r: any) => r.poems)
    .map((r: any) => {
      const stability = r.fsrs_stability ?? r.interval_days ?? 1;
      const lines = r.poems.content_lines as any[];
      const text = poemToRecitationText(r.poems.title, r.poems.author, lines);

      let repetitions = 1;
      if (mode === "passive") {
        if (stability <= 2) repetitions = 3;
        else if (stability <= 7) repetitions = 2;
      }

      return {
        poemId: r.poem_id,
        title: r.poems.title,
        author: r.poems.author,
        text,
        stability,
        repetitions,
      };
    });
}

export function expandPlaylist(items: PlaylistItem[]): PlaylistItem[] {
  const expanded: PlaylistItem[] = [];
  for (const item of items) {
    for (let i = 0; i < item.repetitions; i++) {
      expanded.push(item);
    }
  }
  return expanded;
}
