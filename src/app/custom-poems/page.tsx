"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useStudent } from "@/hooks/useStudent";
import { usePoetrySearch } from "@/hooks/usePoetrySearch";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { createClient } from "@/lib/supabase/client";
import { hasPlan, tierConfig, type Plan } from "@/lib/tier";

interface CustomPoem {
  id: string;
  title: string;
  author: string | null;
  dynasty: string | null;
  content_lines: any[];
  created_at: string;
}

interface AutocompleteResult {
  title: string;
  author: string;
  dynasty: string;
  paragraphs: string[];
}

export default function CustomPoemsPage() {
  const t = useTranslations("customPoems");
  const { student } = useStudent();
  const [poems, setPoems] = useState<CustomPoem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [userPlan, setUserPlan] = useState<Plan>("FREE");
  const canCreate = hasPlan(userPlan, tierConfig.customPoems);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("users")
        .select("plan")
        .eq("id", data.user.id)
        .single();
      if (row?.plan) setUserPlan(row.plan as Plan);
    });
  }, []);

  // Create form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [dynasty, setDynasty] = useState("");
  const [lines, setLines] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pinyinMap, setPinyinMap] = useState<string[]>([]);
  const { search } = usePoetrySearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPoems = useCallback(async () => {
    if (!student) return;
    const res = await fetch(`/api/custom-poems?studentId=${student.id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setPoems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [student]);

  useEffect(() => { fetchPoems(); }, [fetchPoems]);

  const searchPoems = useCallback((query: string) => {
    if (query.length < 1) { setSuggestions([]); return; }
    const results = search(query, 8);
    setSuggestions(results.map((p) => ({
      title: p.title,
      author: p.author,
      dynasty: p.dynasty,
      paragraphs: p.paragraphs,
    })));
  }, [search]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchPoems(val);
      setShowSuggestions(true);
    }, 300);
  };

  const selectSuggestion = (s: AutocompleteResult) => {
    setTitle(s.title);
    setAuthor(s.author);
    setDynasty(s.dynasty);
    setLines(s.paragraphs.join("\n"));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleGeneratePinyin = async () => {
    if (!lines.trim()) return;
    setGenerating(true);
    try {
      const text = lines.replace(/\n/g, "");
      const res = await fetch("/api/pinyin-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setPinyinMap(data.pinyin ?? []);
    } catch { /* pinyin gen failed */ }
    setGenerating(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !title.trim() || !lines.trim()) return;

    // Parse lines into content_lines format
    const rawLines = lines.split("\n").filter((l) => l.trim());
    let pinyinIdx = 0;
    const contentLines = rawLines.map((line) => {
      // Split into chars and punctuation
      const chars: { char: string; pinyin: string }[] = [];
      let punctuation = "";

      for (const ch of line) {
        if (/[\u4e00-\u9fff]/.test(ch)) {
          chars.push({ char: ch, pinyin: pinyinMap[pinyinIdx] ?? "" });
          pinyinIdx++;
        } else if (/[，。！？；：、]/.test(ch)) {
          punctuation = ch;
        }
      }
      return { chars, punctuation };
    });

    const res = await fetch("/api/custom-poems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        title: title.trim(),
        author: author.trim() || null,
        dynasty: dynasty.trim() || null,
        contentLines,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      setCreateError(errData.error || t("requiresPro"));
      return;
    }

    setTitle("");
    setAuthor("");
    setDynasty("");
    setLines("");
    setPinyinMap([]);
    setCreateError("");
    setShowCreate(false);
    fetchPoems();
  };

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-20 xl:px-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-semibold text-[28px] leading-tight tracking-tight">
            {t("title")}
          </h1>
          {canCreate ? (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-[14px] text-primary hover:underline"
            >
              {showCreate ? t("cancel") : t("newPoem")}
            </button>
          ) : (
            <a href="/pricing" className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-primary transition-colors">
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">Pro</span>
              {t("upgradeToPro")}
            </a>
          )}
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 mb-6 space-y-4">
            {/* Title with autocomplete */}
            <div className="relative">
              <input
                type="text"
                placeholder={t("titlePlaceholder")}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required
                className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg border border-border rounded-[var(--radius-md)] shadow-lg z-10 max-h-[240px] overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-bg-subtle transition-colors border-b border-border last:border-0"
                    >
                      <span className="font-heading font-semibold text-[15px] text-text">{s.title}</span>
                      <span className="text-[13px] text-text-secondary ml-2">{s.author}</span>
                      <span className="text-[12px] text-text-tertiary ml-1">〔{s.dynasty}〕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t("authorPlaceholder")}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder={t("dynastyPlaceholder")}
                value={dynasty}
                onChange={(e) => setDynasty(e.target.value)}
                className="border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <textarea
              placeholder={t("linesPlaceholder")}
              value={lines}
              onChange={(e) => setLines(e.target.value)}
              required
              rows={6}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-4 py-3 text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none font-poetry text-[17px] leading-[2]"
            />

            {/* Pinyin generation */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGeneratePinyin}
                disabled={generating || !lines.trim()}
                className="px-4 py-2 border border-border rounded-[var(--radius-pill)] text-[14px] text-text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {generating ? t("generatingPinyin") : t("generatePinyin")}
              </button>
              {pinyinMap.length > 0 && (
                <span className="text-[13px] text-text-tertiary">
                  {t("pinyinGenerated", { count: pinyinMap.length })}
                </span>
              )}
            </div>

            {/* Pinyin preview */}
            {pinyinMap.length > 0 && (
              <div className="bg-bg rounded-[var(--radius-md)] p-3 text-[13px] text-text-secondary font-mono">
                {pinyinMap.join(" ")}
              </div>
            )}

            {createError && (
              <p className="text-[14px] text-error" role="alert">{createError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-[var(--radius-pill)] font-ui text-[17px] transition-colors hover:bg-primary-hover"
            >
              {t("savePoem")}
            </button>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-subtle rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : poems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-tertiary text-[14px] mb-4">{t("empty")}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-primary text-[14px] hover:underline"
            >
              {t("newPoem")}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {poems.map((poem) => (
              <div key={poem.id} className="bg-bg-subtle rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-[15px] text-text">{poem.title}</p>
                  {poem.author && (
                    <p className="text-[13px] text-text-tertiary">
                      {poem.dynasty && `〔${poem.dynasty}〕`}{poem.author}
                    </p>
                  )}
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
