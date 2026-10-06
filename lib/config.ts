import "server-only";
import site from "@/content/site.json";

// Server-only env access. Nothing here is exposed to the browser except
// values explicitly passed down as props (contract address, ticker).
const env = (key: string) => process.env[key]?.trim() || "";

export const config = {
  tokenAddress: env("TOKEN_ADDRESS") || site.contract,
  tokenSymbol: env("TOKEN_SYMBOL") || "WEI",
  // Optional: restrict DexScreener pools to one chain (e.g. "ethereum", "base"). Empty = all chains.
  dexChain: env("DEXSCREENER_CHAIN"),
  holdersProvider: (env("HOLDERS_PROVIDER") || "blockscout") as "blockscout" | "etherscan",
  blockscoutUrl: env("BLOCKSCOUT_URL").replace(/\/$/, ""),
  etherscanKey: env("ETHERSCAN_API_KEY"),
  explorerChainId: env("EXPLORER_CHAIN_ID") || "1",
  feeWallet: env("FEE_WALLET"),
  feesOverride: env("FEES_COLLECTED_ETH_OVERRIDE"),
  distributedOverride: env("ETH_DISTRIBUTED_ETH_OVERRIDE"),
  vitalityMaxTxns: Number(env("VITALITY_MAX_TXNS")) || 1000,
};
