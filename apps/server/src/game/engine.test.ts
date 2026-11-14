import { describe, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, GAME, type LogEntry } from "@burrower/shared";
import { Game, assignSources } from "./engine";
import { generateNetwork, neighborsOf } from "./network";
import { mulberry32 } from "./rng";

const PLAYERS = [
  { id: "mole", name: "Mo" },
  { id: "d1", name: "Ana" },
  { id: "d2", name: "Ben" },
  { id: "d3", name: "Cy" },
];

function newGame(seed = 1) {
  const game = new Game({
    players: PLAYERS,
    moleId: "mole",
    settings: { ...DEFAULT_SETTINGS, noise: "low" },
    round: 1,
    rng: mulberry32(seed),
  });
  for (const p of PLAYERS) game.markReady(p.id);
  game.tick(200); // leave briefing
  expect(game.phase).toBe("PLAYING");
  return game;
}

function run(game: Game, ms: number) {
  for (let t = 0; t < ms; t += 200) game.tick(200);
}

/** All log lines across all sources, via a defender who temporarily sees everything */
function allLogs(game: Game): LogEntry[] {
  // @ts-expect-error reaching into private state is fine in tests
  return game.log as LogEntry[];
}

describe("network", () => {
  test("is connected, layered, with one entry and four jewels", () => {
    for (let seed = 1; seed < 50; seed++) {
      const map = generateNetwork(mulberry32(seed));
      expect(map.machines).toHaveLength(12);
      expect(map.machines.filter((m) => m.entry)).toHaveLength(1);
      expect(map.machines.filter((m) => m.jewel)).toHaveLength(4);
      for (const m of map.machines) expect(neighborsOf(map, m.id).length).toBeGreaterThan(0);
    }
  });
});

describe("assignSources", () => {
  test("covers every source for any number of defenders", () => {
    for (let n = 1; n <= 6; n++) {
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const out = assignSources(ids, ["LOGIN", "NETWORK", "FILE"]);
      const covered = new Set(Object.values(out).flat());
      expect(covered.size).toBe(3);
      for (const id of ids) expect(out[id].length).toBeGreaterThan(0);
    }
  });
});

describe("the mismatch rule", () => {
  test("legit traffic always leaves a full NETWORK + LOGIN + FILE triple", () => {
    const game = newGame(7);
    run(game, 60_000); // mole does nothing
    const logs = allLogs(game);
    expect(logs.length).toBeGreaterThan(30);
    for (const login of logs.filter((e) => e.source === "LOGIN")) {
      const net = logs.find((e) => e.source === "NETWORK" && e.machine === login.machine && e.from === login.from);
      expect(net).toBeDefined();
    }
    for (const file of logs.filter((e) => e.source === "FILE" && e.at > 3000)) {
      const login = logs.find((e) => e.source === "LOGIN" && e.machine === file.machine && e.user === file.user);
      expect(login).toBeDefined();
    }
  });

  test("a quiet dig leaves a login with no matching connection, then moves the mole", () => {
    const game = newGame(3);
    const start = game.moleView().position;
    const target = game.moleView().neighbors[0];
    expect(game.moleDig("mole", target, "QUIET")).toBeNull();
    const before = allLogs(game).length;
    run(game, GAME.quietDigMs + 400);
    expect(game.moleView().position).toBe(target);

    const newLogs = allLogs(game).slice(before);
    const moleLogin = newLogs.find((e) => e.source === "LOGIN" && e.machine === target && e.from === start);
    expect(moleLogin).toBeDefined();
    // The dig itself schedules nothing on the NETWORK or FILE feeds
    // @ts-expect-error private
    expect(game.pending.filter((p) => p.tag !== undefined)).toHaveLength(0);
  });

  test("a quiet dig schedules exactly one trace, a LOGIN", () => {
    const game = newGame(11);
    game.moleDig("mole", game.moleView().neighbors[0], "QUIET");
    // @ts-expect-error private
    const tagged = game.pending.filter((p) => p.tag !== undefined);
    expect(tagged.map((p: { fields: { source: string } }) => p.fields.source)).toEqual(["LOGIN"]);
  });

  test("cancelling a dig drops its future traces", () => {
    const game = newGame(4);
    const target = game.moleView().neighbors[0];
    game.moleDig("mole", target, "QUIET");
    game.moleCancel("mole");
    // @ts-expect-error private
    expect(game.pending.some((p) => p.tag !== undefined)).toBe(false);
  });
});

describe("whacks", () => {
  test("need two defenders and catch the mole on its machine", () => {
    const game = newGame(5);
    const entry = game.moleView().position;
    expect(game.voteWhack("d1", entry)).toBeNull();
    game.tick(200);
    expect(game.publicView().whack).toBeNull();
    game.voteWhack("d2", entry);
    game.tick(200);
    expect(game.publicView().whack?.stage).toBe("DROPPING");
    expect(game.publicView().whack?.hit).toBeUndefined();
    run(game, GAME.whackSuspenseMs);
    expect(game.publicView().whack).toMatchObject({ stage: "RESULT", hit: true });
    expect(game.publicView().catches).toBe(1);
    expect(game.publicView().whacksLeft).toBe(GAME.startingWhacks - 1);
  });

  test("a miss takes the machine offline", () => {
    const game = newGame(6);
    const other = game.map.machines.find((m) => m.id !== game.moleView().position)!.id;
    game.voteWhack("d1", other);
    game.voteWhack("d3", other);
    game.tick(200);
    const status = game.publicView().machines.find((m) => m.id === other)!;
    expect(status.offlineMs).toBeGreaterThan(0);
  });

  test("two catches wins it for the defenders", () => {
    const game = newGame(8);
    for (let i = 0; i < 2; i++) {
      const at = game.moleView().position;
      game.voteWhack("d1", at);
      game.voteWhack("d2", at);
      run(game, GAME.whackSuspenseMs + GAME.whackResultMs + 400);
    }
    expect(game.phase).toBe("GAME_OVER");
    expect(game.outcome?.winner).toBe("DEFENDERS");
    expect(game.publicView().replay?.whacks).toHaveLength(2);
  });
});

describe("mole win", () => {
  test("looting three jewels wins", () => {
    const game = newGame(9);
    // Teleport the mole for the test; the dig mechanics are covered above
    const jewels = game.map.machines.filter((m) => m.jewel).slice(0, 3);
    for (const jewel of jewels) {
      // @ts-expect-error private
      game.position = jewel.id;
      expect(game.moleLoot("mole")).toBeNull();
      run(game, GAME.lootMs + 400);
    }
    expect(game.phase).toBe("GAME_OVER");
    expect(game.outcome?.winner).toBe("MOLE");
  });

  test("bait reveals a looting mole", () => {
    const game = newGame(10);
    const jewel = game.map.machines.find((m) => m.jewel)!;
    const baiter = Object.entries(game.sources).find(([, s]) => s.includes("FILE"))![0];
    expect(game.useTool(baiter, "BAIT", jewel.id)).toBeNull();
    // @ts-expect-error private
    game.position = jewel.id;
    game.moleLoot("mole");
    expect(game.publicView().revealedMole?.machine).toBe(jewel.id);
  });
});
