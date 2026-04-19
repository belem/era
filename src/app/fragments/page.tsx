"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { FragmentDeck } from "@/types/fragment";

const DECK_COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--error)", "var(--accent)", "var(--badge-1)"];

export default function FragmentsPage() {
  const t = useTranslations("fragments");
  const { student } = useStudent();
  const [decks, setDecks] = useState<FragmentDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(DECK_COLORS[0]);

  const fetchDecks = useCallback(async () => {
    if (!student) return;
    const res = await fetch(`/api/fragments/decks?studentId=${student.id}`);
    const data = await res.json();
    setDecks(data);
    setLoading(false);
  }, [student]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !newName.trim()) return;

    await fetch("/api/fragments/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        name: newName.trim(),
        description: newDesc.trim() || null,
        color: newColor,
      }),
    });

    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    fetchDecks();
  };

  const handleDelete = async (deckId: string) => {
    await fetch(`/api/fragments/decks/${deckId}`, { method: "DELETE" });
    fetchDecks();
  };

  return (
    <>
      <AppHeader />
      <ThemeToggle />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-20 xl:px-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight">
            {t("title")}
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-[14px] text-primary hover:underline"
          >
            {showCreate ? t("cancel") : t("newDeck")}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-6 space-y-4">
            <input
              type="text"
              placeholder={t("deckName")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder={t("deckDesc")}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className="w-8 h-8 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: newColor === c ? "scale(1.25)" : "scale(1)",
                    boxShadow: newColor === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : "none",
                  }}
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] font-ui text-[17px] transition-colors hover:bg-primary-hover"
            >
              {t("createDeck")}
            </button>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-tertiary text-[14px] mb-4">{t("empty")}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-primary text-[14px] hover:underline"
            >
              {t("newDeck")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {decks.map((deck) => (
              <div key={deck.id} className="bg-bg-subtle rounded-[var(--radius-lg)] p-5 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-[var(--radius-md)] flex-shrink-0"
                  style={{ backgroundColor: deck.color }}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/fragments/${deck.id}`}
                    className="font-heading font-semibold text-[17px] text-text hover:text-primary transition-colors"
                  >
                    {deck.name}
                  </Link>
                  {deck.description && (
                    <p className="text-[13px] text-text-tertiary truncate">{deck.description}</p>
                  )}
                  <p className="text-[12px] text-text-tertiary mt-0.5">
                    {t("cardCount", { count: deck.fragment_count ?? 0 })}
                    {(deck.due_count ?? 0) > 0 && (
                      <span className="text-primary ml-2">{t("dueCount", { count: deck.due_count ?? 0 })}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(deck.due_count ?? 0) > 0 && (
                    <Link
                      href={`/fragments/${deck.id}/review`}
                      className="px-4 py-2 bg-primary text-white rounded-[var(--radius-pill)] text-[14px] transition-colors hover:bg-primary-hover"
                    >
                      {t("review")}
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(deck.id)}
                    className="text-[13px] text-text-tertiary hover:text-error transition-colors"
                    aria-label={t("deleteDeck")}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
