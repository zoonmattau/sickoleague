import { RosterSpot, Squad, Position, ContractType, ContractStatus } from "@prisma/client";

export type SerializedAflTeam = {
  id: string;
  name: string;
  abbreviation: string;
};

export type SerializedAflPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  positions: Position[];
  photoUrl: string | null;
  isAvailable: boolean;
  aflTeam: SerializedAflTeam | null;
};

export type SerializedContract = {
  id: string;
  startSeason: number;
  endSeason: number;
  totalValue: number;
  yearBreakdown: { season: number; value: number }[];
  isMinimum: boolean;
  contractType: ContractType;
  status: ContractStatus;
  tradeBlock: boolean;
  aflPlayer: SerializedAflPlayer;
  rosterPlayers: { id: string; rosterSpot: RosterSpot; squad: Squad }[];
};

export type SerializedRosterPlayer = {
  id: string;
  squad: Squad;
  rosterSpot: RosterSpot;
  contractId: string;
  contract: SerializedContract;
};

export type SpotConfig = {
  spot: RosterSpot;
  label: string;
  group: string;
  position: string;
  squad: Squad;
};

export type PlayerStats = {
  contractId: string;
  avgScore: number | null;
  last5Avg: number | null;
  gamesPlayed: number;
};

export type CaptaincyInfo = {
  seniorCaptainId: string | null;
  seniorVcId: string | null;
  reservesCaptainId: string | null;
  reservesVcId: string | null;
};
