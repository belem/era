"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { createClient } from "@/lib/supabase/client";
import { hasPlan, tierConfig, type Plan } from "@/lib/tier";
import type { AlgorithmName } from "@/lib/srs/types";

const algorithms: { key: AlgorithmName; icon: string; descKey: string }[] = [
  { key: "SM2", icon: "/icons/curve.svg", descKey: "sm2Desc" },
  { key: "LEITNER", icon: "/icons/boxes.svg", descKey: "leitnerDesc" },
  { key: "FSRS", icon: "/icons/brain.svg", descKey: "fsrsDesc" },
];

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[14px] text-text">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-[44px] h-[44px] flex items-center justify-center text-primary text-[20px] disabled:opacity-30"
          aria-label={`Decrease ${label}`}
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
        >
          -
        </button>
        <span className="text-[17px] text-text w-8 text-center tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-[44px] h-[44px] flex items-center justify-center text-primary text-[20px] disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function LearningTab() {
  const t = useTranslations("settings");
  const { student, refresh } = useStudent();

  const settings = student?.settings_json;

  const [userPlan, setUserPlan] = useState<string>("FREE");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("users")
        .select("plan")
        .eq("id", data.user.id)
        .single()
        .then(({ data: row }) => {
          if (row?.plan) setUserPlan(row.plan as Plan);
        });
    });
  }, []);

  const [activeAlgo, setActiveAlgo] = useState<AlgorithmName>(
    (student?.algorithm as AlgorithmName) ?? "SM2"
  );
  const [expanded, setExpanded] = useState<AlgorithmName | null>(null);
  const [showPinyin, setShowPinyin] = useState(settings?.show_pinyin ?? true);
  const [showFirstLine, setShowFirstLine] = useState(settings?.show_first_line ?? false);
  const [newPoems, setNewPoems] = useState(settings?.new_poems_per_day ?? 3);
  const [maxReviews, setMaxReviews] = useState(settings?.max_reviews_per_session ?? 15);
  const [streakFreeze, setStreakFreeze] = useState(settings?.streak_freeze_enabled ?? true);
  const [switching, setSwitching] = useState(false);

  // Sync settings state when student data loads (e.g. after cache miss)
  useEffect(() => {
    if (!student) return;
    const s = student.settings_json;
    setActiveAlgo((student.algorithm as AlgorithmName) ?? "SM2");
    setShowPinyin(s?.show_pinyin ?? true);
    setShowFirstLine(s?.show_first_line ?? false);
    setNewPoems(s?.new_poems_per_day ?? 3);
    setMaxReviews(s?.max_reviews_per_session ?? 15);
    setStreakFreeze(s?.streak_freeze_enabled ?? true);
  }, [student?.id]);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveSettings = useCallback((patch: Record<string, unknown>) => {
    if (!student) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const merged = { ...(student.settings_json ?? {}), ...patch };
      await supabase
        .from("students")
        .update({ settings_json: merged })
        .eq("id", student.id);
      refresh();
    }, 600);
  }, [student, refresh]);

  const handleAlgorithmSwitch = async (algo: AlgorithmName) => {
    if (algo === activeAlgo || !student) return;
    if (!confirm(t("algorithmConfirm"))) return;

    setSwitching(true);
    try {
      const supabase = createClient();
      // Update student's algorithm
      await supabase
        .from("students")
        .update({ algorithm: algo })
        .eq("id", student.id);

      // Trigger migration via schedule API
      const res = await fetch("/api/schedule/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, algorithm: algo }),
      });

      if (!res.ok) {
        // Rollback
        await supabase
          .from("students")
          .update({ algorithm: activeAlgo })
          .eq("id", student.id);
        return;
      }

      setActiveAlgo(algo);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Algorithm section */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("algorithm")}
        </h3>
        <div className="space-y-2" role="radiogroup" aria-label={t("algorithm")}>
          {algorithms.map((algo) => {
            const isActive = activeAlgo === algo.key;
            const isExpanded = expanded === algo.key;
            const isLocked = algo.key === "FSRS" && !hasPlan(userPlan as Plan, tierConfig.fsrs);
            return (
              <div
                key={algo.key}
                className={`bg-bg-subtle rounded-[var(--radius-lg)] transition-all ${
                  isActive ? "border-2 border-primary" : "border-2 border-transparent"
                } ${isLocked ? "opacity-50" : ""}`}
              >
                <button
                  role="radio"
                  aria-checked={isActive}
                  aria-expanded={isExpanded}
                  disabled={switching || isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    if (isExpanded) {
                      setExpanded(null);
                    } else {
                      setExpanded(algo.key);
                    }
                  }}
                  className={`w-full flex items-center px-4 h-[52px] gap-3 ${isLocked ? "cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isActive ? "border-primary" : "border-text-tertiary"
                    }`}
                  >
                    {isActive && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="flex-1 text-left text-[15px] text-text font-medium">{algo.key}</span>
                  {isLocked ? (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      Pro
                    </span>
                  ) : (
                  <svg
                    className={`w-4 h-4 text-text-tertiary transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  )}
                </button>

                {isExpanded && !isLocked && (
                  <div className="px-4 pb-4 pt-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={algo.icon}
                        alt=""
                        className="w-6 h-6 mt-0.5 opacity-60"
                      />
                      <p className="text-[14px] text-text-secondary leading-relaxed">
                        {t(algo.descKey)}
                      </p>
                    </div>
                    {!isActive && (
                      <button
                        onClick={() => handleAlgorithmSwitch(algo.key)}
                        disabled={switching}
                        className="text-[14px] text-primary hover:underline disabled:opacity-50"
                      >
                        {switching ? t("migrating") : t("switchTo", { algo: algo.key })}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Session section */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-1">
          {t("session")}
        </h3>
        <div className="flex items-center justify-between py-3">
          <span className="text-[14px] text-text">{t("showPinyin")}</span>
          <button
            role="switch"
            aria-checked={showPinyin}
            onClick={() => {
              const next = !showPinyin;
              setShowPinyin(next);
              saveSettings({ show_pinyin: next });
              document.documentElement.classList.toggle("pinyin-hidden", !next);
            }}
            className={`relative w-[51px] h-[31px] rounded-full transition-colors ${
              showPinyin ? "bg-primary" : "bg-bg-muted"
            }`}
          >
            <div
              className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${
                showPinyin ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-[14px] text-text">{t("showFirstLine")}</span>
          <button
            role="switch"
            aria-checked={showFirstLine}
            onClick={() => {
              const next = !showFirstLine;
              setShowFirstLine(next);
              saveSettings({ show_first_line: next });
            }}
            className={`relative w-[51px] h-[31px] rounded-full transition-colors ${
              showFirstLine ? "bg-primary" : "bg-bg-muted"
            }`}
          >
            <div
              className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${
                showFirstLine ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>
        <Stepper
          label={t("newPoemsPerDay")}
          value={newPoems}
          min={1}
          max={20}
          onChange={(v) => {
            setNewPoems(v);
            saveSettings({ new_poems_per_day: v });
          }}
        />
        <Stepper
          label={t("maxReviewsPerSession")}
          value={maxReviews}
          min={5}
          max={50}
          onChange={(v) => {
            setMaxReviews(v);
            saveSettings({ max_reviews_per_session: v });
          }}
        />
      </section>

      {/* Streak section */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("streak")}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[14px] text-text">{t("streakFreeze")}</span>
            <p className="text-[14px] text-text-tertiary">{t("freezeCaption")}</p>
          </div>
          <button
            role="switch"
            aria-checked={streakFreeze}
            onClick={() => {
              const next = !streakFreeze;
              setStreakFreeze(next);
              saveSettings({ streak_freeze_enabled: next });
            }}
            className={`relative w-[51px] h-[31px] rounded-full transition-colors ${
              streakFreeze ? "bg-primary" : "bg-bg-muted"
            }`}
          >
            <div
              className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${
                streakFreeze ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Reset progress section */}
      <section>
        <h3 className="text-[13px] uppercase tracking-[0.08em] text-text-secondary mb-3">
          {t("resetSection")}
        </h3>
        <p className="text-[14px] text-text-tertiary mb-3">
          {t("resetDesc")}
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting}
            className="px-4 py-2 text-[14px] text-error border border-error rounded-[var(--radius-pill)] hover:bg-error hover:text-white transition-colors disabled:opacity-50"
          >
            {t("resetButton")}
          </button>
        ) : (
          <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-4 space-y-3">
            <p className="text-[14px] text-text font-medium">{t("resetConfirmTitle")}</p>
            <p className="text-[13px] text-text-tertiary">{t("resetConfirmDesc")}</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!student) return;
                  setResetting(true);
                  try {
                    const res = await fetch("/api/students/reset-progress", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ studentId: student.id }),
                    });
                    if (res.ok) {
                      setResetDone(true);
                      setTimeout(() => window.location.reload(), 1500);
                    }
                  } finally {
                    setResetting(false);
                    setShowResetConfirm(false);
                  }
                }}
                disabled={resetting}
                className="px-4 py-2 text-[14px] bg-error text-white rounded-[var(--radius-pill)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {resetting ? t("resetting") : t("resetConfirm")}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-[14px] border border-border rounded-[var(--radius-pill)] text-text-secondary hover:text-text transition-colors"
              >
                {t("resetCancel")}
              </button>
            </div>
          </div>
        )}
        {resetDone && (
          <p className="text-[13px] text-success mt-3">{t("resetSuccess")}</p>
        )}
      </section>
    </div>
  );
}
