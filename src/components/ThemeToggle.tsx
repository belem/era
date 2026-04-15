"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  inline?: boolean;
}

export function ThemeToggle({ inline = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm opacity-0 ${
          inline ? "" : "fixed top-2.5 right-14 z-50 md:hidden"
        }`}
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
        inline
          ? "text-white/80 hover:text-white"
          : "fixed top-2.5 right-14 z-50 text-white/80 hover:text-white md:hidden"
      }`}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? "☀" : "☽"}
    </button>
  );
}
