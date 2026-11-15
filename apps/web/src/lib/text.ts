import { LINK_TOKEN } from "@phish/shared";

/** Accept a few hand-typed variants of the link token and tidy whitespace */
export function normalizeFake(text: string): string {
  return text
    .replace(/\{\{\s*link\s*\}\}|\{\s*link\s*\}|\[\s*link\s*\]|<\s*link\s*>/gi, LINK_TOKEN)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type Segment =
  | { type: "text"; text: string; highlight?: boolean }
  | { type: "link" };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Split a message into text and link pieces, marking phrases to highlight */
export function segmentMessage(text: string, highlights: string[] = []): Segment[] {
  const segments: Segment[] = [];
  const highlightRe = highlights.length
    ? new RegExp(`(${highlights.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|")})`, "gi")
    : null;

  text.split(LINK_TOKEN).forEach((chunk, i) => {
    if (i > 0) segments.push({ type: "link" });
    if (!chunk) return;
    if (!highlightRe) {
      segments.push({ type: "text", text: chunk });
      return;
    }
    chunk.split(highlightRe).forEach((piece, j) => {
      if (piece) segments.push({ type: "text", text: piece, highlight: j % 2 === 1 });
    });
  });
  return segments;
}

/** Plain-text length as the player sees it (the token counts as nothing) */
export function visibleLength(text: string): number {
  return normalizeFake(text).split(LINK_TOKEN).join("").length;
}
