"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { nameInitial } from "@/lib/format";

export function ProfileSwitcher() {
  const { student, students, switchStudent, loading } = useStudent();
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (loading || !student) {
    return (
      <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
          学
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg-muted transition-colors"
        aria-label="Switch profile"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
          {nameInitial(student.name)}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] min-w-[160px] bg-bg-subtle rounded-[var(--radius-lg)] shadow-lg overflow-hidden border border-border-subtle">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                switchStudent(s.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-[14px] transition-colors ${
                s.id === student.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text hover:bg-bg-muted"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-medium">
                  {nameInitial(s.name)}
                </div>
                <div>
                  <div className="leading-tight">{s.name}</div>
                  <div className="text-[11px] text-text-secondary">
                    {s.edition}版 · {s.school_system === "高中" ? "高中" : `${s.school_system}学制`}{s.grade ? ` · ${s.grade}年级` : ""}
                  </div>
                </div>
              </div>
            </button>
          ))}
          <div className="border-t border-border-subtle">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-secondary hover:bg-bg-muted hover:text-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t("profile")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
