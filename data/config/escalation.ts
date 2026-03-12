import type { EscalationProtocol } from "../../types/index";

export const ESCALATION_PROTOCOLS: EscalationProtocol[] = [
  {
    protocolId: "ESC-001",
    triggerCondition: "L1 SLA compliance drops below warning threshold (90%) for 2+ consecutive days",
    notifyRoles: ["Analyst Lead", "Audit Director"],
    locked: true,
    description:
      "Automatic escalation when L1 High/Medium SLA compliance breaches the 90% warning floor. " +
      "Analyst Lead must acknowledge within 4 hours; Audit Director receives daily briefing until resolved.",
  },
  {
    protocolId: "ESC-002",
    triggerCondition: "Maker-checker exception logged — same analyst appears as both maker and checker",
    notifyRoles: ["Director", "IT Security"],
    locked: true,
    description:
      "Any maker-checker separation failure triggers immediate notification to the Director of Sanctions " +
      "and IT Security for entitlement review. Remediation must be completed within 5 business days.",
  },
  {
    protocolId: "ESC-003",
    triggerCondition: "Reapply Type A record with active_risk status and estimatedExposure > $100,000",
    notifyRoles: ["SSCOE", "Legal"],
    locked: true,
    description:
      "Active sanctions exposure on a previously approved reapply transaction escalates to the Sanctions " +
      "Specialist Center of Excellence (SSCOE) and Legal for immediate exposure assessment and potential " +
      "transaction blocking.",
  },
  {
    protocolId: "ESC-004",
    triggerCondition: "OFAC 10-day filing deadline breached for any blocked account",
    notifyRoles: ["Regulatory Relations"],
    locked: true,
    description:
      "Overdue OFAC filings trigger escalation to Regulatory Relations within 24 hours of deadline breach. " +
      "Filing must be completed and confirmation logged within the same business day of escalation.",
  },
];
