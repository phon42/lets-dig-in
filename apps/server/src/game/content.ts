import type { FileAction } from "@burrower/shared";
import { pick, type Rng } from "./rng";

/** Service port by machine name prefix. Legit traffic always uses these. */
const PORTS: [prefix: string, port: number][] = [
  ["web", 443],
  ["vpn", 1194],
  ["mail", 993],
  ["app", 8080],
  ["hr-ws", 3389],
  ["dev-ws", 22],
  ["print", 631],
  ["db", 5432],
  ["files", 445],
  ["dc", 389],
  ["git", 22],
  ["fin-db", 1433],
  ["backup", 873],
  ["vault", 8200],
  ["payroll", 443],
  ["secrets", 8200],
];

/** Odd ports that a scan touches */
export const SCAN_PORTS = [21, 23, 135, 139, 3306, 5900, 6379, 9200, 11211, 27017];

const FILES: [prefix: string, files: string[]][] = [
  ["web", ["index.html", "access.log", "app.js"]],
  ["vpn", ["users.conf", "vpn.log"]],
  ["mail", ["inbox.mbox", "contacts.vcf"]],
  ["app", ["config.yml", "app.jar", "sessions.db"]],
  ["hr-ws", ["reviews.docx", "offers.pdf"]],
  ["dev-ws", ["main.go", ".env", "notes.md"]],
  ["print", ["queue.ps", "scan_0412.pdf"]],
  ["db", ["customers.sql", "orders.sql"]],
  ["files", ["shared.zip", "q3-plan.pptx"]],
  ["dc", ["ntds.dit", "gpo.xml"]],
  ["git", ["repo.pack", "deploy-keys"]],
  ["fin-db", ["ledger.xlsx", "invoices.sql"]],
  ["backup", ["nightly.tar", "snapshot.img"]],
  ["vault", ["root.pem", "master.key"]],
  ["payroll", ["payroll.csv", "bank-details.csv"]],
  ["secrets", ["tokens.json", "api-keys.env"]],
];

function lookup<T>(table: [string, T][], name: string, fallback: T): T {
  for (const [prefix, value] of table) {
    if (name.startsWith(prefix)) return value;
  }
  return fallback;
}

export function portFor(machine: string): number {
  return lookup(PORTS, machine, 443);
}

export function fileFor(rng: Rng, machine: string): string {
  return pick(rng, lookup(FILES, machine, ["notes.txt"]));
}

export function legitFileAction(rng: Rng): FileAction {
  const r = rng();
  if (r < 0.6) return "read";
  if (r < 0.93) return "write";
  // Occasional legit copies so "copy" alone isn't a giveaway
  return "copy";
}
