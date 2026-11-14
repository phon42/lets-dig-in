import type { Machine, MachineStatus, NetworkMap as Net, WhackView } from "@burrower/shared";
import { secs } from "../lib/format";

interface Props {
  map: Net;
  status?: MachineStatus[];
  orientation?: "landscape" | "portrait";
  /** Where to draw the mole (mole's own phone, or replay) */
  moleAt?: string | null;
  selected?: string | null;
  /** Machines the viewer can tap; null means not interactive */
  selectable?: Set<string> | null;
  /** Machines to emphasise (e.g. the mole's diggable neighbours) */
  highlight?: Set<string>;
  onSelect?: (id: string) => void;
  whack?: WhackView | null;
  revealed?: string | null;
  baits?: string[];
  /** Replay: the mole's route so far */
  path?: { machine: string; teleport: boolean }[];
  marks?: { machine: string; hit: boolean }[];
  className?: string;
}

interface Geometry {
  w: number;
  h: number;
  nodeW: number;
  nodeH: number;
  font: number;
  pos: (m: Machine) => { x: number; y: number };
}

function geometry(orientation: "landscape" | "portrait", layers: number): Geometry {
  const span = Math.max(1, layers - 1);
  if (orientation === "landscape") {
    const w = 1000;
    const h = 560;
    return {
      w,
      h,
      nodeW: 150,
      nodeH: 58,
      font: 24,
      pos: (m) => ({ x: 110 + (m.layer * 780) / span, y: (h * (m.slot + 0.5)) / m.slots }),
    };
  }
  const w = 420;
  const h = 600;
  return {
    w,
    h,
    nodeW: 124,
    nodeH: 54,
    font: 20,
    pos: (m) => ({ x: (w * (m.slot + 0.5)) / m.slots, y: 60 + (m.layer * 470) / span }),
  };
}

export function MoleGlyph({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse rx={18} ry={14} fill="#7c4a24" stroke="#1c0f05" strokeWidth={2} />
      <ellipse cx={-10} cy={10} rx={6} ry={4} fill="#f9a8d4" />
      <ellipse cx={10} cy={10} rx={6} ry={4} fill="#f9a8d4" />
      <circle cx={-6} cy={-4} r={2.4} fill="#0b0f17" />
      <circle cx={6} cy={-4} r={2.4} fill="#0b0f17" />
      <circle cx={0} cy={3} r={4.5} fill="#f472b6" />
    </g>
  );
}

export default function NetworkMap({
  map,
  status,
  orientation = "landscape",
  moleAt,
  selected,
  selectable,
  highlight,
  onSelect,
  whack,
  revealed,
  baits,
  path,
  marks,
  className,
}: Props) {
  const g = geometry(orientation, map.layers);
  const byId = Object.fromEntries(map.machines.map((m) => [m.id, m]));
  const statusById = Object.fromEntries((status ?? []).map((s) => [s.id, s]));
  const { nodeW: nw, nodeH: nh } = g;

  return (
    <svg viewBox={`0 0 ${g.w} ${g.h}`} className={className} style={{ userSelect: "none" }}>
      {/* Links */}
      {map.links.map(({ a, b }) => {
        const pa = g.pos(byId[a]);
        const pb = g.pos(byId[b]);
        const down = statusById[a]?.offlineMs || statusById[b]?.offlineMs;
        const lit = highlight && moleAt && ((a === moleAt && highlight.has(b)) || (b === moleAt && highlight.has(a)));
        return (
          <line
            key={`${a}-${b}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={lit ? "#d97706" : "#334155"}
            strokeWidth={lit ? 5 : 3}
            strokeDasharray={down ? "6 8" : undefined}
          />
        );
      })}

      {/* Replay route */}
      {path &&
        path.slice(1).map((step, i) => {
          const from = g.pos(byId[path[i].machine]);
          const to = g.pos(byId[step.machine]);
          return (
            <line
              key={`p${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={step.teleport ? "#64748b" : "#d97706"}
              strokeWidth={step.teleport ? 3 : 9}
              strokeDasharray={step.teleport ? "4 10" : undefined}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}

      {/* Machines */}
      {map.machines.map((m) => {
        const { x, y } = g.pos(m);
        const s = statusById[m.id];
        const canTap = !!selectable?.has(m.id);
        const isSelected = selected === m.id;
        const isLit = highlight?.has(m.id);
        const dim = selectable && !canTap;
        const whacked = whack?.machine === m.id ? whack : null;
        const mark = marks?.filter((k) => k.machine === m.id).at(-1);

        return (
          <g
            key={m.id}
            transform={`translate(${x},${y})`}
            onClick={canTap ? () => onSelect?.(m.id) : undefined}
            style={{ cursor: canTap ? "pointer" : undefined }}
            opacity={dim ? 0.45 : 1}
          >
            {revealed === m.id && (
              <circle r={nw / 2} fill="none" stroke="#ef4444" strokeWidth={6} className="ping-ring" />
            )}
            {isLit && (
              <rect
                x={-nw / 2 - 7}
                y={-nh / 2 - 7}
                width={nw + 14}
                height={nh + 14}
                rx={14}
                fill="none"
                stroke="#d97706"
                strokeWidth={3}
                strokeDasharray="6 5"
              />
            )}
            {s?.firewallMs ? (
              <rect
                x={-nw / 2 - 6}
                y={-nh / 2 - 6}
                width={nw + 12}
                height={nh + 12}
                rx={14}
                fill="none"
                stroke="#f97316"
                strokeWidth={5}
              />
            ) : null}
            <rect
              x={-nw / 2}
              y={-nh / 2}
              width={nw}
              height={nh}
              rx={10}
              fill={isSelected ? "#1e293b" : "#0f172a"}
              stroke={isSelected ? "#ffffff" : m.color}
              strokeWidth={isSelected ? 5 : 3}
            />
            <rect x={-nw / 2} y={-nh / 2} width={10} height={nh} rx={4} fill={m.color} />
            <text
              x={4}
              y={g.font * 0.35}
              textAnchor="middle"
              fontSize={g.font}
              fontFamily="JetBrains Mono, monospace"
              fontWeight={700}
              fill="#f1f5f9"
            >
              {m.name}
            </text>

            {m.jewel && (
              <text x={nw / 2 - 2} y={-nh / 2 + 4} fontSize={g.font} textAnchor="middle">
                {s?.looted ? "💰" : "💎"}
              </text>
            )}
            {m.entry && (
              <text y={nh / 2 + 17} textAnchor="middle" fontSize={13} fill="#94a3b8" fontWeight={700} letterSpacing={2}>
                ENTRY
              </text>
            )}
            {baits?.includes(m.id) && (
              <text x={-nw / 2 + 2} y={-nh / 2 + 4} fontSize={g.font * 0.9} textAnchor="middle">
                🪤
              </text>
            )}
            {s && s.whackVotes > 0 && (
              <g transform={`translate(${-nw / 2 + 4}, ${nh / 2})`}>
                <rect x={-16} y={-14} width={46} height={26} rx={13} fill="#dc2626" />
                <text x={7} y={5} textAnchor="middle" fontSize={15} fill="white" fontWeight={700}>
                  🔨{s.whackVotes}
                </text>
              </g>
            )}
            {s?.offlineMs ? (
              <g>
                <rect x={-nw / 2} y={-nh / 2} width={nw} height={nh} rx={10} fill="#000" opacity={0.7} />
                <text y={6} textAnchor="middle" fontSize={g.font * 0.75} fill="#fbbf24" fontWeight={700}>
                  ⚡ offline {secs(s.offlineMs)}
                </text>
              </g>
            ) : null}
            {s?.firewallMs ? (
              <text y={-nh / 2 - 12} textAnchor="middle" fontSize={14} fill="#fb923c" fontWeight={700}>
                🧱 {secs(s.firewallMs)}
              </text>
            ) : null}
            {moleAt === m.id && <MoleGlyph x={nw / 2 - 6} y={nh / 2 - 2} scale={orientation === "portrait" ? 0.9 : 1.1} />}
            {mark && (
              <text x={0} y={nh / 2 + 30} textAnchor="middle" fontSize={26} fontWeight={800} fill={mark.hit ? "#22c55e" : "#ef4444"}>
                {mark.hit ? "🔨 HIT" : "🔨 ✗"}
              </text>
            )}
            {whacked && (
              <g>
                <text y={-nh / 2 - 6} textAnchor="middle" fontSize={orientation === "portrait" ? 44 : 64} className="hammer-drop">
                  🔨
                </text>
                {whacked.stage === "RESULT" && (
                  <text
                    y={nh / 2 + 34}
                    textAnchor="middle"
                    fontSize={orientation === "portrait" ? 24 : 34}
                    fontWeight={800}
                    fill={whacked.hit ? "#22c55e" : "#ef4444"}
                    className="pop-in"
                  >
                    {whacked.hit ? "MOLE!" : "CLEAN"}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
