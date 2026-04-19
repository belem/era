"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { useTTS } from "@/hooks/useTTS";
import { generatePlaylist, expandPlaylist, type PlaylistItem } from "@/lib/audio/playlist";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PassiveListenPage() {
  const t = useTranslations("listen");
  const { student } = useStudent();
  const { speak, stop, playing, available } = useTTS();

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [poemsPlayed, setPoemsPlayed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const stopRequestedRef = useRef(false);

  // Load playlist
  useEffect(() => {
    if (!student) return;
    generatePlaylist(student.id, "passive").then((items) => {
      setPlaylist(expandPlaylist(items));
      setLoading(false);
    });
  }, [student]);

  const current = playlist[currentIndex];

  // Request Wake Lock
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch { /* Wake Lock not supported or denied */ }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  // Media Session metadata
  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.author,
      album: "Kuibu",
    });
    navigator.mediaSession.setActionHandler("pause", () => handleStop());
    navigator.mediaSession.setActionHandler("play", () => {
      if (!sessionActive) handleStart();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (currentIndex < playlist.length - 1) {
        stop();
        setCurrentIndex((prev) => prev + 1);
      }
    });
  }, [current, sessionActive]);

  const playNext = useCallback(async (index: number) => {
    if (index >= playlist.length || stopRequestedRef.current) {
      // Cycle repeats
      if (!stopRequestedRef.current && playlist.length > 0) {
        setCurrentIndex(0);
        playNext(0);
      }
      return;
    }

    setCurrentIndex(index);
    const item = playlist[index];
    setPoemsPlayed((prev) => prev + 1);

    // 1s pause between poems
    await new Promise((r) => setTimeout(r, 1000));
    if (stopRequestedRef.current) return;

    await speak(item.text);

    // 3s silence after poem
    await new Promise((r) => setTimeout(r, 3000));
    if (stopRequestedRef.current) return;

    playNext(index + 1);
  }, [playlist, speak]);

  const handleStart = useCallback(async () => {
    if (!student || playlist.length === 0) return;

    stopRequestedRef.current = false;
    setSessionActive(true);
    startTimeRef.current = Date.now();
    requestWakeLock();

    // Start listening session
    const res = await fetch("/api/listening", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", studentId: student.id, mode: "passive" }),
    });
    const data = await res.json();
    setSessionId(data.id);

    playNext(0);
  }, [student, playlist, requestWakeLock, playNext]);

  const handleStop = useCallback(async () => {
    stopRequestedRef.current = true;
    stop();
    setSessionActive(false);
    releaseWakeLock();

    if (sessionId && student) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      await fetch("/api/listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          sessionId,
          poemsPlayed,
          poemsRated: 0,
          durationSeconds: duration,
        }),
      });
    }
  }, [sessionId, student, poemsPlayed, stop, releaseWakeLock]);

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-[360px] mx-auto text-center space-y-8">
          <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight">
            {t("passiveTitle")}
          </h1>
          <p className="text-[14px] text-text-secondary">
            {t("passiveDesc")}
          </p>

          {loading ? (
            <div className="text-text-tertiary text-[14px]">Loading...</div>
          ) : !available ? (
            <p className="text-text-tertiary text-[14px]">{t("noTTS")}</p>
          ) : playlist.length === 0 ? (
            <div>
              <p className="text-text-tertiary text-[14px] mb-4">{t("noPoems")}</p>
              <Link href="/" className="text-primary text-[14px] hover:underline">{t("backHome")}</Link>
            </div>
          ) : sessionActive ? (
            <div className="space-y-6">
              {/* Now playing */}
              <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8">
                <p className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                  {t("nowPlaying")}
                </p>
                <p className="font-heading font-semibold text-[21px] text-text">
                  {current?.title}
                </p>
                <p className="text-[14px] text-text-secondary mt-1">
                  {current?.author}
                </p>
                <p className="text-[12px] text-text-tertiary mt-4">
                  {currentIndex + 1} / {playlist.length}
                </p>

                {/* Animated playback indicator */}
                {playing && (
                  <div className="flex items-end justify-center gap-1 mt-4 h-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        style={{
                          animation: `barBounce 1.2s ease-in-out ${i * 0.1}s infinite`,
                          height: "4px",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleStop}
                className="w-full py-3 bg-bg-subtle text-text rounded-[var(--radius-pill)] font-ui text-[17px] transition-colors hover:bg-bg-muted"
              >
                {t("stopListening")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[14px] text-text-tertiary">
                {t("poemCount", { count: playlist.length })}
              </p>
              <button
                onClick={handleStart}
                className="w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] font-ui text-[17px] transition-colors hover:bg-primary-hover"
              >
                {t("startListening")}
              </button>
              <Link href="/listen/active" className="block text-primary text-[14px] hover:underline">
                {t("switchToActive")}
              </Link>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes barBounce {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
      `}</style>
    </>
  );
}
