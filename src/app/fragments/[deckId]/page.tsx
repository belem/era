"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Fragment } from "@/types/fragment";

export default function DeckDetailPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const t = useTranslations("fragments");
  const { student } = useStudent();
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  const fetchFragments = useCallback(async () => {
    if (!student) return;
    const res = await fetch(`/api/fragments?studentId=${student.id}&deckId=${deckId}`);
    const data = await res.json();
    setFragments(data);
    setLoading(false);
  }, [student, deckId]);

  useEffect(() => { fetchFragments(); }, [fetchFragments]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !front.trim() || !back.trim()) return;

    await fetch("/api/fragments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        deckId,
        front: front.trim(),
        back: back.trim(),
      }),
    });

    setFront("");
    setBack("");
    setShowAdd(false);
    fetchFragments();
  };

  const handleUpdate = async (fragmentId: string) => {
    await fetch(`/api/fragments/${fragmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front: editFront, back: editBack }),
    });
    setEditingId(null);
    fetchFragments();
  };

  const handleDelete = async (fragmentId: string) => {
    await fetch(`/api/fragments/${fragmentId}`, { method: "DELETE" });
    fetchFragments();
  };

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 max-w-[980px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/fragments" className="text-text-tertiary hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight flex-1">
            {t("cards")}
          </h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-[14px] text-primary hover:underline"
          >
            {showAdd ? t("cancel") : t("addCard")}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-6 space-y-4">
            <textarea
              placeholder={t("frontPlaceholder")}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              rows={2}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <textarea
              placeholder={t("backPlaceholder")}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              rows={2}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] font-ui text-[17px] transition-colors hover:bg-primary-hover"
            >
              {t("saveCard")}
            </button>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : fragments.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-tertiary text-[14px] mb-4">{t("emptyDeck")}</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-primary text-[14px] hover:underline"
            >
              {t("addCard")}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fragments.map((f) => (
              <div key={f.id} className="bg-bg-subtle rounded-[var(--radius-lg)] p-4">
                {editingId === f.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      rows={2}
                      className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <textarea
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      rows={2}
                      className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(f.id)}
                        className="px-4 py-1.5 bg-primary text-white rounded-[var(--radius-pill)] text-[13px]"
                      >
                        {t("save")}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 text-text-secondary text-[13px]"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-text font-medium">{f.front}</p>
                      <p className="text-[13px] text-text-secondary mt-1">{f.back}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(f.id); setEditFront(f.front); setEditBack(f.back); }}
                        className="text-text-tertiary hover:text-text transition-colors p-1"
                        aria-label={t("editCard")}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="text-text-tertiary hover:text-error transition-colors p-1"
                        aria-label={t("deleteCard")}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
