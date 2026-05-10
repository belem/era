"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

// Flag SVGs via emoji rendered in a consistent monospace span
function FlagZH() {
  return (
    <svg width="20" height="15" viewBox="0 0 900 600" aria-label="中文">
      <rect width="900" height="600" fill="#DE2910" />
      <g fill="#FFDE00">
        {/* Large star */}
        <polygon points="150,60 180,150 90,94 210,94 120,150" />
        {/* Four small stars */}
        <polygon transform="rotate(-20.66,240,90) translate(240,90) scale(0.4) translate(-240,-90)"
          points="240,60 270,150 180,94 300,94 210,150" />
        <polygon transform="rotate(11.53,275,130) translate(275,130) scale(0.4) translate(-275,-130)"
          points="275,100 305,190 215,134 335,134 245,190" />
        <polygon transform="rotate(37.58,290,180) translate(290,180) scale(0.4) translate(-290,-180)"
          points="290,150 320,240 230,184 350,184 260,240" />
        <polygon transform="rotate(21.74,260,220) translate(260,220) scale(0.4) translate(-260,-220)"
          points="260,190 290,280 200,224 320,224 230,280" />
      </g>
    </svg>
  );
}

function FlagEN() {
  return (
    <svg width="20" height="15" viewBox="0 0 60 30" aria-label="English">
      <clipPath id="t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#t)" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function LocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  const toggle = () => {
    const next = locale === "zh-CN" ? "en" : "zh-CN";
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] hover:bg-bg-subtle transition-colors"
      aria-label={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
      title={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
    >
      {locale === "zh-CN" ? <FlagZH /> : <FlagEN />}
      <span className="text-[12px] text-text-secondary font-medium tabular-nums">
        {locale === "zh-CN" ? "中" : "EN"}
      </span>
    </button>
  );
}
