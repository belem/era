import Link from "next/link";

export function AppHeader() {
  return (
    <header className="glass-nav sticky top-0 z-40 flex items-center justify-between px-5 h-12">
      <Link href="/" className="font-heading font-semibold text-[17px] tracking-tight text-white">
        跬步
      </Link>
      <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-[12px] font-medium">
        学
      </div>
    </header>
  );
}
