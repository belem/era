"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconListen({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function IconLibrary({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconCustomPoems({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconFragments({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M12 4v16" />
    </svg>
  );
}

function IconGallery({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconChevronUp({ className }: { className?: string }) {
  return (
    <svg className={className} width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

type GroupItem = {
  href: string;
  labelKey: string;
  Icon: React.FC<{ className?: string }>;
};

type SingleTab = { type: "single" } & GroupItem;
type GroupTab = { type: "group"; groupKey: string; items: GroupItem[] };
type TabDef = SingleTab | GroupTab;

export function TabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setOpenGroup(null); }, [pathname]);

  const tabs: TabDef[] = [
    {
      type: "group",
      groupKey: "practice",
      items: [
        { href: "/", labelKey: "home", Icon: IconHome },
        { href: "/listen", labelKey: "listen", Icon: IconListen },
      ],
    },
    { type: "single", href: "/library", labelKey: "library", Icon: IconLibrary },
    {
      type: "group",
      groupKey: "create",
      items: [
        { href: "/custom-poems", labelKey: "customPoems", Icon: IconCustomPoems },
        { href: "/fragments", labelKey: "fragments", Icon: IconFragments },
      ],
    },
    { type: "single", href: "/gallery", labelKey: "gallery", Icon: IconGallery },
  ];

  return (
    <nav ref={navRef} className="glass-nav sticky bottom-0 z-40 md:hidden">
      <div className="flex py-2 pb-3">
        {tabs.map((tab) => {
          if (tab.type === "single") {
            const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            const Icon = tab.Icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center gap-0.5 min-h-[44px] justify-center text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-text-tertiary"
                }`}
              >
                <Icon />
                {t(tab.labelKey as Parameters<typeof t>[0])}
              </Link>
            );
          }

          const activeItem = tab.items.find((item) =>
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          );
          const isActive = !!activeItem;
          const displayItem = activeItem ?? tab.items[0];
          const Icon = displayItem.Icon;
          const isOpen = openGroup === tab.groupKey;

          return (
            <div key={tab.groupKey} className="flex-1 relative">
              <button
                onClick={() => setOpenGroup(isOpen ? null : tab.groupKey)}
                className={`w-full flex flex-col items-center gap-0.5 min-h-[44px] justify-center text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-text-tertiary"
                }`}
              >
                <Icon />
                <span className="flex items-center gap-0.5">
                  {t(displayItem.labelKey as Parameters<typeof t>[0])}
                  <IconChevronUp className={`transition-transform duration-150 ${isOpen ? "" : "rotate-180"}`} />
                </span>
              </button>

              {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg rounded-xl shadow-lg border border-border-subtle overflow-hidden z-50 min-w-[80px]">
                  {tab.items.map((item) => {
                    const itemIsActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[12px] font-medium transition-colors ${
                          itemIsActive ? "text-primary bg-primary-soft" : "text-text-secondary hover:text-text hover:bg-bg-subtle"
                        }`}
                      >
                        <item.Icon />
                        {t(item.labelKey as Parameters<typeof t>[0])}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
