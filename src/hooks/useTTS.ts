"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { TTSEngine } from "@/lib/audio/tts";

export function useTTS() {
  const [playing, setPlaying] = useState(false);
  const [backend, setBackend] = useState<string>("none");
  const engineRef = useRef<TTSEngine | null>(null);

  useEffect(() => {
    // Lazy-load the TTS module
    import("@/lib/audio/tts").then(async ({ getTTSEngine }) => {
      const engine = await getTTSEngine();
      engineRef.current = engine;
      setBackend(engine.backend);
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!engineRef.current) return;
    setPlaying(true);
    try {
      await engineRef.current.speak(text);
    } finally {
      setPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setPlaying(false);
  }, []);

  return { speak, stop, playing, backend, available: backend !== "none" };
}
