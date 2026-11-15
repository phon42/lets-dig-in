import type { Spice } from "@phish/shared";
import { POINTS_PER_HOOK } from "@phish/shared";

export const SPICE_INFO: Record<Spice, { label: string; chillies: string; blurb: string; color: string }> = {
  mild: { label: "Mild", chillies: "🌶️", blurb: "Sneaky link", color: "bg-pea text-white" },
  medium: { label: "Medium", chillies: "🌶️🌶️", blurb: "Costume link", color: "bg-mustard text-ink" },
  hot: { label: "Hot", chillies: "🌶️🌶️🌶️", blurb: "Blatant link", color: "bg-ketchup text-white" },
};

export default function SpiceBadge({ spice, showPoints = false, className = "" }: { spice: Spice; showPoints?: boolean; className?: string }) {
  const info = SPICE_INFO[spice];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${info.color} ${className}`}>
      <span className="tracking-[-0.2em] mr-1">{info.chillies}</span>
      {info.label}
      {showPoints && <span className="opacity-80">· {POINTS_PER_HOOK[spice]}/hook</span>}
    </span>
  );
}
