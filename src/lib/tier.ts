export const TIER_ORDER = ["FREE", "PRO", "MAX", "ADMIN"] as const;
export type Plan = (typeof TIER_ORDER)[number];

export const tierConfig = {
  fsrs: "PRO",
  customPoems: "PRO",
  pinyinGen: "PRO",
  advancedAnalytics: "MAX",
  maxStudents: { FREE: 2, PRO: 8, MAX: 120, ADMIN: 9999 },
} as const satisfies {
  fsrs: Plan;
  customPoems: Plan;
  pinyinGen: Plan;
  advancedAnalytics: Plan;
  maxStudents: Record<Plan, number>;
};

/** Returns true if userPlan meets or exceeds the required plan tier. */
export function hasPlan(userPlan: Plan, required: Plan): boolean {
  return TIER_ORDER.indexOf(userPlan) >= TIER_ORDER.indexOf(required);
}

/** Returns the display label for a plan. */
export function planLabel(plan: Plan): string {
  const labels: Record<Plan, string> = {
    FREE: "Free",
    PRO: "Pro",
    MAX: "Max",
    ADMIN: "Admin",
  };
  return labels[plan];
}
