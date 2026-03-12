import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "green" | "amber" | "red" | "gray" | "blue";
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, pulse, className }: StatusDotProps) {
  const colors = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-[#E61030]",
    gray: "bg-gray-400",
    blue: "bg-[#0065B3]",
  };

  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full flex-shrink-0",
        colors[status],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}
