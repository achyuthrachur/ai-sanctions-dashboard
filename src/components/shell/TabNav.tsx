"use client";
import { motion } from "framer-motion";

export type TabId =
  | "executive-summary"
  | "alert-review"
  | "blocked-accounts"
  | "reapply-risk"
  | "disposition-quality"
  | "list-feed-health";

interface Tab {
  id: TabId;
  label: string;
  hasBreach: boolean;
}

const TABS: Tab[] = [
  { id: "executive-summary",   label: "Executive Summary",   hasBreach: false },
  { id: "alert-review",        label: "Alert Review",        hasBreach: false },
  { id: "blocked-accounts",    label: "Blocked Accounts",    hasBreach: false },
  { id: "reapply-risk",        label: "Reapply Risk",        hasBreach: true  },
  { id: "disposition-quality", label: "Disposition Quality", hasBreach: false },
  { id: "list-feed-health",    label: "List & Feed Health",  hasBreach: false },
];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="bg-white border-b border-[#D0D9E8] px-6 flex items-end shrink-0 z-10 shadow-sm">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap
            ${activeTab === tab.id
              ? "text-[#0065B3] border-[#0065B3]"
              : "text-[#4A5D75] border-transparent hover:text-[#0A1628] hover:border-[#D0D9E8]"
            }
          `}
        >
          <span className="flex items-center gap-1.5">
            {tab.label}
            {tab.hasBreach && (
              <span className="relative flex items-center justify-center w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-[#E61030] opacity-60 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#E61030]" />
              </span>
            )}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0065B3] -mb-px"
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
