// Re-export Prisma types for convenience
export type {
  Coach,
  Club,
  AflPlayer,
  AflTeam,
  Contract,
  RosterPlayer,
  Staff,
  StaffContract,
  Season,
  Round,
  Match,
  MatchPlayerScore,
  DraftPick,
  ContractOffer,
  Trade,
  TradeAsset,
  Standing,
  SeasonResult,
} from "@prisma/client";

// Custom types for the application

export type RosterSpotInfo = {
  spot: string;
  position: "DEF" | "MID" | "RUC" | "FWD" | "BENCH" | "IL";
  squad: "SENIORS" | "RESERVES";
  label: string;
};

export const SENIOR_ROSTER_SPOTS: RosterSpotInfo[] = [
  { spot: "DEF1", position: "DEF", squad: "SENIORS", label: "Defender 1" },
  { spot: "DEF2", position: "DEF", squad: "SENIORS", label: "Defender 2" },
  { spot: "DEF3", position: "DEF", squad: "SENIORS", label: "Defender 3" },
  { spot: "MID1", position: "MID", squad: "SENIORS", label: "Midfielder 1" },
  { spot: "MID2", position: "MID", squad: "SENIORS", label: "Midfielder 2" },
  { spot: "MID3", position: "MID", squad: "SENIORS", label: "Midfielder 3" },
  { spot: "MID4", position: "MID", squad: "SENIORS", label: "Midfielder 4" },
  { spot: "RUC", position: "RUC", squad: "SENIORS", label: "Ruck" },
  { spot: "FWD1", position: "FWD", squad: "SENIORS", label: "Forward 1" },
  { spot: "FWD2", position: "FWD", squad: "SENIORS", label: "Forward 2" },
  { spot: "FWD3", position: "FWD", squad: "SENIORS", label: "Forward 3" },
];

export const RESERVE_ROSTER_SPOTS: RosterSpotInfo[] = [
  { spot: "RDEF1", position: "DEF", squad: "RESERVES", label: "Defender 1" },
  { spot: "RDEF2", position: "DEF", squad: "RESERVES", label: "Defender 2" },
  { spot: "RMID1", position: "MID", squad: "RESERVES", label: "Midfielder 1" },
  { spot: "RMID2", position: "MID", squad: "RESERVES", label: "Midfielder 2" },
  { spot: "RMID3", position: "MID", squad: "RESERVES", label: "Midfielder 3" },
  { spot: "RRUC", position: "RUC", squad: "RESERVES", label: "Ruck" },
  { spot: "RFWD1", position: "FWD", squad: "RESERVES", label: "Forward 1" },
  { spot: "RFWD2", position: "FWD", squad: "RESERVES", label: "Forward 2" },
];

export const SHARED_ROSTER_SPOTS: RosterSpotInfo[] = [
  { spot: "BENCH1", position: "BENCH", squad: "SENIORS", label: "Bench 1" },
  { spot: "BENCH2", position: "BENCH", squad: "SENIORS", label: "Bench 2" },
  { spot: "IL1", position: "IL", squad: "SENIORS", label: "Injury List 1" },
  { spot: "IL2", position: "IL", squad: "SENIORS", label: "Injury List 2" },
];

// Salary cap constants
export const SALARY_CAP = 750;
export const RESERVES_BONUS_POOL = {
  1: 75,
  2: 50,
  3: 30,
  4: 20,
  5: 10,
} as const;

// HFA constants
export const HFA_CAP_SENIORS = 15;
export const HFA_CAP_RESERVES = 8;

// Roster size limits
export const MIN_ROSTER_SIZE = 19;
export const MAX_ROSTER_SIZE = 21;
export const MAX_INJURED_PLAYERS = 2;
