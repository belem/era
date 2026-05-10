"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "overview" | "poems" | "users";

interface Stats {
  totalPoems: number;
  totalUsers: number;
  totalStudents: number;
  totalReviewEvents: number;
}

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

interface UserRow {
  id: string;
  role: string;
  plan: string;
  created_at: string;
  profiles: { display_name: string | null; username: string | null; locale: string } | null;
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageInner />
    </Suspense>
  );
}

function AdminPageInner() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "overview");

  const [stats, setStats] = useState<Stats | null>(null);
  const [poems, setPoems] = useState<PoemRow[]>([]);
  const [poemTotal, setPoemTotal] = useState(0);
  const [poemPage, setPoemPage] = useState(1);
  const [poemSearch, setPoemSearch] = useState("");
  const [poemEdition, setPoemEdition] = useState("");
  const [poemSchoolSystem, setPoemSchoolSystem] = useState("");
  const [poemGrade, setPoemGrade] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);

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

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchPoems = useCallback(async () => {
    const params = new URLSearchParams({ page: String(poemPage), limit: "50" });
    if (poemSearch) params.set("q", poemSearch);
    if (poemEdition) params.set("edition", poemEdition);
    if (poemSchoolSystem) params.set("school_system", poemSchoolSystem);
    if (poemGrade) params.set("grade", poemGrade);
    const res = await fetch(`/api/admin/poems?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPoems(data.poems);
      setPoemTotal(data.total);
    }
  }, [poemPage, poemSearch, poemEdition, poemSchoolSystem, poemGrade]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setUserTotal(data.total);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "overview") fetchStats();
    if (tab === "poems") fetchPoems();
    if (tab === "users") fetchUsers();
  }, [isAdmin, tab, fetchStats, fetchPoems, fetchUsers]);

  const handleDeletePoem = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/admin/poems/${id}`, { method: "DELETE" });
    if (res.ok) fetchPoems();
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center text-text-secondary">{t("loading")}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-text-secondary text-[17px]">{t("forbidden")}</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t("overview") },
    { key: "poems", label: t("poems") },
    { key: "users", label: t("users") },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-subtle">
        <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-4 flex items-center justify-between">
          <h1 className="font-heading font-semibold text-[22px] text-text">{t("title")}</h1>
          <button
            onClick={() => router.push("/")}
            className="text-[14px] text-text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            {t("back")}
          </button>
        </div>
        <div className="px-6 md:px-12 lg:px-20 xl:px-32 flex gap-6">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${
                tab === tb.key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 md:px-12 lg:px-20 xl:px-32 py-8">
        {tab === "overview" && stats && <OverviewTab stats={stats} t={t} />}
        {tab === "poems" && (
          <PoemsTab
            t={t}
            poems={poems}
            total={poemTotal}
            page={poemPage}
            search={poemSearch}
            edition={poemEdition}
            schoolSystem={poemSchoolSystem}
            grade={poemGrade}
            onSearchChange={setPoemSearch}
            onEditionChange={setPoemEdition}
            onSchoolSystemChange={setPoemSchoolSystem}
            onGradeChange={setPoemGrade}
            onPageChange={setPoemPage}
            onDelete={handleDeletePoem}
          />
        )}
        {tab === "users" && <UsersTab t={t} users={users} total={userTotal} />}
      </main>
    </div>
  );
}

function OverviewTab({ stats, t }: { stats: Stats; t: any }) {
  const cards = [
    { label: t("totalPoems"), value: stats.totalPoems },
    { label: t("totalUsers"), value: stats.totalUsers },
    { label: t("totalStudents"), value: stats.totalStudents },
    { label: t("totalReviews"), value: stats.totalReviewEvents },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-bg-subtle rounded-[var(--radius-lg)] p-6">
          <p className="text-[13px] text-text-tertiary mb-1">{c.label}</p>
          <p className="font-heading font-semibold text-[28px] text-text tabular-nums">
            {c.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

const KNOWN_EDITIONS = ["人教", "苏教", "沪教", "北师", "语文", "长春", "鄂教", "鲁教", "河大", "北京", "粤教", "鲁人", "华师"];
const SCHOOL_SYSTEMS = ["六三", "五四", "高中"];

function PoemsTab({
  t, poems, total, page, search, edition, schoolSystem, grade,
  onSearchChange, onEditionChange, onSchoolSystemChange, onGradeChange, onPageChange, onDelete,
}: {
  t: any;
  poems: PoemRow[];
  total: number;
  page: number;
  search: string;
  edition: string;
  schoolSystem: string;
  grade: string;
  onSearchChange: (v: string) => void;
  onEditionChange: (v: string) => void;
  onSchoolSystemChange: (v: string) => void;
  onGradeChange: (v: string) => void;
  onPageChange: (v: number) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
            placeholder={t("search")}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-[var(--radius-md)] bg-bg text-[14px] text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={edition}
          onChange={(e) => { onEditionChange(e.target.value); onPageChange(1); }}
          className="border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">全部版本</option>
          {KNOWN_EDITIONS.map((ed) => (
            <option key={ed} value={ed}>{ed}版</option>
          ))}
        </select>
        <select
          value={schoolSystem}
          onChange={(e) => { onSchoolSystemChange(e.target.value); onPageChange(1); }}
          className="border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">全部学制</option>
          {SCHOOL_SYSTEMS.map((sys) => (
            <option key={sys} value={sys}>{sys === "高中" ? "高中" : `${sys}学制`}</option>
          ))}
        </select>
        <select
          value={grade}
          onChange={(e) => { onGradeChange(e.target.value); onPageChange(1); }}
          className="border border-border rounded-[var(--radius-md)] bg-bg px-3 py-2 text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{t("allGrades")}</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
            <option key={g} value={g}>{t("gradeN", { n: g })}</option>
          ))}
        </select>
        <button
          onClick={() => router.push("/admin/poems/new")}
          className="px-4 py-2 bg-primary text-white rounded-[var(--radius-pill)] text-[14px] hover:bg-primary-hover transition-colors cursor-pointer"
        >
          {t("addPoem")}
        </button>
      </div>

      {poems.length === 0 ? (
        <p className="py-12 text-center text-text-tertiary text-[14px]">{t("noPoems")}</p>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-bg-subtle border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t("poemTitle")}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t("poemAuthor")}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden md:table-cell">{t("poemDynasty")}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t("poemEdition")}</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {poems.map((poem) => (
                <tr key={poem.id} className="border-b border-border last:border-0 hover:bg-bg-subtle/50 transition-colors">
                  <td className="px-4 py-3 font-heading">{poem.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{poem.author}</td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{poem.dynasty}</td>
                  <td className="px-4 py-3 text-text-secondary text-[12px]">
                    {poem.poem_editions?.length > 0
                      ? poem.poem_editions.map((e) => `${e.edition}·${e.school_system}·${e.grade}年级${e.semester ? `·${e.semester}` : ""}${e.page ? `·p${e.page}` : ""}`).join(", ")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/admin/poems/${poem.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline cursor-pointer mr-3"
                    >
                      {t("editPoem")}
                    </a>
                    <button
                      onClick={() => onDelete(poem.id)}
                      className="text-error hover:underline cursor-pointer"
                    >
                      {t("deletePoem")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 border border-border rounded-[var(--radius-md)] text-[14px] disabled:opacity-30 hover:border-primary transition-colors cursor-pointer"
          >
            &larr;
          </button>
          <span className="text-[14px] text-text-secondary tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 border border-border rounded-[var(--radius-md)] text-[14px] disabled:opacity-30 hover:border-primary transition-colors cursor-pointer"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}


function UsersTab({ t, users, total }: { t: any; users: UserRow[]; total: number }) {
  return (
    <div>
      <p className="text-[14px] text-text-secondary mb-4">
        {t("totalUsers")}: {total}
      </p>
      {users.length === 0 ? (
        <p className="py-12 text-center text-text-tertiary text-[14px]">{t("loading")}</p>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-bg-subtle border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Role</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-bg-subtle/50 transition-colors">
                  <td className="px-4 py-3">
                    {user.profiles?.display_name ?? user.profiles?.username ?? user.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-medium ${
                      user.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-bg-muted text-text-secondary"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user.plan}</td>
                  <td className="px-4 py-3 text-text-tertiary hidden md:table-cell">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
