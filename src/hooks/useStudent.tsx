"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface Student {
  id: string;
  name: string;
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

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
