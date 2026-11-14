import type { Link, Machine, NetworkMap } from "@burrower/shared";
import { pick, shuffle, type Rng } from "./rng";

/** Candidate machine names per depth. Deeper layers hold the crown jewels. */
const LAYER_POOLS: readonly string[][] = [
  ["web-1", "web-2", "vpn", "mail"],
  ["app-1", "app-2", "hr-ws", "dev-ws", "print"],
  ["db-1", "db-2", "files", "dc-1", "git"],
  ["fin-db", "backup", "vault", "payroll", "secrets"],
];

/** Distinct, high-contrast colors so feed chips are glanceable */
const COLORS = [
  "#f87171",
  "#fb923c",
  "#facc15",
  "#a3e635",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f472b6",
  "#e2e8f0",
  "#fda4af",
];

const PER_LAYER = 3;

function linkKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function isConnected(machines: Machine[], links: Map<string, Link>): boolean {
  const adj = new Map<string, string[]>(machines.map((m) => [m.id, []]));
  for (const { a, b } of links.values()) {
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  const seen = new Set<string>([machines[0].id]);
  const stack = [machines[0].id];
  while (stack.length) {
    for (const n of adj.get(stack.pop()!)!) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen.size === machines.length;
}

/**
 * Builds a layered network: links mostly run between neighbouring layers and
 * nearby slots so the map draws without a tangle of crossing lines.
 */
export function generateNetwork(rng: Rng): NetworkMap {
  for (let attempt = 0; attempt < 200; attempt++) {
    const colors = shuffle(rng, COLORS);
    const machines: Machine[] = [];
    const byLayer: Machine[][] = LAYER_POOLS.map((pool, layer) =>
      shuffle(rng, pool)
        .slice(0, PER_LAYER)
        .map((name, slot) => {
          const m: Machine = {
            id: name,
            name,
            layer,
            slot,
            slots: PER_LAYER,
            color: colors[machines.length],
            jewel: false,
            entry: false,
          };
          machines.push(m);
          return m;
        }),
    );

    const links = new Map<string, Link>();
    const addLink = (a: Machine, b: Machine) => {
      links.set(linkKey(a.id, b.id), { a: a.id, b: b.id });
    };

    for (let layer = 1; layer < byLayer.length; layer++) {
      const prev = byLayer[layer - 1];
      for (const m of byLayer[layer]) {
        const near = shuffle(
          rng,
          prev.filter((p) => Math.abs(p.slot - m.slot) <= 1),
        );
        const count = rng() < 0.45 ? 2 : 1;
        near.slice(0, count).forEach((p) => addLink(p, m));
      }
      // Every machine needs a way deeper
      for (const p of prev) {
        const hasForward = byLayer[layer].some((m) => links.has(linkKey(p.id, m.id)));
        if (!hasForward) {
          const near = byLayer[layer].filter((m) => Math.abs(p.slot - m.slot) <= 1);
          addLink(p, pick(rng, near));
        }
      }
    }

    // A few sideways links inside a layer
    for (const layerMachines of byLayer) {
      for (let s = 0; s < layerMachines.length - 1; s++) {
        if (rng() < 0.3) addLink(layerMachines[s], layerMachines[s + 1]);
      }
    }

    if (!isConnected(machines, links)) continue;

    pick(rng, byLayer[0]).entry = true;
    for (const m of byLayer[byLayer.length - 1]) m.jewel = true;
    pick(rng, byLayer[byLayer.length - 2]).jewel = true;

    return { machines, links: [...links.values()], layers: byLayer.length };
  }
  throw new Error("Failed to generate a connected network");
}

export function neighborsOf(map: NetworkMap, id: string): string[] {
  const out: string[] = [];
  for (const { a, b } of map.links) {
    if (a === id) out.push(b);
    else if (b === id) out.push(a);
  }
  return out;
}
