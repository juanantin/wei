import "server-only";
import site from "@/content/site.json";

// Addresses come from content/site.json and were each verified on chain
// (see data/discovery.json and scripts/config.mjs). Env vars only override.
const env = (key: string) => process.env[key]?.trim() || "";

export const config = {
  tokenAddress: env("TOKEN_ADDRESS") || site.contract,
  tokenSymbol: env("TOKEN_SYMBOL") || "WEI",
  chain: "base",
  pool: env("POOL_ADDRESS") || site.pool,
  indexUrl: site.links.index,
  // Committed outputs of the GitHub Actions indexer (public repo).
  dataUrl: env("DATA_URL") || "https://raw.githubusercontent.com/juanantin/wei/main/data",
  vitalityMaxTxns: Number(env("VITALITY_MAX_TXNS")) || 500,
};
