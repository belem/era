import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";

const CHECK = (
  <svg className="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const DASH = (
  <svg className="w-5 h-5 text-text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

export default async function PricingPage() {
  const t = await getTranslations("pricing");

  const plans = [
    {
      key: "free",
      name: t("free"),
      price: t("freePrice"),
      highlight: false,
      features: {
        review: true,
        students: "2",
        fsrs: false,
        customPoems: false,
        pinyin: false,
        analytics: false,
      },
    },
    {
      key: "pro",
      name: t("pro"),
      price: t("proPrice"),
      highlight: true,
      features: {
        review: true,
        students: "8",
        fsrs: true,
        customPoems: true,
        pinyin: true,
        analytics: false,
      },
    },
    {
      key: "max",
      name: t("max"),
      price: t("maxPrice"),
      highlight: false,
      features: {
        review: true,
        students: "120",
        fsrs: true,
        customPoems: true,
        pinyin: true,
        analytics: true,
      },
    },
  ] as const;

  const featureRows: { key: keyof (typeof plans)[0]["features"]; label: string }[] = [
    { key: "review", label: t("features.review") },
    { key: "students", label: t("features.students") },
    { key: "fsrs", label: t("features.fsrs") },
    { key: "customPoems", label: t("features.customPoems") },
    { key: "pinyin", label: t("features.pinyin") },
    { key: "analytics", label: t("features.analytics") },
  ];

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-6 py-14 md:px-12 md:py-20 lg:px-20 xl:px-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading font-semibold text-[34px] leading-tight tracking-tight text-text mb-3">
              {t("title")}
            </h1>
            <p className="text-[17px] text-text-secondary">{t("subtitle")}</p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-[var(--radius-lg)] p-6 flex flex-col gap-4 ${
                  plan.highlight
                    ? "border-2 border-primary bg-primary/5"
                    : "border-2 border-border-subtle bg-bg-subtle"
                }`}
              >
                <div>
                  <div className="font-heading font-semibold text-[22px] text-text">{plan.name}</div>
                  <div className="text-[28px] font-semibold text-text mt-1">{plan.price}</div>
                </div>

                <ul className="space-y-3 flex-1">
                  {featureRows.map((row) => {
                    const val = plan.features[row.key];
                    const isString = typeof val === "string";
                    const isTrue = val === true;
                    return (
                      <li key={row.key} className="flex items-start gap-2.5 text-[14px]">
                        {isString ? (
                          <span className="text-primary font-semibold w-5 text-center shrink-0">{val}</span>
                        ) : isTrue ? (
                          CHECK
                        ) : (
                          DASH
                        )}
                        <span className={isTrue || isString ? "text-text" : "text-text-tertiary"}>
                          {row.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact / no payment CTA */}
          <div className="text-center bg-bg-subtle rounded-[var(--radius-lg)] px-8 py-8 border border-border-subtle">
            <p className="text-[15px] text-text-secondary mb-1">{t("contactDesc")}</p>
            <a
              href="mailto:hello@kuibu.app"
              className="text-[17px] text-primary font-medium hover:underline"
            >
              hello@kuibu.app
            </a>
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="text-[14px] text-text-tertiary hover:text-text transition-colors">
              ← {t("backHome")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
