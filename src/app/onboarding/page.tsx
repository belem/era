"use client";

import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Algorithm = "SM2" | "LEITNER" | "FSRS";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Student profile
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(1);
  const [edition] = useState("PEP");

  // Step 2: Algorithm selection
  const [algorithm, setAlgorithm] = useState<Algorithm>("SM2");

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Create student
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          name: name.trim(),
          grade,
          edition,
          algorithm,
          created_by: user.id,
        })
        .select()
        .single();

      if (studentError) throw studentError;
      if (!student) throw new Error("Failed to create student");

      // Create student-guardian relationship
      const { error: guardianError } = await supabase
        .from("student_guardians")
        .insert({
          student_id: student.id,
          guardian_id: user.id,
          role: "OWNER",
          accepted_at: new Date().toISOString(),
        });

      if (guardianError) throw guardianError;

      // Mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Redirect to home
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md">
        {/* Steps indicator */}
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

        {/* Card */}
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
                    {t("grade")}
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value, 10))}
                    className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">教材版本</label>
                  <div className="w-full border border-border rounded-[var(--radius-md)] bg-bg-muted px-4 py-3 text-text">
                    人教版 (PEP)
                  </div>
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
                {/* SM-2 */}
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

                {/* Leitner */}
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

                {/* FSRS (locked) */}
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
