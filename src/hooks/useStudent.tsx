"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Student {
  id: string;
  name: string;
  level: string;
  grade: number;
  edition: string;
  algorithm: string;
  settings_json: { show_pinyin: boolean };
}

interface StudentContextValue {
  student: Student | null;
  students: Student[];
  switchStudent: (id: string) => void;
  loading: boolean;
}

const StudentContext = createContext<StudentContextValue>({
  student: null, students: [], switchStudent: () => {}, loading: true,
});

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/auth", "/invite/accept", "/onboarding"];

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (isPublic) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/login?expired=1");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("students").select("*").then(({ data }) => {
      if (data) {
        setStudents(data as Student[]);
        if (data.length > 0 && !currentId) setCurrentId(data[0].id);
      }
      setLoading(false);
    });
  }, [currentId]);

  const student = students.find((s) => s.id === currentId) ?? null;

  useEffect(() => {
    if (!student) return;
    const showPinyin = student.settings_json?.show_pinyin ?? true;
    document.documentElement.classList.toggle("pinyin-hidden", !showPinyin);
  }, [student]);

  const value = {
    student,
    students,
    switchStudent: setCurrentId,
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
