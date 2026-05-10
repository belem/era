"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { nameInitial, maxGradeForSchoolSystem } from "@/lib/format";

interface Badge {
  id: string;
  icon: string;
  unlocked: boolean;
}

const SCHOOL_SYSTEMS = ["六三", "五四", "高中"] as const;
const EDITIONS = ["人教", "苏教", "沪教", "北师", "语文", "长春", "鄂教", "鲁教"] as const;

function StudentCard() {
  const t = useTranslations("profile");
  const { student } = useStudent();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [schoolSystem, setSchoolSystem] = useState("");
  const [grade, setGrade] = useState(1);
  const [edition, setEdition] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetChoice, setShowResetChoice] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setSchoolSystem(student.school_system);
      setGrade(student.grade);
      setEdition(student.edition);
    }
  }, [student]);

  const curriculumChanged = student
    ? schoolSystem !== student.school_system || grade !== student.grade || edition !== student.edition
    : false;

  const [saveError, setSaveError] = useState("");

  const doSave = async (resetProgress: boolean) => {
    if (!student || !name.trim()) return;
    setSaving(true);
    setSaveError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("students")
      .update({ name: name.trim(), school_system: schoolSystem, grade, edition })
      .eq("id", student.id);

    if (updateError) {
      setSaveError(updateError.message);
      setSaving(false);
      return;
    }

    if (resetProgress) {
      await fetch("/api/students/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
    }

    setSaving(false);
    setSaved(true);
    setEditing(false);
    setShowResetChoice(false);
    setTimeout(() => setSaved(false), 2000);
    window.location.reload();
  };

  const handleSave = async () => {
    if (!student || !name.trim()) return;
    if (curriculumChanged) {
      setShowResetChoice(true);
      return;
    }
    doSave(false);
  };

  if (!student) return null;

  if (editing) {
    return (
      <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-8 md:mb-0 space-y-4">
        <div>
          <label className="text-[12px] text-text-secondary block mb-1">{t("name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2.5 text-[15px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[12px] text-text-secondary block mb-1">{t("edition")}</label>
            <select
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2.5 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {EDITIONS.map((ed) => (
                <option key={ed} value={ed}>{ed}版</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-text-secondary block mb-1">{t("schoolSystem")}</label>
            <select
              value={schoolSystem}
              onChange={(e) => {
                setSchoolSystem(e.target.value);
                if (grade > maxGradeForSchoolSystem(e.target.value)) setGrade(1);
              }}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2.5 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SCHOOL_SYSTEMS.map((sys) => (
                <option key={sys} value={sys}>{sys === "高中" ? "高中" : `${sys}学制`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-text-secondary block mb-1">{t("grade")}</label>
            <select
              value={grade}
              onChange={(e) => setGrade(parseInt(e.target.value, 10))}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2.5 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: maxGradeForSchoolSystem(schoolSystem) }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

        </div>

        {!showResetChoice ? (
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-5 py-2 bg-primary text-white rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {t("save")}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setShowResetChoice(false);
                setSaveError("");
                setName(student.name);
                setSchoolSystem(student.school_system);
                setGrade(student.grade);
                setEdition(student.edition);
              }}
              className="px-5 py-2 border border-border rounded-[var(--radius-pill)] text-[14px] text-text-secondary hover:text-text transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <div className="bg-bg rounded-[var(--radius-lg)] border border-border p-4 space-y-3 mt-1">
            {saveError && <p className="text-[13px] text-error" role="alert">{saveError}</p>}
            <p className="text-[14px] text-text font-medium">{t("resetChoiceTitle")}</p>
            <p className="text-[13px] text-text-tertiary">{t("resetChoiceDesc")}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => doSave(false)}
                disabled={saving}
                className="px-4 py-2.5 text-[14px] bg-primary text-white rounded-[var(--radius-pill)] hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {t("keepProgress")}
              </button>
              <button
                onClick={() => doSave(true)}
                disabled={saving}
                className="px-4 py-2.5 text-[14px] text-error border border-error rounded-[var(--radius-pill)] hover:bg-error hover:text-white transition-colors disabled:opacity-50"
              >
                {t("resetProgress")}
              </button>
              <button
                onClick={() => setShowResetChoice(false)}
                className="px-4 py-2 text-[14px] text-text-tertiary hover:text-text transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-8 md:mb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-text text-bg flex items-center justify-center text-lg font-medium">
            {nameInitial(student.name)}
          </div>
          <div>
            <div className="font-heading font-semibold text-[17px] tracking-tight">
              {student.name}
            </div>
            <div className="text-[14px] text-text-tertiary tracking-tight">
              {student.edition}版 · {student.school_system === "高中" ? "高中" : `${student.school_system}学制`} <br/>{t("gradeInfo", { grade: "一二三四五六七八九".at(Number(student.grade) - 1) ?? student.grade })}
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 px-3 rounded-[var(--radius-pill)] border border-border text-[14px] text-primary hover:bg-primary hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {t("edit")}
        </button>
      </div>
      {saved && (
        <p className="text-[13px] text-success mt-3">{t("saved")}</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tb = useTranslations("badges");
  const { student } = useStudent();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!student) return;
    const supabase = createClient();

    Promise.all([
      supabase.from("badges").select("id, icon"),
      supabase.from("badge_unlocks").select("badge_id").eq("student_id", student.id),
    ]).then(([{ data: allBadges }, { data: unlocks }]) => {
      const unlockedIds = new Set(unlocks?.map((u) => u.badge_id) ?? []);
      setBadges(
        (allBadges ?? []).map((b) => ({
          id: b.id,
          icon: b.icon,
          unlocked: unlockedIds.has(b.id),
        }))
      );
    });
  }, [student]);

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-20 xl:px-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight">
            {t("title")}
          </h1>
          <div className="flex gap-4">
            <Link
              href="/analytics"
              className="text-[14px] text-primary hover:underline"
            >
              {t("analytics")}
            </Link>
            <Link
              href="/settings"
              className="text-[14px] text-primary hover:underline"
            >
              {t("settings")}
            </Link>
          </div>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-8">
          <StudentCard />

          {/* Badges */}
          <div>
            <h2 className="text-[13px] uppercase tracking-[0.08em] text-text-tertiary mb-4">
              {t("achievements")}
            </h2>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 justify-items-center" role="list">
              {badges.map((badge) => {
                const badgeName = tb(`${badge.icon}.name`);
                const status = badge.unlocked ? t("unlocked") : t("locked");
                return (
                  <div
                    key={badge.id}
                    role="listitem"
                    aria-label={`${badgeName}, ${status}`}
                    title={`${badgeName} — ${tb(`${badge.icon}.desc`)}`}
                    className={`w-[52px] h-[52px] rounded-[var(--radius-md)] flex items-center justify-center ${
                      badge.unlocked
                        ? "border-2 border-badge-1 bg-bg-subtle"
                        : "border border-border bg-bg-muted opacity-30"
                    }`}
                  >
                    <img
                      src={`/badges/${badge.icon}.svg`}
                      alt={badgeName}
                      className={`w-6 h-6 ${badge.unlocked ? "text-text" : "text-text-tertiary"}`}
                    />
                  </div>
                );
              })}
              {badges.length === 0 && (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-[52px] h-[52px] rounded-[var(--radius-md)] border border-border bg-bg-muted opacity-30 animate-pulse"
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <TabBar />
    </>
  );
}
