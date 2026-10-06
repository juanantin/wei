// Finds the token's deployment block by binary search on eth_getCode, and the
// pool's by the same method. Prints paste-ready values last.
import { rpc, sleep } from "./lib.mjs";
import { TOKEN, POOL, INDEX } from "./config.mjs";

async function hasCode(a, block) {
  const c = await rpc("eth_getCode", [a, "0x" + block.toString(16)]);
  await sleep(120);
  return c && c !== "0x";
}
async function deployBlock(a) {
  let hi = Number(BigInt(await rpc("eth_blockNumber", [])));
  if (!(await hasCode(a, hi))) return null;
  let lo = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await hasCode(a, mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
const out = {};
for (const [k, a] of Object.entries({ TOKEN, POOL, INDEX })) {
  try {
    const b = await deployBlock(a);
    const blk = b != null ? await rpc("eth_getBlockByNumber", ["0x" + b.toString(16), false]) : null;
    out[k] = { address: a, block: b, time: blk ? new Date(Number(BigInt(blk.timestamp)) * 1000).toISOString() : null };
  } catch (e) {
    out[k] = { address: a, error: e.message };
  }
}
console.log("\n===== LAUNCH =====");
console.log(JSON.stringify(out, null, 2));
if (out.TOKEN?.block != null) console.log(`export const START_BLOCK = ${out.TOKEN.block};`);
