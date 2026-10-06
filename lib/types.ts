export type Stats = {
  priceUsd: number | null;
  marketCap: number | null;
  volume24h: number | null;
  txns24h: number | null;
  vitality: number | null; // 0–100
  holders: number | null;
  holdersEligible: number | null; // at or above the index minimum (10,000 WEI)
  rewardSymbol: string | null; // what the index pays in (WETH)
  feesCollected: number | null; // in rewardSymbol
  feesCollectedUsd: number | null;
  paidToHolders: number | null; // in rewardSymbol
  paidToHoldersUsd: number | null;
  rounds: number | null;
  lastPayoutAt: number | null; // unix ms
  updatedAt: number;
};

export type Episode = {
  number: number;
  title: string;
  description: string;
  thumbnail: string;
  video_url: string;
  duration?: string;
  new?: boolean;
  locked: boolean;
  unlock_at_holders: number | null;
};
