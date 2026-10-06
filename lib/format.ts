export const DASH = "—";

export function usdCompact(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return DASH;
  return "$" + new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function usdPrice(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return DASH;
  if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return "$" + n.toPrecision(4);
}

export function int(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return DASH;
  return n.toLocaleString("en-US");
}

export function eth(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return DASH;
  return n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 1 : n >= 1 ? 3 : 4 });
}

export function timeAgo(ms: number | null | undefined) {
  if (!ms) return DASH;
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
