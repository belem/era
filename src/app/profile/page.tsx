"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Badge {
  id: string;
  icon: string;
  unlocked: boolean;
}

const LEVELS = ["小学", "初中", "高中"] as const;
const EDITIONS = ["部编", "苏教", "北师大"] as const;

function gradeOptions(level: string) {
  if (level === "小学") return [1, 2, 3, 4, 5, 6];
  if (level === "初中") return [1, 2, 3];
  return [1, 2, 3];
}

function StudentCard() {
  const t = useTranslations("profile");
  const { student } = useStudent();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [grade, setGrade] = useState(1);
  const [edition, setEdition] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setLevel(student.level);
      setGrade(student.grade);
      setEdition(student.edition);
    }
  }, [student]);

  const handleSave = async () => {
    if (!student || !name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("students")
      .update({ name: name.trim(), level, grade, edition })
      .eq("id", student.id);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
    window.location.reload();
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
            <label className="text-[12px] text-text-secondary block mb-1">{t("level")}</label>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setGrade(1);
              }}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2.5 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
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
              {gradeOptions(level).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-text-secondary block mb-1">{t("edition")}</label>
            <select
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2.5 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {EDITIONS.map((ed) => (
                <option key={ed} value={ed}>{ed}</option>
              ))}
            </select>
          </div>
        </div>

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
              setName(student.name);
              setLevel(student.level);
              setGrade(student.grade);
              setEdition(student.edition);
            }}
            className="px-5 py-2 border border-border rounded-[var(--radius-pill)] text-[14px] text-text-secondary hover:text-text transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-8 md:mb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-text text-bg flex items-center justify-center text-lg font-medium">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="font-heading font-semibold text-[17px] tracking-tight">
              {student.name}
            </div>
            <div className="text-[14px] text-text-tertiary tracking-tight">
              {student.level}{t("gradeInfo", { grade: student.grade })} · {t("editionInfo", { edition: student.edition })}
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-[14px] text-primary hover:underline"
        >
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
      supabase.from("badges").select("*"),
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
      <ThemeToggle />
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
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-5" role="list">
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
