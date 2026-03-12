"use client";
import { useState } from "react";
import { ReferenceLine } from "recharts";
import type { SpikeEvent } from "@/types/index";

interface SpikeAnnotationProps {
  spike: SpikeEvent;
}

export function SpikeAnnotation({ spike }: SpikeAnnotationProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <ReferenceLine
      x={spike.startDate}
      stroke="#0065B3"
      strokeDasharray="4 3"
      strokeOpacity={0.6}
      label={
        <SpikeLabel spike={spike} hovered={hovered} onHover={setHovered} />
      }
    />
  );
}

function SpikeLabel({
  spike,
  hovered,
  onHover,
}: {
  spike: SpikeEvent;
  hovered: boolean;
  onHover: (v: boolean) => void;
}) {
  return (
    <g>
      <text
        x={4}
        y={-4}
        fill="#0065B3"
        fontSize={9}
        fontWeight={600}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        {spike.spikeId}
      </text>
      {hovered && (
        <foreignObject x={8} y={-80} width={200} height={72}>
          <div className="bg-white border border-[#D0D9E8] rounded-lg p-2.5 shadow-card-md text-[11px]">
            <p className="font-semibold text-[#0A1628] mb-0.5">{spike.label}</p>
            <p className="text-[#4A5D75] text-[10px] leading-snug">{spike.description}</p>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
