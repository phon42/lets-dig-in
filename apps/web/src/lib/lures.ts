import type { Lure, Scenario, Spice } from "@phish/shared";

/**
 * Generates lookalike links for a scenario. Every fake has to carry one of
 * these, so the real message (the only one on the real domain) can always be
 * found by someone who reads links carefully.
 *
 * - mild: sneaky typosquats (hardest to spot, pays least)
 * - medium: hyphenated / subdomain costume tricks
 * - hot: blatant (IP addresses, shorteners, random domains), pays most
 */

interface LureTemplate {
  url: string;
  trick: string;
  explanation: string;
}

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const randomId = (length = 6) =>
  Array.from({ length }, () => pick([..."abcdefghjkmnpqrstuvwxyz23456789"])).join("");

const randomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

/** "brinebank.com" -> { name: "brinebank", tld: "com" } */
function splitDomain(domain: string): { name: string; tld: string } {
  const [name, ...rest] = domain.split(".");
  return { name, tld: rest.join(".") };
}

function randomPath(scenario: Scenario): string {
  const word = pick(scenario.paths);
  const roll = Math.random();
  if (roll < 0.35) return `/${word}`;
  if (roll < 0.7) return `/${word}?id=${randomDigits(6)}`;
  return `/${word}/${randomId(5)}`;
}

/** Replace the nth occurrence of `find` (n chosen at random) */
function replaceOne(text: string, find: string, replacement: string): string {
  const indexes: number[] = [];
  let i = text.indexOf(find);
  while (i !== -1) {
    indexes.push(i);
    i = text.indexOf(find, i + 1);
  }
  if (indexes.length === 0) return text;
  const at = pick(indexes);
  return text.slice(0, at) + replacement + text.slice(at + find.length);
}

function mildTemplates(scenario: Scenario): LureTemplate[] {
  const { name, tld } = splitDomain(scenario.domain);
  const path = () => randomPath(scenario);
  const out: LureTemplate[] = [];

  const costumes: [string, string, string][] = [
    ["m", "rn", `"rn" squashed together is dressed up as an "m"`],
    ["w", "vv", `Two v's ("vv") pretending to be a "w"`],
    ["l", "1", `That "l" is actually the number 1`],
    ["o", "0", `That "o" is actually a zero`],
    ["i", "l", `The "i" was swapped for an "l"`],
    ["e", "3", `That "e" is actually the number 3`],
  ];
  for (const [find, replacement, explanation] of costumes) {
    if (name.includes(find)) {
      out.push({
        url: `${replaceOne(name, find, replacement)}.${tld}${path()}`,
        trick: "Letter costume",
        explanation,
      });
    }
  }

  // Doubled letter
  if (name.length > 3) {
    const at = 1 + Math.floor(Math.random() * (name.length - 2));
    out.push({
      url: `${name.slice(0, at)}${name[at]}${name.slice(at)}.${tld}${path()}`,
      trick: "Double trouble",
      explanation: `There's an extra "${name[at]}" hiding in ${name}`,
    });
  }

  // Swapped neighbours
  if (name.length > 4) {
    const at = 1 + Math.floor(Math.random() * (name.length - 3));
    if (name[at] !== name[at + 1]) {
      const swapped = name.slice(0, at) + name[at + 1] + name[at] + name.slice(at + 2);
      out.push({
        url: `${swapped}.${tld}${path()}`,
        trick: "Letter swap",
        explanation: `Two letters are swapped: "${name[at]}${name[at + 1]}" became "${name[at + 1]}${name[at]}"`,
      });
    }
  }

  // Dropped letter
  if (name.length > 4) {
    const at = 1 + Math.floor(Math.random() * (name.length - 2));
    out.push({
      url: `${name.slice(0, at)}${name.slice(at + 1)}.${tld}${path()}`,
      trick: "Missing letter",
      explanation: `The "${name[at]}" has gone missing from ${name}`,
    });
  }

  // Wrong ending
  const tldSwaps: Record<string, string[]> = {
    com: ["co", "cm", "com.co", "net"],
    "co.uk": ["uk.com", "co", "com"],
    "gov.uk": ["gov-uk.com", "uk.gov.co"],
    "ac.uk": ["ac-uk.com", "co.uk"],
  };
  const swapTld = pick(tldSwaps[tld] ?? ["com", "co"]);
  out.push({
    url: `${name}.${swapTld}${path()}`,
    trick: "Wrong ending",
    explanation: `The real site ends in .${tld}, this one ends in .${swapTld}`,
  });

  return out;
}

function mediumTemplates(scenario: Scenario): LureTemplate[] {
  const { name, tld } = splitDomain(scenario.domain);
  const word = () => pick(scenario.paths);
  const path = () => randomPath(scenario);
  const helper = pick(["secure", "account", "support", "verify", "help", "online"]);

  return [
    {
      url: `${name}-${helper}.com${path()}`,
      trick: "Hyphen add-on",
      explanation: `Anyone can register "${name}-${helper}.com". It isn't ${scenario.domain}`,
    },
    {
      url: `${helper}-${name}.${tld}${path()}`,
      trick: "Hyphen add-on",
      explanation: `"${helper}-${name}" is a different domain from "${name}" entirely`,
    },
    {
      url: `${scenario.domain}.${word()}-${pick(["check", "portal", "centre", "review"])}.net${path()}`,
      trick: "Subdomain costume",
      explanation: `Read domains right to left: this one is owned by whatever comes just before .net, and "${scenario.domain}" is just a costume in front of it`,
    },
    {
      url: `my${name}${pick(["", "-"])}${pick(["login", "online", "portal"])}.com${path()}`,
      trick: "Brand sandwich",
      explanation: `Wrapping the brand in extra words makes a brand-new domain`,
    },
    {
      url: `${name}.${pick(["support", "help", "info", "services"])}${path()}`,
      trick: "Fancy ending",
      explanation: `New endings like .support or .help are cheap for anyone to buy`,
    },
  ];
}

function hotTemplates(scenario: Scenario): LureTemplate[] {
  const { name } = splitDomain(scenario.domain);
  const octet = () => 11 + Math.floor(Math.random() * 230);
  return [
    {
      url: `http://${octet()}.${octet()}.${octet()}.${octet()}/${name}/${pick(scenario.paths)}`,
      trick: "Bare IP address",
      explanation: "A raw IP address instead of a domain. Real brands don't do this",
    },
    {
      url: `bit.ly/${randomId(7)}`,
      trick: "Mystery shortener",
      explanation: "Shortened links hide where they really go, so you can't check the domain at all",
    },
    {
      url: `${pick(["secure", "account", "login"])}-${pick(["verify", "update", "check"])}-${pick(["portal", "now", "centre"])}.${pick(["xyz", "top", "click", "info"])}/${name}`,
      trick: "Random domain",
      explanation: "The brand only appears after the slash. The domain itself has nothing to do with it",
    },
    {
      url: `${name}.${pick(["login-update", "verify-now", "account-alert"])}.${pick(["xyz", "top", "click"])}${randomPath(scenario)}`,
      trick: "Dodgy ending",
      explanation: "A cheap .xyz-style domain with the brand stuck on the front",
    },
  ];
}

const TEMPLATES: Record<Spice, (s: Scenario) => LureTemplate[]> = {
  mild: mildTemplates,
  medium: mediumTemplates,
  hot: hotTemplates,
};

export const SPICES: Spice[] = ["mild", "medium", "hot"];

/** One random lure of the given spice, avoiding URLs already dealt */
export function makeLure(scenario: Scenario, spice: Spice, used: Set<string>): Lure {
  const options = shuffle(TEMPLATES[spice](scenario));
  const template =
    options.find((t) => !used.has(t.url) && t.url !== scenario.real.url) ?? options[0];
  used.add(template.url);
  return { id: randomId(8), spice, ...template };
}

/** Deal each player one lure per spice level */
export function dealLures(scenario: Scenario, playerIds: string[]): Record<string, Lure[]> {
  const used = new Set<string>();
  const dealt: Record<string, Lure[]> = {};
  for (const playerId of playerIds) {
    dealt[playerId] = SPICES.map((spice) => makeLure(scenario, spice, used));
  }
  return dealt;
}

export function dealTips(tips: string[], playerIds: string[], count = 2): Record<string, string[]> {
  return Object.fromEntries(playerIds.map((id) => [id, shuffle(tips).slice(0, count)]));
}

export { shuffle, randomId };
