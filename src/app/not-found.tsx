import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="font-heading font-semibold text-[48px] text-text leading-none">404</h1>
      <p className="text-text-secondary text-[15px] mt-2 mb-6">Page not found</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-primary text-white rounded-[var(--radius-md)] text-[15px] font-medium"
      >
        Back to home
      </Link>
    </main>
  );
}
