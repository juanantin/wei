"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Stats } from "@/lib/types";

const REFRESH_MS = 60_000;

type State = { stats: Stats | null; loading: boolean };
const StatsContext = createContext<State>({ stats: null, loading: true });

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ stats: null, loading: true });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const stats = (await res.json()) as Stats;
        if (alive) setState({ stats, loading: false });
      } catch {
        // Keep the last good values; show "—" if we never had any.
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return <StatsContext.Provider value={state}>{children}</StatsContext.Provider>;
}

export const useStats = () => useContext(StatsContext);
