"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Student {
  id: string;
  name: string;
  school_system: string;
  grade: number;
  edition: string;
  algorithm: string;
  settings_json: { show_pinyin?: boolean; show_first_line?: boolean; new_poems_per_day?: number; max_reviews_per_session?: number; streak_freeze_enabled?: boolean };
}

interface StudentContextValue {
  student: Student | null;
  students: Student[];
  switchStudent: (id: string) => void;
  refresh: () => void;
  loading: boolean;
}

const StudentContext = createContext<StudentContextValue>({
  student: null, students: [], switchStudent: () => {}, refresh: () => {}, loading: true,
});

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/auth", "/invite/accept", "/onboarding"];

const CACHE_KEY = "kuibu:students:v1";
const CURRENT_ID_KEY = "kuibu:currentStudentId";

function readCache(): Student[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeCache(students: Student[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(students)); } catch { /* quota */ }
}

function clearStudentStorage() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CURRENT_ID_KEY);
    localStorage.removeItem("kuibu:students"); // remove pre-v1 key
  } catch { /* ignore */ }
}

export function StudentProvider({ children }: { children: ReactNode }) {
  const cached = typeof window !== "undefined" ? readCache() : [];
  const savedId = typeof window !== "undefined" ? (localStorage.getItem(CURRENT_ID_KEY) || null) : null;
  const initialId = cached.find((s) => s.id === savedId) ? savedId : (cached[0]?.id ?? null);
  const [students, setStudents] = useState<Student[]>(cached);
  const [currentId, setCurrentId] = useState<string | null>(initialId);
  const [loading, setLoading] = useState(cached.length === 0); // skip spinner if cache hit
  const [fetchKey, setFetchKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (isPublic) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearStudentStorage();
        router.push("/login?expired=1");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("students").select("id, name, school_system, grade, edition, algorithm, settings_json").then(({ data }) => {
      if (data) {
        const fresh = data as Student[];
        setStudents(fresh);
        writeCache(fresh);
        // Validate currentId against fresh data; reset to first student if deleted
        setCurrentId((prev) => {
          if (fresh.find((s) => s.id === prev)) return prev;
          const fallback = fresh[0]?.id ?? null;
          try { localStorage.setItem(CURRENT_ID_KEY, fallback ?? ""); } catch { /* quota */ }
          return fallback;
        });
      }
      setLoading(false);
    });
  }, [fetchKey]); // intentionally omit currentId — switching profiles doesn't need a refetch

  const refresh = useCallback(() => {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    setFetchKey((k) => k + 1);
  }, []);

  const switchStudent = useCallback((id: string) => {
    setCurrentId(id);
    try { localStorage.setItem(CURRENT_ID_KEY, id); } catch { /* quota */ }
  }, []);

  const student = students.find((s) => s.id === currentId) ?? null;

  useEffect(() => {
    if (!student) return;
    const showPinyin = student.settings_json?.show_pinyin ?? true;
    document.documentElement.classList.toggle("pinyin-hidden", !showPinyin);
  }, [student]);

  const value = {
    student,
    students,
    switchStudent,
    refresh,
    loading,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}
