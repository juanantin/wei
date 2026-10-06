export type Stats = {
  priceUsd: number | null;
  marketCap: number | null;
  volume24h: number | null;
  txns24h: number | null;
  vitality: number | null; // 0–100
  holders: number | null;
  feesCollectedEth: number | null;
  ethDistributedEth: number | null;
  lastDistributionAt: number | null; // unix ms
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
