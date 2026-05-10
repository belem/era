"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useStudent } from "@/hooks/useStudent";
import { nameInitial } from "@/lib/format";

export function ProfileSwitcher() {
  const { student, students, switchStudent, loading } = useStudent();
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
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg-muted transition-colors cursor-pointer"
        aria-label="Switch profile"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
          {nameInitial(student.name)}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] min-w-[160px] bg-bg-subtle rounded-[var(--radius-lg)] shadow-lg overflow-hidden border border-border-subtle">
          {students.map((s) => (
            <Link
              key={s.id}
              href="/profile"
              className={`w-full px-4 py-2.5 text-left text-[14px] transition-colors cursor-pointer flex items-center gap-2.5 ${
                s.id === student.id
                  ? "text-primary font-medium"
                  : "text-text hover:bg-bg-muted"
              }`}
              onClick={() => {
                switchStudent(s.id);
                setIsOpen(false);
              }}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-medium shrink-0">
                {nameInitial(s.name)}
              </div>
              <div>
                <div className="leading-tight">{s.name}</div>
                <div className="text-[11px] text-text-secondary">
                  {s.edition} · {s.school_system === "高中" ? "高中" : s.school_system}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {s.grade ? `${"一二三四五六七八九".at(Number(s.grade) - 1) ?? s.grade}年级` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
