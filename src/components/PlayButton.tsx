"use client";

import { useTTS } from "@/hooks/useTTS";
import { poemToRecitationText } from "@/lib/audio/tts";
import type { Poem } from "@/types/poem";

interface PlayButtonProps {
  poem: Poem;
  className?: string;
}

export function PlayButton({ poem, className = "" }: PlayButtonProps) {
  const { speak, stop, playing, available } = useTTS();

  if (!available) return null;

  const handleClick = () => {
    if (playing) {
      stop();
    } else {
      const text = poemToRecitationText(poem.title, poem.author, poem.lines);
      speak(text);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-10 h-10 flex items-center justify-center rounded-full border border-border hover:border-primary transition-colors ${className}`}
      aria-label={playing ? "Stop audio" : "Play poem"}
    >
      {playing ? (
        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
