export type PlanTier = "free" | "bronze" | "silver" | "gold";

export interface PlanInfo {
  tier: PlanTier;
  label: string;
  priceInr: number;
  watchSeconds: number; // -1 = unlimited
  description: string;
}

export const PLANS: Record<PlanTier, PlanInfo> = {
  free: { tier: "free", label: "Free", priceInr: 0, watchSeconds: 5 * 60, description: "Watch up to 5 minutes per day." },
  bronze: { tier: "bronze", label: "Bronze", priceInr: 10, watchSeconds: 7 * 60, description: "7 minutes of daily watch time." },
  silver: { tier: "silver", label: "Silver", priceInr: 50, watchSeconds: 10 * 60, description: "10 minutes of daily watch time." },
  gold: { tier: "gold", label: "Gold", priceInr: 100, watchSeconds: -1, description: "Unlimited watching." },
};

export function watchLimit(tier: PlanTier) {
  return PLANS[tier].watchSeconds;
}
