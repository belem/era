"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/listen", key: "listen" },
  { href: "/library", key: "library" },
  { href: "/custom-poems", key: "customPoems" },
  { href: "/fragments", key: "fragments" },
  { href: "/gallery", key: "gallery" },
] as const;

export function AppHeader() {
  const t = useTranslations("nav");
  const ta = useTranslations("admin");
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("kuibu:isAdmin");
    if (cached === "1") { setIsAdmin(true); return; }
    if (cached === "0") return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("users").select("role").eq("id", user.id).single().then(({ data }) => {
        const admin = data?.role === "ADMIN";
        setIsAdmin(admin);
        sessionStorage.setItem("kuibu:isAdmin", admin ? "1" : "0");
      });
    });
  }, []);

  return (
    <header className="app-header sticky top-0 z-40 flex items-center justify-between px-5 h-12 border-b border-border-subtle md:h-14 md:px-8">
      <Link href="/" className="flex items-center gap-2 font-heading font-semibold text-[17px] tracking-tight text-text">
        <svg width="22" height="22" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="180" y="180" width="40" height="40" fill="#235994"/>
          <rect x="60" y="180" width="40" height="40" fill="#1781B5"/>
          <rect x="120" y="180" width="40" height="40" fill="#106898"/>
          <rect x="120" y="120" width="40" height="40" fill="#158BB8"/>
          <rect x="120" y="60" width="40" height="40" fill="#BCD4E7"/>
          <rect x="60" y="120" width="40" height="40" fill="#66A9C9"/>
          <rect y="180" width="40" height="40" fill="#217FAF"/>
          <rect x="180" y="60" width="40" height="40" fill="#93B5CF"/>
          <rect x="180" width="40" height="40" fill="#E3F9FD"/>
          <rect x="180" y="120" width="40" height="40" fill="#2486B9"/>
        </svg>
        跬步
      </Link>

      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[14px] font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {t(link.key)}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center">
        {isAdmin && (
          <Link
            href="/admin"
            className={`hidden md:block text-[14px] font-medium transition-colors ${
              pathname.startsWith("/admin")
                ? "text-primary"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {ta("title")}
          </Link>
        )}
        <ThemeToggle />
        <LocaleSwitcher />
        <ProfileSwitcher />
      </div>
    </header>
  );
}
