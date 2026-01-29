"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlayersStats } from "./players-stats";
import { toast } from "sonner";

type PlayerStat = {
  contractId: string;
  aflPlayerId: string;
  firstName: string;
  lastName: string;
  positions: string[];
  photoUrl: string | null;
  aflTeam: string | null;
  clubId: string;
  clubName: string;
  clubAbbr: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  salary: number;
  tradeBlock: boolean;
  endSeason: number;
  avgScore: number | null;
  last5Avg: number | null;
  gamesPlayed: number;
  seniorsGames: number;
  reservesGames: number;
};

type Props = {
  stats: PlayerStat[];
  clubs: { id: string; name: string; abbreviation: string }[];
  myClubId: string | null;
};

export function PlayersStatsWrapper({ stats, clubs, myClubId }: Props) {
  const router = useRouter();
  const [shortlist, setShortlist] = useState<Set<string>>(() => {
    // Load from localStorage on initial render
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("playerShortlist");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const handleToggleShortlist = useCallback((contractId: string) => {
    setShortlist((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
        toast.success("Removed from shortlist");
      } else {
        next.add(contractId);
        toast.success("Added to shortlist");
      }
      // Save to localStorage
      localStorage.setItem("playerShortlist", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleProposeTrade = useCallback((player: PlayerStat) => {
    // Navigate to trades page with player pre-selected
    router.push(`/dashboard/trades?propose=${player.contractId}`);
  }, [router]);

  return (
    <PlayersStats
      stats={stats}
      clubs={clubs}
      myClubId={myClubId}
      shortlist={shortlist}
      onToggleShortlist={handleToggleShortlist}
      onProposeTrade={handleProposeTrade}
    />
  );
}
