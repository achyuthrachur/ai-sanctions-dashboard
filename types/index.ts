// ============================================================
// BofA Sanctions Dashboard — Shared TypeScript Interfaces
// Phase 0: Synthetic Data Engine
// ============================================================

// ---------------------
// Alert / Review Types
// ---------------------

export type Tier = "L1" | "L2" | "L3";
export type Priority = "High" | "Medium" | "Low";
export type SlaStatus = "met" | "breached" | "pending";
export type DispositionType =
  | "true_match"
  | "false_positive"
  | "escalated"
  | "auto_cleared"
  | "pending";

export interface AlertRecord {
  alertId: string;
  date: string; // ISO date YYYY-MM-DD
  alertType: string;
  priority: Priority;
  tier: Tier;
  originator: string;
  beneficiary: string;
  countries: string[];
  hoursToReview: number;
  slaStatus: SlaStatus;
  disposition: DispositionType;
  makerId: string;
  checkerId: string;
  lob: string;
}

export interface DailySummary {
  date: string; // ISO date YYYY-MM-DD
  totalAlerts: number;
  l1Count: number;
  l2Count: number;
  l3Count: number;
  l1CountRel: number;
  l1CountTrx: number;
  l2CountRel: number;
  l2CountTrx: number;
  l3CountRel: number;
  l3CountTrx: number;
  l1HighSlaCompliance: number; // 0–1
  l1MedSlaCompliance: number; // 0–1
  l1LowSlaCompliance: number; // 0–1
  l2SlaCompliance: number; // 0–1
  l3SlaCompliance: number; // 0–1
  spikeFlag: boolean;
  spikeId: string | null;
}

// ---------------------
// Maker-Checker
// ---------------------

export type MakerCheckerExceptionType =
  | "implementation_gap"
  | "entitlement_provisioning"
  | "workflow_bypass"
  | "other";

export interface MakerCheckerRecord {
  exceptionId: string;
  date: string;
  exceptionType: MakerCheckerExceptionType;
  description: string;
  makerId: string;
  checkerId: string | null;
  remediationDate: string;
  remediationDays: number;
  relatedSpikeId: string | null;
  lob: string;
}

// ---------------------
// Blocked Accounts
// ---------------------

export type AccountStatus = "blocked" | "unblocked" | "pending_review";
export type OfacFilingStatus = "filed" | "overdue" | "pending";

export interface BlockedAccount {
  accountId: string;
  accountHolder: string;
  country: string;
  blockDate: string;
  unblockDate: string | null;
  status: AccountStatus;
  listSource: string;
  dollarVolume: number;
  lob: string;
  alertTypeCat: 'relationship' | 'transaction';
}

export interface OfacFiling {
  filingId: string;
  accountId: string;
  blockDate: string;
  filingDeadline: string; // blockDate + 10 days
  filingDate: string | null;
  status: OfacFilingStatus;
  relatedSpikeId: string | null;
}

// ---------------------
// Disposition / QA
// ---------------------

export type SetbackReason =
  | "insufficientDocumentation"
  | "incorrectEntityMatch"
  | "policyMisapplication"
  | "other";

export interface DispositionWeek {
  weekStart: string; // ISO date, Monday
  trueMatchRate: number; // 0–1
  trueMatchRateRel: number;
  trueMatchRateTrx: number;
  falsePositiveRate: number; // 0–1
  autoCleared: number; // 0–1
  qaSetbackRate: number; // 0–1
  qaSetbackRateRel: number;
  qaSetbackRateTrx: number;
  totalReviewed: number;
  totalReviewedRel: number;
  totalReviewedTrx: number;
  spikeFlag: boolean;
  spikeId: string | null;
}

export interface SetbackRecord {
  setbackId: string;
  alertId: string;
  date: string;
  reason: SetbackReason;
  analystId: string;
  qaLeadId: string;
  description: string;
  resolved: boolean;
  resolutionDate: string | null;
}

// ---------------------
// Reapply Transactions
// ---------------------

export type ReapplyType = "A" | "B" | "C" | "D";
export type ReapplyStatus = "active_risk" | "under_review" | "clean";
export type RiskType =
  | "counterparty_sanctions_hit"
  | "corridor_restriction"
  | "stale_review"
  | "none";

export interface ReapplyTransaction {
  transactionId: string;
  originator: string;
  originatorCountry: string;
  beneficiary: string;
  beneficiaryCountry: string;
  transactionAmount: number;
  currency: string;
  frequency: number; // payments per month
  reapplyApprovalDate: string;
  lastReviewDate: string;
  reapplyType: ReapplyType;
  riskType: RiskType;
  riskFlag: boolean;
  riskFlagDate: string | null;
  riskFlagDetail: string | null;
  estimatedExposure: number; // USD
  currentStatus: ReapplyStatus;
  lob: string;
}

// ---------------------
// List Feeds
// ---------------------

export type FeedName =
  | "OFAC_SDN"
  | "OFAC_CONSOLIDATED"
  | "UN_SC"
  | "EU_CONSOLIDATED"
  | "HMT"
  | "ACUITY_AGGREGATED";

export type FeedStatus = "success" | "partial_failure" | "complete_failure";

export interface ListFeedRecord {
  feedId: string;
  feedName: FeedName;
  date: string;
  status: FeedStatus;
  latencyMinutes: number;
  recordCount: number;
  deltaRecords: number; // new/updated records vs prior day
  failureNote: string | null;
  relatedSpikeId: string | null;
}

// ---------------------
// Staffing
// ---------------------

export interface StaffingWeek {
  weekStart: string; // ISO date, Monday
  totalAnalysts: number;
  makers: number;
  checkers: number;
  qaLeads: number;
  teamLeads: number;
  weeklyAlertVolume: number;
  alertsPerAnalyst: number;
  overtimeIndicator: boolean;
  spikeFlag: boolean;
  spikeId: string | null;
}

// ---------------------
// Spike Events
// ---------------------

export type SpikeSeverity = "moderate" | "severe" | "critical";

export interface SpikeEvent {
  spikeId: string;
  label: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  peakDailyAlerts: number;
  severity: SpikeSeverity;
  rootCause: string;
  affectedFeeds: FeedName[];
  makerCheckerException: boolean;
  staffingOvertime: boolean;
  description: string;
}

// ---------------------
// Config Types
// ---------------------

export interface TierThreshold {
  tier: string;
  priority?: Priority;
  targetCompliance: number; // 0–1
  warningThreshold: number; // 0–1
  slaHours: number;
}

export interface ThresholdConfig {
  tiers: TierThreshold[];
  ofacFilingWindowDays: number;
  reapplyReviewSlaMonths: number;
}

export interface EscalationProtocol {
  protocolId: string;
  triggerCondition: string;
  notifyRoles: string[];
  locked: boolean; // visual placeholder — future feature
  description: string;
}

// ---------------------
// UI Filter State
// ---------------------

export interface FilterState {
  dateRange: { start: string; end: string } | null;
  tier: Tier | "all";
  priority: Priority | "all";
  slaStatus: SlaStatus | "all";
  lob: string | "all";
  disposition: DispositionType | "all";
  viewMode: 'split' | 'combined';
}
