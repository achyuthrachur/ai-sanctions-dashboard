"use client";
import { useState, useRef } from "react";
import { Lock } from "lucide-react";
import { ESCALATION_PROTOCOLS } from "../../../data/config/escalation";

interface EscalationTooltipProps {
  protocolIndex: 0 | 1 | 2 | 3;
  children: React.ReactNode;
}

export function EscalationTooltip({ protocolIndex, children }: EscalationTooltipProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const protocol = ESCALATION_PROTOCOLS[protocolIndex];

  const handleMouseEnter = () => { timerRef.current = setTimeout(() => setOpen(true), 300); };
  const handleMouseLeave = () => { if (timerRef.current) clearTimeout(timerRef.current); setOpen(false); };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-[280px] rounded-lg border border-gray-200 bg-white p-4 shadow-card-md pointer-events-none opacity-60 animate-fade-in-down">
          <div className="flex items-center gap-1.5 mb-2">
            <Lock className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Escalation Protocol — Future Feature</span>
          </div>
          <div className="text-xs font-semibold text-text-primary mb-1">{protocol.protocolId}</div>
          <p className="text-xs text-text-secondary mb-2">{protocol.description}</p>
          <div className="pt-1.5 border-t border-gray-100">
            {protocol.notifyRoles.map((role, i) => (
              <p key={i} className="text-xs text-text-muted">{role}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
