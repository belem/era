"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="font-heading font-semibold text-[28px] text-text leading-tight">Something went wrong</h1>
      <p className="text-text-secondary text-[15px] mt-2 mb-6">An unexpected error occurred.</p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-primary text-white rounded-[var(--radius-md)] text-[15px] font-medium"
      >
        Try again
      </button>
    </main>
  );
}
