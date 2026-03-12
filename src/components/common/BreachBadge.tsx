import { cn } from "@/lib/utils";

type BreachLevel = "green" | "amber" | "red" | "neutral";

interface BreachBadgeProps {
  level: BreachLevel;
  label: string;
  className?: string;
}

const styles: Record<BreachLevel, string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-[#FDEAED] text-[#E61030] border-[#E61030]/30",
  neutral: "bg-[#F5F7FA] text-[#4A5D75] border-[#D0D9E8]",
};

export function BreachBadge({ level, label, className }: BreachBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
        styles[level],
        className
      )}
    >
      {label}
    </span>
  );
}
