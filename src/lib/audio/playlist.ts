/**
 * Playlist generation for ear training modes.
 *
 * Queries all due poems for a student. Orders by priority (lowest stability first).
 * Passive mode: assigns repetition weights (low stability = 2-3x per cycle).
 * Active mode: each poem plays once.
 */

import { createClient } from "@/lib/supabase/client";
import { poemToRecitationText } from "./tts";

export interface PlaylistItem {
  poemId: string;
  title: string;
  author: string;
  text: string;
  stability: number;
  repetitions: number; // how many times to play in passive mode
}

export async function generatePlaylist(
  studentId: string,
  mode: "passive" | "active"
): Promise<PlaylistItem[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("poem_reviews")
    .select("poem_id, interval_days, fsrs_stability, poems(title, author, dynasty, content_lines)")
    .eq("student_id", studentId)
    .lte("next_review_at", new Date().toISOString())
    .order("interval_days", { ascending: true });

  if (!data || data.length === 0) return [];

  return data
    .filter((r: any) => r.poems)
    .map((r: any) => {
      const stability = r.fsrs_stability ?? r.interval_days ?? 1;
      const lines = r.poems.content_lines as any[];
      const text = poemToRecitationText(r.poems.title, r.poems.author, lines);

      // Passive mode: low stability poems get more repetitions
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

/**
 * Expand playlist with repetitions for passive mode.
 * Returns a flat array where low-stability poems appear multiple times.
 */
export function expandPlaylist(items: PlaylistItem[]): PlaylistItem[] {
  const expanded: PlaylistItem[] = [];
  for (const item of items) {
    for (let i = 0; i < item.repetitions; i++) {
      expanded.push(item);
    }
  }
  return expanded;
}
