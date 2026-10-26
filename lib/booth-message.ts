import { getAddress } from "viem";

// The message the wallet signs for the Mars Booth. Free, no transaction.
// Shared by the page (to sign) and the API (to verify). Valid on the UTC day it names.
export function boothMessage(address: string, day: string) {
  return `WEI THE DOG · Mars Booth\n\nI hold $WEI and want my astronaut portrait.\n\nWallet: ${getAddress(address)}\nDate: ${day}`;
}

export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);
