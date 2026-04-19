"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { LearningTab } from "@/components/settings/LearningTab";
import { AccountTab } from "@/components/settings/AccountTab";
import { FamilyTab } from "@/components/settings/FamilyTab";

type Tab = "learning" | "account" | "family";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<Tab>("learning");

  const tabs: { key: Tab; label: string }[] = [
    { key: "learning", label: t("tabs.learning") },
    { key: "account", label: t("tabs.account") },
    { key: "family", label: t("tabs.family") },
  ];

  return (
    <>
      <AppHeader />
      <main className="flex-1 px-6 py-6 md:px-12 md:py-10 lg:px-[20%] xl:px-[28%]">
        {/* Tab bar */}
        <div className="flex bg-bg-subtle rounded-[var(--radius-pill)] p-1 mb-6" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-[14px] font-medium rounded-[var(--radius-pill)] transition-colors ${
                activeTab === tab.key
                  ? "bg-bg text-text shadow-sm"
                  : "text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div role="tabpanel">
          {activeTab === "learning" && <LearningTab />}
          {activeTab === "account" && <AccountTab />}
          {activeTab === "family" && <FamilyTab />}
        </div>
      </main>
    </>
  );
}
