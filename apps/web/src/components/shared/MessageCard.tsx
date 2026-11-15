import type { PublicScenario } from "@phish/shared";
import { segmentMessage } from "../../lib/text";

export type LinkStatus = "neutral" | "fake" | "real";
export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

interface MessageCardProps {
  scenario: PublicScenario;
  text: string;
  url: string;
  size?: CardSize;
  highlights?: string[];
  linkStatus?: LinkStatus;
  className?: string;
}

const TEXT_SIZE: Record<CardSize, string> = {
  xs: "text-[0.8rem] leading-snug",
  sm: "text-[0.9rem] leading-snug",
  md: "text-base leading-snug",
  lg: "text-xl leading-snug",
  xl: "text-[1.75rem] leading-snug",
};

const META_SIZE: Record<CardSize, string> = {
  xs: "text-[0.65rem]",
  sm: "text-[0.7rem]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-lg",
};

function brandColor(brand: string): string {
  const palette = ["#E23D28", "#4EA8DE", "#6BAA3A", "#E8A33D", "#7A4E2D", "#8E5BD0", "#14213D"];
  let hash = 0;
  for (const ch of brand) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function Link({ url, status }: { url: string; status: LinkStatus }) {
  const base = "font-mono font-bold break-all rounded px-[0.2em] -mx-[0.05em] text-[0.92em]";
  if (status === "fake") {
    return (
      <span className={`${base} bg-ketchup/15 text-ketchup-dark underline decoration-wavy decoration-ketchup decoration-2 underline-offset-4`}>
        🎣 {url || "(no link)"}
      </span>
    );
  }
  if (status === "real") {
    return <span className={`${base} bg-pea/20 text-pea-dark underline decoration-2 underline-offset-4`}>✓ {url}</span>;
  }
  return <span className={`${base} text-[#1a5fd0] underline decoration-[#1a5fd0]/50 decoration-2 underline-offset-2`}>{url || "your-link-here"}</span>;
}

function Body({ text, url, highlights, linkStatus }: { text: string; url: string; highlights: string[]; linkStatus: LinkStatus }) {
  return (
    <p className="whitespace-pre-wrap break-words">
      {segmentMessage(text, highlights).map((seg, i) =>
        seg.type === "link" ? (
          <Link key={i} url={url} status={linkStatus} />
        ) : seg.highlight ? (
          <mark key={i} className="highlight-tell bg-transparent text-inherit">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  );
}

/** Draws a message the way it would actually arrive: SMS, email, push or DM */
export default function MessageCard({
  scenario,
  text,
  url,
  size = "md",
  highlights = [],
  linkStatus = "neutral",
  className = "",
}: MessageCardProps) {
  const body = <Body text={text} url={url} highlights={highlights} linkStatus={linkStatus} />;
  const meta = META_SIZE[size];
  const color = brandColor(scenario.brand);

  if (scenario.channel === "email") {
    return (
      <div className={`bg-white rounded-xl border-2 border-ink/80 overflow-hidden text-ink ${TEXT_SIZE[size]} ${className}`}>
        <div className={`bg-[#f1f3f7] border-b border-ink/15 px-[0.9em] py-[0.5em] ${meta}`}>
          <div className="flex items-center gap-2">
            <span className="size-[1.6em] rounded-full text-white font-bold flex items-center justify-center shrink-0" style={{ background: color }}>
              {scenario.brand[0]}
            </span>
            <span className="truncate">
              <span className="text-ink/50">From </span>
              <span className="font-semibold">{scenario.sender}</span>
            </span>
          </div>
          {scenario.subject && <div className="font-bold mt-1 truncate text-[1.15em]">{scenario.subject}</div>}
        </div>
        <div className="px-[0.9em] py-[0.7em]">{body}</div>
      </div>
    );
  }

  if (scenario.channel === "push") {
    return (
      <div className={`bg-white/95 rounded-[1.1em] border-2 border-ink/80 px-[0.8em] py-[0.7em] text-ink shadow-sm ${TEXT_SIZE[size]} ${className}`}>
        <div className={`flex items-center gap-2 mb-1 ${meta} uppercase tracking-wide text-ink/55 font-semibold`}>
          <span className="size-[1.7em] rounded-[0.45em] flex items-center justify-center text-white normal-case" style={{ background: color }}>
            {scenario.brand[0]}
          </span>
          <span className="truncate">{scenario.sender}</span>
          <span className="ml-auto normal-case">now</span>
        </div>
        {body}
      </div>
    );
  }

  if (scenario.channel === "dm") {
    return (
      <div className={`bg-white rounded-xl border-2 border-ink/80 overflow-hidden text-ink ${TEXT_SIZE[size]} ${className}`}>
        <div className={`flex items-center gap-2 px-[0.8em] py-[0.45em] border-b border-ink/10 ${meta}`}>
          <span className="size-[1.8em] rounded-full text-white font-bold flex items-center justify-center shrink-0" style={{ background: color }}>
            {scenario.brand[0]}
          </span>
          <span className="font-semibold truncate">{scenario.sender}</span>
        </div>
        <div className="px-[0.8em] py-[0.7em]">
          <div className="bg-[#eef1f8] rounded-[1em] rounded-tl-[0.3em] px-[0.8em] py-[0.55em]">{body}</div>
        </div>
      </div>
    );
  }

  // SMS
  return (
    <div className={`bg-white rounded-xl border-2 border-ink/80 overflow-hidden text-ink ${TEXT_SIZE[size]} ${className}`}>
      <div className={`text-center py-[0.35em] border-b border-ink/10 text-ink/60 font-semibold ${meta}`}>💬 {scenario.sender}</div>
      <div className="px-[0.8em] py-[0.7em]">
        <div className="relative bg-[#e9e9eb] rounded-[1.1em] rounded-bl-[0.3em] px-[0.8em] py-[0.55em] max-w-[96%]">{body}</div>
      </div>
    </div>
  );
}
