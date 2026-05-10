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
    <svg width="20" height="15" viewBox="0 0 190 100" aria-label="English">
      {/* Stripes */}
      {[0,1,2,3,4,5,6,7,8,9,10,11,12].map((i) => (
        <rect key={i} x="0" y={i * (100/13)} width="190" height={100/13}
          fill={i % 2 === 0 ? "#B22234" : "#FFFFFF"} />
      ))}
      {/* Canton (blue field) */}
      <rect x="0" y="0" width="76" height={100 * 7/13} fill="#3C3B6E" />
      {/* Stars — 5×6 + 4×5 grid */}
      {Array.from({ length: 50 }, (_, i) => {
        const row = Math.floor(i / (i < 30 ? 6 : 5));
        const col = i % (i < 30 ? 6 : 5);
        const x = i < 30 ? 6.3 + col * 12.7 : 12.7 + col * 12.7;
        const y = i < 30 ? 5.4 + row * 10.8 : 10.8 + row * 10.8;
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#FFFFFF" />;
      })}
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
      className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] hover:bg-bg-subtle transition-colors cursor-pointer"
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
