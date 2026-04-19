import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border-subtle py-4 px-6 text-center text-[12px] text-text-tertiary">
      <span>&copy; 2026 </span>
      <a
        href="https://kuibu.app/"
        className="hover:text-primary transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        跬步
      </a>
      <span className="mx-2">·</span>
      <Link href="/privacy" className="hover:text-primary transition-colors">
        隐私条款
      </Link>
    </footer>
  );
}
