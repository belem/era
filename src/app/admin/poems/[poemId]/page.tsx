"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/Spinner";

interface PoemEdition {
  edition: string;
  school_system: string;
  grade: number;
  semester?: string | null;
  page?: number | null;
}

interface PoemRow {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  content_lines: any[];
  tags: string[];
  poem_editions: PoemEdition[];
}

const KNOWN_EDITIONS = ["人教", "苏教", "沪教", "北师", "语文", "长春", "鄂教", "鲁教", "河大", "北京", "粤教", "鲁人", "华师"];
const SCHOOL_SYSTEMS = ["六三", "五四", "高中"];

const EMPTY_POEM: PoemRow = {
  id: "",
  title: "",
  author: "",
  dynasty: "",
  content_lines: [],
  tags: [],
  poem_editions: [],
};

export default function AdminPoemEditPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const params = useParams();
  const poemId = params.poemId as string;
  const isNew = poemId === "new";

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [poem, setPoem] = useState<PoemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Verify admin
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("users").select("role").eq("id", user.id).single().then(({ data }) => {
        if (!data || data.role !== "ADMIN") { setIsAdmin(false); return; }
        setIsAdmin(true);
      });
    });
  }, [router]);

  // Load poem
  useEffect(() => {
    if (!isAdmin) return;
    if (isNew) {
      setPoem(EMPTY_POEM);
      setLoading(false);
      return;
    }
    fetch(`/api/admin/poems/${poemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPoem(data);
      })
      .catch(() => setError("Failed to load poem"))
      .finally(() => setLoading(false));
  }, [isAdmin, isNew, poemId]);

  const handleSave = async (updated: PoemRow) => {
    setSaving(true);
    setError("");
    const { id, poem_editions, ...fields } = updated;
    const payload = { ...fields, editions: poem_editions };
    let res: Response;
    if (isNew) {
      res = await fetch("/api/admin/poems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`/api/admin/poems/${poemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    if (res.ok) {
      router.push("/admin?tab=poems");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `Error ${res.status}`);
    }
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">{t("forbidden")}</p>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">{error || "Poem not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-subtle">
        <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin?tab=poems")}
              className="text-text-secondary hover:text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 className="font-heading font-semibold text-[20px] text-text">
              {isNew ? "添加诗词" : `编辑：${poem.title || "..."}`}
            </h1>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-12 lg:px-20 xl:px-32 py-8 max-w-4xl">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] border border-error bg-error/10 text-[14px] text-error">
            {error}
          </div>
        )}
        <PoemEditor
          poem={poem}
          saving={saving}
          onSave={handleSave}
          onCancel={() => router.push("/admin?tab=poems")}
        />
      </main>
    </div>
  );
}

function PoemEditor({
  poem, saving, onSave, onCancel,
}: {
  poem: PoemRow;
  saving: boolean;
  onSave: (p: PoemRow) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(poem.title);
  const [author, setAuthor] = useState(poem.author);
  const [dynasty, setDynasty] = useState(poem.dynasty);
  const [editions, setEditions] = useState<PoemEdition[]>(poem.poem_editions ?? []);
  const [tags, setTags] = useState(poem.tags.join(", "));
  const [linesText, setLinesText] = useState(() =>
    poem.content_lines
      .map((line: any) => {
        const chars = line.chars?.map((c: any) => c.char).join("") ?? "";
        return chars + (line.punctuation ?? "");
      })
      .join("\n")
  );
  const [pinyinText, setPinyinText] = useState(() =>
    poem.content_lines
      .map((line: any) => line.chars?.map((c: any) => c.pinyin).join(" ") ?? "")
      .join("\n")
  );

  const addEdition = () =>
    setEditions([...editions, { edition: "人教", school_system: "六三", grade: 1, semester: "上册" }]);

  const removeEdition = (i: number) =>
    setEditions(editions.filter((_, idx) => idx !== i));

  const updateEdition = (i: number, field: keyof PoemEdition, value: string | number | null) => {
    const next = [...editions];
    if (field === "school_system") {
      const sys = value as string;
      next[i] = { ...next[i], school_system: sys };
      if (next[i].grade > (sys === "高中" ? 3 : 9)) next[i].grade = 1;
    } else {
      next[i] = { ...next[i], [field]: value };
    }
    setEditions(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawLines = linesText.split("\n").filter((l) => l.trim());
    const pinyinLines = pinyinText.split("\n");

    const content_lines = rawLines.map((line, li) => {
      const pinyinArr = (pinyinLines[li] ?? "").split(/\s+/).filter(Boolean);
      const chars: { char: string; pinyin: string }[] = [];
      let punctuation = "";
      let pi = 0;
      for (const ch of line) {
        if (/[\u4e00-\u9fff]/.test(ch)) {
          chars.push({ char: ch, pinyin: pinyinArr[pi] ?? "" });
          pi++;
        } else if (/[，。！？；：、]/.test(ch)) {
          punctuation = ch;
        }
      }
      return { chars, punctuation };
    });

    onSave({
      id: poem.id,
      title,
      author,
      dynasty,
      content_lines,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      poem_editions: editions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic fields */}
      <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-[14px] font-medium text-text-secondary">基本信息</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[12px] text-text-tertiary mb-1">标题</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-[12px] text-text-tertiary mb-1">作者</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} required
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-[12px] text-text-tertiary mb-1">朝代</label>
            <input value={dynasty} onChange={(e) => setDynasty(e.target.value)} required
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="block text-[12px] text-text-tertiary mb-1">标签（逗号分隔）</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="spring, nature, moon"
            className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {/* Editions */}
      <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-medium text-text-secondary">版本 / 学制 / 年级 / 册次 / 页码</h2>
          <button type="button" onClick={addEdition} className="text-[13px] text-primary hover:underline">
            + 添加版本
          </button>
        </div>
        {editions.length === 0 && (
          <p className="text-[13px] text-text-tertiary py-1">未关联任何版本</p>
        )}
        <div className="space-y-2">
          {editions.map((ed, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <select value={ed.edition} onChange={(e) => updateEdition(i, "edition", e.target.value)}
                className="border border-border rounded-[var(--radius-md)] bg-bg px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-primary">
                {KNOWN_EDITIONS.map((k) => <option key={k} value={k}>{k}版</option>)}
              </select>
              <select value={ed.school_system} onChange={(e) => updateEdition(i, "school_system", e.target.value)}
                className="border border-border rounded-[var(--radius-md)] bg-bg px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-primary">
                {SCHOOL_SYSTEMS.map((sys) => <option key={sys} value={sys}>{sys === "高中" ? "高中" : `${sys}学制`}</option>)}
              </select>
              <select value={ed.grade} onChange={(e) => updateEdition(i, "grade", parseInt(e.target.value, 10))}
                className="border border-border rounded-[var(--radius-md)] bg-bg px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-primary">
                {Array.from({ length: ed.school_system === "高中" ? 3 : 9 }, (_, g) => g + 1).map((g) => (
                  <option key={g} value={g}>{g}年级</option>
                ))}
              </select>
              <select value={ed.semester ?? ""} onChange={(e) => updateEdition(i, "semester", e.target.value || null)}
                className="border border-border rounded-[var(--radius-md)] bg-bg px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">册次</option>
                <option value="上册">上册</option>
                <option value="下册">下册</option>
              </select>
              <input type="number" placeholder="页码" value={ed.page ?? ""}
                onChange={(e) => updateEdition(i, "page", e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-16 border border-border rounded-[var(--radius-md)] bg-bg px-2 py-1.5 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="button" onClick={() => removeEdition(i)} className="text-error text-[13px] hover:underline">删除</button>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-bg-subtle rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-[14px] font-medium text-text-secondary">诗词内容</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-text-tertiary mb-1">诗句（每行一句）</label>
            <textarea value={linesText} onChange={(e) => setLinesText(e.target.value)} rows={10} required
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] font-poetry leading-[2] text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="block text-[12px] text-text-tertiary mb-1">拼音（每行对应诗句，空格分隔）</label>
            <textarea value={pinyinText} onChange={(e) => setPinyinText(e.target.value)} rows={10}
              className="w-full border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button type="submit" disabled={saving}
          className="px-8 py-2.5 bg-primary text-white rounded-[var(--radius-pill)] text-[14px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Spinner size={16} />保存中…</> : "保存"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-8 py-2.5 border border-border rounded-[var(--radius-pill)] text-[14px] text-text-secondary hover:border-primary hover:text-primary transition-colors">
          取消
        </button>
      </div>
    </form>
  );
}
