// Parser for the Stockify index panel's visible text. Mirrors scripts/panel-probe.mjs.
export type PanelFigures = {
  paidToHoldersUsd: number | null;
  paidToHolders: number | null;
  feesCollectedUsd: number | null;
  feesCollected: number | null;
  rewardSymbol: string | null;
  roundsPaid: number | null;
  lastPayout: { amount: number | null; holders: number | null; agoValue: number | null; agoUnit: string } | null;
};

export function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const num = (s?: string | null) => (s == null ? null : Number(s.replace(/,/g, "")));

export function parsePanel(text: string): PanelFigures {
  const paid = text.match(/Paid to holders \$([\d,.]+) ([\d.]+) ([A-Za-z]+)/);
  const fees = text.match(/Fees collected \$([\d,.]+) ([\d.]+) ([A-Za-z]+)/);
  const rounds = text.match(/Rounds paid ([\d,]+)/);
  const last = text.match(/Paid out ([\d.]+) ([A-Za-z]+) to ([\d,]+) holder ?s? (\d+)([smhdw]) ago/);
  return {
    paidToHoldersUsd: num(paid?.[1]),
    paidToHolders: num(paid?.[2]),
    feesCollectedUsd: num(fees?.[1]),
    feesCollected: num(fees?.[2]),
    rewardSymbol: paid?.[3] ?? fees?.[3] ?? null,
    roundsPaid: num(rounds?.[1]),
    lastPayout: last ? { amount: num(last[1]), holders: num(last[3]), agoValue: num(last[4]), agoUnit: last[5] } : null,
  };
}

const UNIT_MS: Record<string, number> = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 };
export const agoToMs = (v: number | null, u: string) => (v == null ? null : v * (UNIT_MS[u] ?? 0));
