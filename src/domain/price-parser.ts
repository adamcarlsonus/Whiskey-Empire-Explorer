export interface ParsedPrice {
  displayPrice: string;
  sortablePriceCents: number | null;
}

const AMOUNT_PATTERN = /\$?\s*(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?/g;

export function containsUsdAmount(value: string): boolean {
  const text = value.trim();
  if (!text || /(?:proof|abv|%|€|£|¥)/i.test(text)) return false;
  return [...text.matchAll(AMOUNT_PATTERN)].some((match) => match[1] !== undefined);
}

export function parsePrice(value: string): ParsedPrice {
  const displayPrice = value.trim().replace(/\s+/g, " ");
  if (!containsUsdAmount(displayPrice)) return { displayPrice, sortablePriceCents: null };

  const matches = [...displayPrice.matchAll(AMOUNT_PATTERN)];
  if (matches.length !== 1) return { displayPrice, sortablePriceCents: null };
  if (/\d\s*(?:-|–|—|to)\s*\$?\s*\d/i.test(displayPrice)) {
    return { displayPrice, sortablePriceCents: null };
  }

  const match = matches[0];
  const wholeText = match?.[1];
  if (!wholeText) return { displayPrice, sortablePriceCents: null };
  const whole = Number(wholeText.replaceAll(",", ""));
  const decimal = (match[2] ?? "").padEnd(2, "0").slice(0, 2);
  const cents = whole * 100 + Number(decimal || "0");
  if (!Number.isSafeInteger(cents)) return { displayPrice, sortablePriceCents: null };
  return { displayPrice, sortablePriceCents: cents };
}
