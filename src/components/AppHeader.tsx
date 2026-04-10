"use client";

import Link from "next/link";
import { ProfileSwitcher } from "./ProfileSwitcher";

export function AppHeader() {
  return (
    <header className="glass-nav sticky top-0 z-40 flex items-center justify-between px-5 h-12">
      <Link href="/" className="font-heading font-semibold text-[17px] tracking-tight text-white">
        跬步
      </Link>
      <ProfileSwitcher />
    </header>
  );
}
