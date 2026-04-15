"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/library", key: "library" },
  { href: "/gallery", key: "gallery" },
  { href: "/profile", key: "profile" },
] as const;

export function AppHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="glass-nav sticky top-0 z-40 flex items-center justify-between px-5 h-12">
      <Link href="/" className="font-heading font-semibold text-[17px] tracking-tight text-white [data-theme=light]_&:text-text">
        跬步
      </Link>

      {/* Desktop nav links - hidden on mobile */}
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
                  ? "text-white [data-theme=light]_&:text-primary"
                  : "text-white/60 hover:text-white/90 [data-theme=light]_&:text-text-secondary [data-theme=light]_&:hover:text-text"
              }`}
            >
              {t(link.key)}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <ThemeToggle inline />
        </div>
        <ProfileSwitcher />
      </div>
    </header>
  );
}
