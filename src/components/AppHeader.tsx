import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-border">
      <Link href="/" className="font-heading font-semibold text-lg tracking-wide">
        跬步
      </Link>
      <div className="w-8 h-8 rounded-full bg-text text-bg flex items-center justify-center text-[13px] font-medium">
        学
      </div>
    </header>
  );
}
