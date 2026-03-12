import Image from "next/image";
import { META } from "@/data/config/meta";

export function TopNav() {
  const refreshStr = new Date(META.lastRefresh).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <nav className="bg-[#003571] text-white px-6 h-14 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-4">
        <Image
          src="/bank_of_america_logo.svg"
          alt="Bank of America"
          width={140}
          height={28}
          className="h-7 w-auto"
          priority
        />
        <div className="w-px h-5 bg-white/20" />
        <span className="text-sm font-medium text-white/90 tracking-wide">
          Sanctions Audit — Continuous Monitoring
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/70">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
        <span className="text-green-400 font-medium">Live</span>
        <span className="text-white/30 mx-1">·</span>
        <span>Last refresh: {refreshStr} UTC</span>
        <span className="text-white/30 mx-1">·</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wider font-medium">
          Prototype — Synthetic Data
        </span>
      </div>
    </nav>
  );
}
