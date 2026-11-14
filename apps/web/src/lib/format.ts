import type { Machine, NetworkMap } from "@burrower/shared";

export function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function secs(ms: number): string {
  return `${Math.ceil(ms / 1000)}s`;
}

export function machineLookup(map: NetworkMap): Record<string, Machine> {
  return Object.fromEntries(map.machines.map((m) => [m.id, m]));
}

export const SOURCE_META = {
  LOGIN: { icon: "🔑", label: "Logins" },
  NETWORK: { icon: "🔌", label: "Network" },
  FILE: { icon: "📄", label: "Files" },
} as const;

export const TOOL_META = {
  RESET: { icon: "🔑", label: "Reset passwords", short: "Reset", help: "Kicks the mole back one machine if they're on it" },
  FIREWALL: { icon: "🧱", label: "Firewall", short: "Firewall", help: "Nobody digs into or out of it for 25s" },
  BAIT: { icon: "🪤", label: "Plant bait", short: "Bait", help: "If the mole loots it, they're revealed" },
} as const;
