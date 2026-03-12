import type { ThresholdConfig } from "../../types/index";

export const THRESHOLD_CONFIG: ThresholdConfig = {
  tiers: [
    {
      tier: "L1",
      priority: "High",
      targetCompliance: 0.95,
      warningThreshold: 0.90,
      slaHours: 24,
    },
    {
      tier: "L1",
      priority: "Medium",
      targetCompliance: 0.95,
      warningThreshold: 0.90,
      slaHours: 24,
    },
    {
      tier: "L1",
      priority: "Low",
      targetCompliance: 0.99,
      warningThreshold: 0.97,
      slaHours: 72,
    },
    {
      tier: "L2",
      targetCompliance: 0.96,
      warningThreshold: 0.92,
      slaHours: 48,
    },
    {
      tier: "L3",
      targetCompliance: 0.98,
      warningThreshold: 0.95,
      slaHours: 72,
    },
  ],
  ofacFilingWindowDays: 10,
  reapplyReviewSlaMonths: 18,
};
