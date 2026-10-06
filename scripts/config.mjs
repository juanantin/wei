// Every value here was read from the network (see data/discovery.json), not
// copied from another project. Anything still unknown is null, and the scripts
// that depend on it refuse to run while MISSING is non-empty.
export const CHAIN_ID = 8453; // Base, from eth_chainId
export const TOKEN = "0xd47bdd392def5eebd46a1d8ebb234d28a2087321"; // owner-supplied; symbol() = WEI
export const TOKEN_DECIMALS = 18; // decimals() on chain
export const POOL = "0xf9eb54a57310e92eb241364b1b1b569de4a838f2"; // DexScreener: only Base pool (Aerodrome WEI/WETH)
export const INDEX = "0xa0cb7a7a4beb0b4bb819637a961c1dfe9bee3507"; // owner-supplied index
export const INDEX_URL = `https://www.stockify.finance/indices/${INDEX}`;
export const REWARD_TOKEN = "0x4200000000000000000000000000000000000006"; // panel "WHAT IT HOLDS": WETH 100%; symbol() = WETH
export const REWARD_DECIMALS = 18; // decimals() on WETH, read separately from the token's
// Receives exactly 10.000% of fees in (0.0315579 of 0.315579 WETH) — the protocol's cut,
// measured by scripts/index-rewards.mjs (otherOutByRecipient). Never counted as paid to holders.
export const PROTOCOL_RECIPIENT = "0x2a201ada10b55f1979c8f5e5c303c8a3cde44c71";
export const START_BLOCK = 52140071; // INDEX deploy block (token + pool: 52140075), eth_getCode binary search — data/launch.txt

export const MISSING = Object.entries({ CHAIN_ID, TOKEN, TOKEN_DECIMALS, POOL, INDEX, REWARD_TOKEN, REWARD_DECIMALS, PROTOCOL_RECIPIENT, START_BLOCK })
  .filter(([, v]) => v === null || v === undefined)
  .map(([k]) => k);
