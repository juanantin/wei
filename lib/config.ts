import "server-only";
import site from "@/content/site.json";

// Addresses come from content/site.json and were each verified on chain
// (see data/discovery.json and scripts/config.mjs). Env vars only override.
const env = (key: string) => process.env[key]?.trim() || "";
// An all-zero address (the old .env.example placeholder) is treated as unset.
const addrEnv = (key: string) => {
  const v = env(key);
  return /^0x[0-9a-fA-F]{40}$/.test(v) && !/^0x0{40}$/.test(v) ? v : "";
};

export const config = {
  tokenAddress: addrEnv("TOKEN_ADDRESS") || site.contract,
  tokenSymbol: env("TOKEN_SYMBOL") || "WEI",
  chain: "base",
  pool: addrEnv("POOL_ADDRESS") || site.pool,
  indexUrl: site.links.index,
  // Committed outputs of the GitHub Actions indexer (public repo).
  dataUrl: env("DATA_URL") || "https://raw.githubusercontent.com/juanantin/wei/main/data",
  vitalityMaxTxns: Number(env("VITALITY_MAX_TXNS")) || 500,
};
