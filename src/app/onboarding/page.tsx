"use client";

import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { levelFromSchoolSystem, maxGradeForSchoolSystem } from "@/lib/format";

type Algorithm = "SM2" | "LEITNER" | "FSRS";
type SchoolSystem = "六三" | "五四" | "高中";

const KNOWN_EDITIONS = ["人教", "苏教", "沪教", "北师", "语文", "长春", "鄂教", "鲁教", "河大", "北京", "粤教", "鲁人", "华师"];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [schoolSystem, setSchoolSystem] = useState<SchoolSystem>("六三");
  const [grade, setGrade] = useState<number>(1);
  const [edition, setEdition] = useState("人教");

  const [algorithm, setAlgorithm] = useState<Algorithm>("SM2");

  const handleSchoolSystemChange = (sys: SchoolSystem) => {
    setSchoolSystem(sys);
    if (grade > maxGradeForSchoolSystem(sys)) setGrade(1);
  };

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !session) throw new Error("Session expired. Please log in again.");

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          name: name.trim(),
          school_system: schoolSystem,
          level: levelFromSchoolSystem(schoolSystem),
          grade,
          edition,
          algorithm,
          created_by: user.id,
        })
        .select()
        .single();

      if (studentError) throw studentError;
      if (!student) throw new Error("Failed to create student");

      const { error: guardianError } = await supabase
        .from("student_guardians")
        .insert({
          student_id: student.id,
          guardian_id: user.id,
          role: "OWNER",
          accepted_at: new Date().toISOString(),
        });

      if (guardianError) throw guardianError;

      const { data: updated, error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
        .select("onboarding_completed")
        .single();

      if (profileError) throw profileError;
      if (!updated?.onboarding_completed) throw new Error("Profile update failed");

      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : "Failed to complete onboarding";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center gap-2 mb-8">
          <div
            className={`h-2 w-8 rounded-full transition-colors ${
              step === 1 ? "bg-primary" : "bg-border"
            }`}
          />
          <div
            className={`h-2 w-8 rounded-full transition-colors ${
              step === 2 ? "bg-primary" : "bg-border"
            }`}
          />
        </div>

        <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-8">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-heading text-text mb-6 text-center">
                {t("createStudent")}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    {t("schoolSystem")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["六三", "五四", "高中"] as SchoolSystem[]).map((sys) => (
                      <button
                        key={sys}
                        type="button"
                        onClick={() => handleSchoolSystemChange(sys)}
                        className={`py-2.5 rounded-[var(--radius-md)] text-[14px] font-medium transition-colors ${
                          schoolSystem === sys
                            ? "bg-primary text-white"
                            : "border border-border bg-bg text-text hover:border-primary"
                        }`}
                      >
                        {sys === "高中" ? "高中" : `${sys}学制`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    {t("grade")}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: maxGradeForSchoolSystem(schoolSystem) }, (_, i) => i + 1).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-2 rounded-[var(--radius-md)] text-[14px] font-medium transition-colors ${
                          grade === g
                            ? "bg-primary text-white"
                            : "border border-border bg-bg text-text hover:border-primary"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    {t("edition")}
                  </label>
                  <select
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {KNOWN_EDITIONS.map((ed) => (
                      <option key={ed} value={ed}>{ed}版</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-error text-sm text-center">{error}</p>
                )}

                <button
                  onClick={handleNext}
                  disabled={!name.trim()}
                  className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {t("next")}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-heading text-text mb-6 text-center">选择记忆算法</h2>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setAlgorithm("SM2")}
                  className={`w-full text-left border rounded-[var(--radius-md)] p-4 transition-colors ${
                    algorithm === "SM2"
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-bg hover:border-primary"
                  }`}
                >
                  <div className="font-medium text-text mb-1">SM-2</div>
                  <div className="text-sm text-text-secondary">
                    经典间隔重复算法，适合大多数学习场景
                  </div>
                </button>

                <button
                  onClick={() => setAlgorithm("LEITNER")}
                  className={`w-full text-left border rounded-[var(--radius-md)] p-4 transition-colors ${
                    algorithm === "LEITNER"
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-bg hover:border-primary"
                  }`}
                >
                  <div className="font-medium text-text mb-1">Leitner 盒子法</div>
                  <div className="text-sm text-text-secondary">
                    简单直观，适合低年级学生
                  </div>
                </button>

                <div className="w-full text-left border border-border bg-bg-muted rounded-[var(--radius-md)] p-4 opacity-60 cursor-not-allowed">
                  <div className="font-medium text-text mb-1 flex items-center gap-2">
                    FSRS
                    <span className="text-xs px-2 py-0.5 bg-bg-subtle rounded-full text-text-tertiary">
                      敬请期待
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary">
                    下一代间隔重复算法，使用神经网络优化
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-error text-sm text-center mb-4">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 border border-border text-text rounded-[var(--radius-pill)] py-3 font-medium hover:bg-bg-muted transition-colors disabled:opacity-50"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : t("done")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
