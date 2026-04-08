"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "晨光", icon: "☀" },
  { href: "/library", label: "诗库", icon: "📖" },
  { href: "/gallery", label: "卷轴馆", icon: "📜" },
  { href: "/profile", label: "我的", icon: "👤" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 border-t border-border bg-bg">
      <div className="flex py-2.5 pb-3.5">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-0.5 text-[10px] font-medium tracking-wide transition-colors ${
                isActive ? "text-primary" : "text-text-tertiary"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
