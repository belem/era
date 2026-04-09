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
        className="fixed top-2.5 right-5 z-50 w-8 h-8 rounded-full flex items-center justify-center text-sm opacity-0"
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="fixed top-2.5 right-14 z-50 w-8 h-8 rounded-full text-white/80 hover:text-white flex items-center justify-center text-sm transition-colors"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? "☀" : "☽"}
    </button>
  );
}
