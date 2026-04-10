"use client";

import { useState, useRef, useEffect } from "react";
import { useStudent } from "@/hooks/useStudent";

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
      <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-[12px] font-medium">
        学
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-[12px] font-medium hover:bg-white/30 transition-colors"
        aria-label="Switch profile"
      >
        {student.name.charAt(0)}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] min-w-[160px] bg-bg-subtle rounded-[var(--radius-lg)] border border-border shadow-lg overflow-hidden">
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
                  : "text-text hover:bg-bg-hover"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-medium">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="leading-tight">{s.name}</div>
                  <div className="text-[11px] text-text-secondary">
                    {s.grade}年级 · {s.edition}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
