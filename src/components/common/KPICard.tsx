"use client";
import { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { animate } from "animejs";
import { cn } from "@/lib/utils";
import { EscalationTooltip } from "./EscalationTooltip";

export type KPIStatus = "green" | "amber" | "red" | "neutral";

export interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  trend?: number[];
  status: KPIStatus;
  /** Index into ESCALATION_PROTOCOLS array (0–3) */
  escalationKey?: 0 | 1 | 2 | 3;
  onClick?: () => void;
  subLabel?: string;
  className?: string;
}

const statusBorderLeft: Record<KPIStatus, string> = {
  green:   "border-l-[#1A6632]",
  amber:   "border-l-[#C45A00]",
  red:     "border-l-[#E61030] animate-[pulse-border_2s_infinite]",
  neutral: "border-l-[#D0D9E8]",
};

const statusDot: Record<KPIStatus, string> = {
  green:   "bg-[#1A6632]",
  amber:   "bg-[#C45A00]",
  red:     "bg-[#E61030] animate-pulse",
  neutral: "bg-[#D0D9E8]",
};

const statusValue: Record<KPIStatus, string> = {
  green:   "text-[#1A6632]",
  amber:   "text-[#C45A00]",
  red:     "text-[#E61030]",
  neutral: "text-[#0A1628]",
};

function KPICardInner({
  label, value, unit, delta, deltaLabel, trend,
  status, onClick, subLabel, className,
}: KPICardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const numericValue = typeof value === "number" ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue);
  const decimals = isNumeric && numericValue < 200 ? 1 : 0;

  useEffect(() => {
    if (!isNumeric || !valueRef.current) return;
    const el = valueRef.current;
    const obj = { val: 0 };
    animate(obj, {
      val: numericValue,
      duration: 900,
      easing: "easeOutExpo",
      onUpdate: () => {
        el.textContent = decimals === 1
          ? obj.val.toFixed(1)
          : Math.round(obj.val).toLocaleString();
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue]);

  return (
    <div
      className={cn(
        "relative bg-white rounded-lg border border-[#D0D9E8] border-l-4 p-5 shadow-sm transition-shadow",
        statusBorderLeft[status],
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#4A5D75] leading-tight">
          {label}
        </span>
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-0.5", statusDot[status])} />
      </div>

      <div className="flex items-baseline gap-1.5">
        {isNumeric ? (
          <span
            ref={valueRef}
            className={cn(
              "font-['IBM_Plex_Sans_Condensed'] font-bold text-[2rem] leading-none tabular-nums",
              statusValue[status]
            )}
          >
            {decimals === 1 ? numericValue.toFixed(1) : Math.round(numericValue).toLocaleString()}
          </span>
        ) : (
          <span className={cn("font-['IBM_Plex_Sans_Condensed'] font-bold text-[2rem] leading-none", statusValue[status])}>
            {value}
          </span>
        )}
        {unit && <span className="text-sm font-medium text-[#4A5D75]">{unit}</span>}
      </div>

      {delta !== undefined && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-xs",
          delta > 0 ? "text-[#1A6632]" : delta < 0 ? "text-[#E61030]" : "text-[#8699AF]"
        )}>
          {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
          <span>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% {deltaLabel ?? "vs prior 7d"}</span>
        </div>
      )}

      {subLabel && <p className="text-[11px] text-[#8699AF] mt-1.5">{subLabel}</p>}

      {trend && trend.length > 0 && (
        <div className="mt-3 flex items-end gap-px h-8">
          {trend.map((v, i) => {
            const max = Math.max(...trend);
            const min = Math.min(...trend);
            const range = max - min || 1;
            const height = Math.max(2, ((v - min) / range) * 28);
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-sm",
                  status === "red" ? "bg-[#E61030]/30" :
                  status === "amber" ? "bg-amber-400/40" :
                  "bg-[#0065B3]/25"
                )}
                style={{ height }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function KPICard(props: KPICardProps) {
  if (props.escalationKey !== undefined && (props.status === "red" || props.status === "amber")) {
    return (
      <EscalationTooltip protocolIndex={props.escalationKey}>
        <KPICardInner {...props} />
      </EscalationTooltip>
    );
  }
  return <KPICardInner {...props} />;
}
