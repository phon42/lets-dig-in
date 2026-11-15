import type { Award, Player } from "@phish/shared";

/** End-of-game superlatives. Each needs a clear, non-zero leader. */
export function computeAwards(players: Record<string, Player>): Award[] {
  const list = Object.values(players);
  const awards: Award[] = [];

  const leader = (value: (p: Player) => number): Player | null => {
    const sorted = [...list].sort((a, b) => value(b) - value(a));
    if (!sorted[0] || value(sorted[0]) === 0) return null;
    if (sorted[1] && value(sorted[1]) === value(sorted[0])) return null;
    return sorted[0];
  };

  const chef = leader((p) => p.score);
  if (chef) {
    awards.push({ id: "chef", emoji: "👨‍🍳", title: "Head Chef", playerId: chef.id, detail: `${chef.score.toLocaleString()} points` });
  }
  const angler = leader((p) => p.stats.hooks);
  if (angler) {
    awards.push({ id: "angler", emoji: "🎣", title: "Master Angler", playerId: angler.id, detail: `Hooked ${angler.stats.hooks} ${angler.stats.hooks === 1 ? "victim" : "victims"}` });
  }
  const eagle = leader((p) => p.stats.spots);
  if (eagle) {
    awards.push({ id: "eagle", emoji: "🦅", title: "Eagle Eye", playerId: eagle.id, detail: `Spotted the real one ${eagle.stats.spots}×` });
  }
  const guppy = leader((p) => p.stats.gotHooked);
  if (guppy) {
    awards.push({ id: "guppy", emoji: "🐟", title: "Gullible Guppy", playerId: guppy.id, detail: `Took the bait ${guppy.stats.gotHooked}×` });
  }
  return awards;
}
