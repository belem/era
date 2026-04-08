"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full border border-border bg-bg flex items-center justify-center text-lg"
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full border border-border bg-bg text-text flex items-center justify-center text-lg transition-colors hover:border-text-tertiary"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? "☀" : "☽"}
    </button>
  );
}
