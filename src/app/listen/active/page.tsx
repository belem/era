"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { useTTS } from "@/hooks/useTTS";
import { generatePlaylist, type PlaylistItem } from "@/lib/audio/playlist";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Rating } from "@/lib/srs/types";

const RATING_TIMEOUT_MS = 10_000; // Auto-rate as "good" after 10s
const RATING_COLORS: Record<Rating, string> = {
  forgot: "var(--error)",
  hard: "var(--warning)",
  good: "var(--primary)",
  easy: "var(--success)",
};

export default function ActiveListenPage() {
  const t = useTranslations("listen");
  const tRating = useTranslations("rating");
  const { student } = useStudent();
  const { speak, stop: stopTTS, playing, available } = useTTS();

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "rating" | "done">("idle");
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [poemsRated, setPoemsRated] = useState(0);
  const [ratings, setRatings] = useState<Record<Rating, number>>({ forgot: 0, hard: 0, good: 0, easy: 0 });

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const recognitionRef = useRef<any>(null);

  const current = playlist[currentIndex];

  // Load playlist
  useEffect(() => {
    if (!student) return;
    const settings = student.settings_json as { max_reviews_per_session?: number } | undefined;
    generatePlaylist(student.id, "active", {
      maxReviewsPerSession: settings?.max_reviews_per_session ?? 15,
    }).then((items) => {
      setPlaylist(items);
      setLoading(false);
    });
  }, [student]);

  const submitRating = useCallback(async (rating: Rating) => {
    if (!student || !current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopVoiceRecognition();

    setRatings((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    setPoemsRated((prev) => prev + 1);

    // Submit to SRS
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, poemId: current.poemId, rating }),
    });

    if (currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setPhase("playing");
    } else {
      setPhase("done");
      endSession();
    }
  }, [student, current, currentIndex, playlist.length]);

  // Voice recognition (Channel 1)
  const startVoiceRecognition = useCallback(() => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = false;

    const commandMap: Record<string, Rating> = {
      "淡忘": "forgot", "forgot": "forgot",
      "艰难": "hard", "hard": "hard",
      "尚可": "good", "good": "good",
      "轻松": "easy", "easy": "easy",
    };

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        const transcript = last[0].transcript.trim().toLowerCase();
        for (const [cmd, rating] of Object.entries(commandMap)) {
          if (transcript.includes(cmd)) {
            submitRating(rating);
            return;
          }
        }
      }
    };

    recognition.onerror = () => { /* Voice recognition error, fallback to other channels */ };
    recognition.start();
    recognitionRef.current = recognition;
  }, [submitRating]);

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Media Session (Channel 2 — headphone buttons)
  useEffect(() => {
    if (!("mediaSession" in navigator) || phase !== "rating") return;

    // Single tap = Good
    navigator.mediaSession.setActionHandler("play", () => submitRating("good"));
    // nexttrack = Easy
    navigator.mediaSession.setActionHandler("nexttrack", () => submitRating("easy"));
    // previoustrack = Hard
    navigator.mediaSession.setActionHandler("previoustrack", () => submitRating("hard"));
    // stop = Forgot
    navigator.mediaSession.setActionHandler("stop", () => submitRating("forgot"));

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
  }, [phase, submitRating]);

  // Play current poem
  useEffect(() => {
    if (phase !== "playing" || !current) return;

    let cancelled = false;
    (async () => {
      await speak(current.text);
      if (cancelled) return;
      // Chime sound (brief notification that rating is needed)
      // Use a short beep via AudioContext
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 800;
        gain.gain.value = 0.15;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        await new Promise((r) => setTimeout(r, 200));
      } catch { /* Audio not available */ }

      if (cancelled) return;
      setPhase("rating");

      // Start voice recognition
      startVoiceRecognition();

      // Auto-rate timeout
      timeoutRef.current = setTimeout(() => {
        submitRating("good");
      }, RATING_TIMEOUT_MS);
    })();

    return () => { cancelled = true; };
  }, [phase, current]);

  const handleStart = async () => {
    if (!student || playlist.length === 0) return;

    setPhase("playing");
    startTimeRef.current = Date.now();

    // Wake Lock
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch { /* ignored */ }

    // Start session
    const res = await fetch("/api/listening", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", studentId: student.id, mode: "active" }),
    });
    const data = await res.json();
    setSessionId(data.id);
  };

  const endSession = async () => {
    stopTTS();
    stopVoiceRecognition();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    wakeLockRef.current?.release();

    if (sessionId && student) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      await fetch("/api/listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          sessionId,
          poemsPlayed: currentIndex + 1,
          poemsRated,
          durationSeconds: duration,
        }),
      });
    }
  };

  const handleStop = () => {
    setPhase("done");
    endSession();
  };

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-[360px] mx-auto text-center space-y-8 w-full">
          <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight">
            {t("activeTitle")}
          </h1>

          {loading ? (
            <div className="text-text-tertiary text-[14px]">Loading...</div>
          ) : !available ? (
            <p className="text-text-tertiary text-[14px]">{t("noTTS")}</p>
          ) : playlist.length === 0 ? (
            <div>
              <p className="text-text-tertiary text-[14px] mb-4">{t("noPoems")}</p>
              <Link href="/" className="text-primary text-[14px] hover:underline">{t("backHome")}</Link>
            </div>
          ) : phase === "idle" ? (
            <div className="space-y-4">
              <p className="text-[14px] text-text-secondary">{t("activeDesc")}</p>
              <p className="text-[14px] text-text-tertiary">{t("poemCount", { count: playlist.length })}</p>
              <button
                onClick={handleStart}
                className="w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] font-ui text-[17px] transition-colors hover:bg-primary-hover"
              >
                {t("startListening")}
              </button>
              <Link href="/listen" className="block text-primary text-[14px] hover:underline">
                {t("switchToPassive")}
              </Link>
            </div>
          ) : phase === "playing" ? (
            <div className="space-y-6">
              <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8">
                <p className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                  {t("nowPlaying")}
                </p>
                <p className="font-heading font-semibold text-[21px] text-text">
                  {current?.title}
                </p>
                <p className="text-[14px] text-text-secondary mt-1">{current?.author}</p>
                <p className="text-[12px] text-text-tertiary mt-4">
                  {currentIndex + 1} / {playlist.length}
                </p>
              </div>
              <button
                onClick={handleStop}
                className="text-text-secondary text-[14px] hover:text-text transition-colors"
              >
                {t("stopListening")}
              </button>
            </div>
          ) : phase === "rating" ? (
            <div className="space-y-6">
              <p className="text-[14px] text-text-secondary">{t("rateNow")}</p>
              <p className="font-heading font-semibold text-[17px] text-text">{current?.title}</p>

              {/* Channel 3 — Screen tap zones */}
              <div className="grid grid-cols-2 gap-3">
                {(["forgot", "hard", "good", "easy"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => submitRating(r)}
                    className="h-20 rounded-[var(--radius-lg)] text-white font-ui text-[17px] font-medium transition-transform active:scale-95"
                    style={{ backgroundColor: RATING_COLORS[r] }}
                  >
                    {tRating(r)}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-text-tertiary">{t("autoRateHint")}</p>

              <button
                onClick={handleStop}
                className="text-text-secondary text-[14px] hover:text-text transition-colors"
              >
                {t("stopListening")}
              </button>
            </div>
          ) : (
            /* Done */
            <div className="space-y-6">
              <h2 className="font-heading font-semibold text-[21px] text-text">
                {t("sessionComplete")}
              </h2>
              <p className="text-[14px] text-text-secondary">
                {t("reviewedCount", { count: poemsRated })}
              </p>
              <div className="space-y-2">
                {(["forgot", "hard", "good", "easy"] as const).map((r) => {
                  const count = ratings[r];
                  const total = poemsRated || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <span className="text-[13px] text-text-secondary w-12 text-right">{tRating(r)}</span>
                      <div className="flex-1 h-2 bg-bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: RATING_COLORS[r] }}
                        />
                      </div>
                      <span className="text-[12px] text-text-tertiary w-6">{count}</span>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/"
                className="block w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] text-center font-ui text-[17px] transition-colors hover:bg-primary-hover"
              >
                {t("done")}
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
