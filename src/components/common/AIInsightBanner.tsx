import { BrainCircuit, Lock } from "lucide-react";

interface AIInsightBannerProps {
  insight: string;
  mode?: "live" | "prototype";
}

export function AIInsightBanner({ insight, mode = "prototype" }: AIInsightBannerProps) {
  return (
    <div className="rounded-lg bg-[#003571] border border-[#0065B3]/40 border-l-4 border-l-[#0065B3] p-4 flex items-start gap-4 relative">
      <div className="flex-shrink-0 mt-0.5">
        <BrainCircuit className="w-5 h-5 text-[#0065B3]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">
            AI Insight
          </span>
          {mode === "prototype" && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wider">
              Prototype — Static Data
            </span>
          )}
        </div>
        <p className="text-sm text-white/90 leading-relaxed font-['IBM_Plex_Sans']">
          {insight}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1.5 self-end">
        <Lock className="w-3.5 h-3.5 text-white/30" />
        <span className="text-[10px] text-white/30 italic">
          Connect to live data feed to enable AI-generated insights
        </span>
      </div>
    </div>
  );
}
