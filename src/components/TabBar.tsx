"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function TabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: t("home"), icon: "☀" },
    { href: "/library", label: t("library"), icon: "📖" },
    { href: "/fragments", label: t("fragments"), icon: "雅" },
    { href: "/gallery", label: t("gallery"), icon: "📜" },
    { href: "/profile", label: t("profile"), icon: "👤" },
  ];

  return (
    <nav className="glass-nav sticky bottom-0 z-40 md:hidden">
      <div className="flex py-2 pb-3">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-text-tertiary"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
