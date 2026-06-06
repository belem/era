"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { createClient } from "@/lib/supabase/client";
import { nameInitial } from "@/lib/format";

export function ProfileSwitcher() {
  const t = useTranslations("profileMenu");
  const router = useRouter();
  const { student, students, switchStudent, loading } = useStudent();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Outside-click + Escape close
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Hard redirect so middleware re-evaluates and any cached state clears.
    window.location.href = "/login";
  };

  // Avatar shown in the trigger. Loading-or-empty falls back to a generic mark.
  const initial = student ? nameInitial(student.name) : "学";
  const triggerLabel = student ? `${t("openLabel")}: ${student.name}` : t("openLabel");

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg-muted transition-colors"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
          {loading && !student ? (
            <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            initial
          )}
        </div>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] min-w-[240px] bg-bg-subtle rounded-[var(--radius-lg)] shadow-lg overflow-hidden border border-border-subtle z-50"
        >
          {/* Student section */}
          {students.length > 0 ? (
            <div className="py-1">
              <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                {t("switchProfile")}
              </div>
              {students.map((s) => {
                const active = s.id === student?.id;
                return (
                  <button
                    key={s.id}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      if (!active) switchStudent(s.id);
                      setIsOpen(false);
                      router.push("/profile");
                    }}
                    className={`w-full px-4 py-2.5 text-left text-[14px] transition-colors flex items-center gap-2.5 ${
                      active ? "text-primary font-medium bg-primary/5" : "text-text hover:bg-bg-muted"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-medium shrink-0">
                      {nameInitial(s.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="leading-tight truncate">{s.name}</div>
                      <div className="text-[11px] text-text-secondary truncate">
                        {s.edition} · {s.school_system}
                        {s.grade ? ` · ${"一二三四五六七八九".at(Number(s.grade) - 1) ?? s.grade}年级` : ""}
                      </div>
                    </div>
                    {active && (
                      <span className="text-[10px] text-primary font-medium uppercase tracking-wider shrink-0">
                        {t("currentLabel")}
                      </span>
                    )}
                  </button>
                );
              })}
              <Link
                role="menuitem"
                href="/onboarding"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2.5 text-left text-[14px] text-text-secondary hover:bg-bg-muted hover:text-text transition-colors flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center text-text-tertiary shrink-0" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                {t("addProfile")}
              </Link>
            </div>
          ) : (
            <Link
              role="menuitem"
              href="/onboarding"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-[14px] text-text hover:bg-bg-muted transition-colors"
            >
              <div className="text-[12px] text-text-tertiary mb-0.5">{t("noStudentsYet")}</div>
              <div className="text-primary font-medium">{t("addFirstStudent")}</div>
            </Link>
          )}

          <div className="h-px bg-border-subtle" role="separator" />

          {/* Account section */}
          <div className="py-1">
            <Link
              role="menuitem"
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2.5 text-left text-[14px] text-text hover:bg-bg-muted transition-colors flex items-center gap-2.5"
            >
              <svg className="text-text-secondary shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              {t("settings")}
            </Link>

            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full px-4 py-2.5 text-left text-[14px] text-error hover:bg-error/5 transition-colors flex items-center gap-2.5 disabled:opacity-50"
            >
              <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
