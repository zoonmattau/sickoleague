-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RivalReason" AS ENUM ('FINALS_OPPONENT', 'NOMINATED');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('DEF', 'MID', 'RUC', 'FWD');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'RETIRED', 'DELISTED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('DRAFT', 'FREE_AGENT', 'EXTENSION', 'RULE9', 'MINIMUM');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED', 'TRADED');

-- CreateEnum
CREATE TYPE "Squad" AS ENUM ('SENIORS', 'RESERVES');

-- CreateEnum
CREATE TYPE "RosterSpot" AS ENUM ('DEF1', 'DEF2', 'DEF3', 'MID1', 'MID2', 'MID3', 'MID4', 'RUC', 'FWD1', 'FWD2', 'FWD3', 'RDEF1', 'RDEF2', 'RMID1', 'RMID2', 'RMID3', 'RRUC', 'RFWD1', 'RFWD2', 'BENCH1', 'BENCH2', 'IL1', 'IL2');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ASSISTANT_COACH', 'LIST_MANAGER');

-- CreateEnum
CREATE TYPE "ClubStaffRole" AS ENUM ('SENIOR_ASSISTANT', 'RESERVES_ASSISTANT', 'LIST_MANAGER');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('REGULAR', 'BYE', 'FINALS_WK1', 'FINALS_WK2', 'FINALS_WK3');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('UPCOMING', 'LOCKED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('SENIORS', 'RESERVES');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DraftType" AS ENUM ('ANNUAL', 'RULE9');

-- CreateEnum
CREATE TYPE "ContractOfferType" AS ENUM ('EXTENSION', 'FREE_AGENT', 'END_OF_SEASON', 'RESERVE_SQUAD');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'OUTBID', 'EXPIRED', 'MATCHED');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TradeAssetType" AS ENUM ('PLAYER', 'STAFF', 'DRAFT_PICK', 'SALARY');

-- CreateTable
CREATE TABLE "coaches" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "discord_id" TEXT,
    "avatar_url" TEXT,
    "is_commissioner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" VARCHAR(4) NOT NULL,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "coach_id" TEXT,
    "senior_captain_id" TEXT,
    "senior_vc_id" TEXT,
    "reserves_captain_id" TEXT,
    "reserves_vc_id" TEXT,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rivals" (
    "id" TEXT NOT NULL,
    "reason" "RivalReason" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "club_a_id" TEXT NOT NULL,
    "club_b_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,

    CONSTRAINT "rivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afl_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" VARCHAR(4) NOT NULL,
    "current_ladder_pos" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "afl_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afl_players" (
    "id" TEXT NOT NULL,
    "afl_fantasy_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "positions" "Position"[],
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "afl_team_id" TEXT,

    CONSTRAINT "afl_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "start_season" INTEGER NOT NULL,
    "end_season" INTEGER NOT NULL,
    "total_value" DECIMAL(10,2) NOT NULL,
    "year_breakdown" JSONB NOT NULL,
    "is_minimum" BOOLEAN NOT NULL DEFAULT false,
    "contract_type" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "released_debt" DECIMAL(10,2),
    "released_debt_years" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "club_id" TEXT NOT NULL,
    "afl_player_id" TEXT NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_players" (
    "id" TEXT NOT NULL,
    "squad" "Squad" NOT NULL,
    "roster_spot" "RosterSpot" NOT NULL,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "club_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "round_id" TEXT,

    CONSTRAINT "roster_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_history" (
    "id" TEXT NOT NULL,
    "previous_squad" "Squad",
    "previous_spot" "RosterSpot",
    "new_squad" "Squad" NOT NULL,
    "new_spot" "RosterSpot" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roster_player_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,

    CONSTRAINT "roster_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "afl_team_id" TEXT,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_contracts" (
    "id" TEXT NOT NULL,
    "staff_role" "ClubStaffRole" NOT NULL,
    "start_season" INTEGER NOT NULL,
    "end_season" INTEGER NOT NULL,
    "total_value" DECIMAL(10,2) NOT NULL,
    "year_breakdown" JSONB NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "club_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,

    CONSTRAINT "staff_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "salary_cap" DECIMAL(10,2) NOT NULL DEFAULT 750,
    "status" "SeasonStatus" NOT NULL DEFAULT 'UPCOMING',
    "draft_date" TIMESTAMP(3),
    "bye_rounds" INTEGER[],
    "finals_start_round" INTEGER,
    "reserves_bonus_pool" JSONB NOT NULL DEFAULT '{"1": 75, "2": 50, "3": 30, "4": 20, "5": 10}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "round_type" "RoundType" NOT NULL,
    "lockout_time" TIMESTAMP(3),
    "unlock_time" TIMESTAMP(3),
    "status" "RoundStatus" NOT NULL DEFAULT 'UPCOMING',
    "is_rule9_draft" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "season_id" TEXT NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "match_type" "MatchType" NOT NULL,
    "home_hfa" DECIMAL(5,2),
    "is_rival_match" BOOLEAN NOT NULL DEFAULT false,
    "venue_sale_price" DECIMAL(10,2),
    "home_score" DECIMAL(10,2),
    "away_score" DECIMAL(10,2),
    "home_staff_bonus" DECIMAL(5,2),
    "away_staff_bonus" DECIMAL(5,2),
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "round_id" TEXT NOT NULL,
    "home_club_id" TEXT NOT NULL,
    "away_club_id" TEXT NOT NULL,
    "venue_sold_to" TEXT,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_player_scores" (
    "id" TEXT NOT NULL,
    "afl_fantasy_score" INTEGER,
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "is_vice_captain" BOOLEAN NOT NULL DEFAULT false,
    "final_score" DECIMAL(10,2),
    "played" BOOLEAN NOT NULL DEFAULT false,
    "position_played" "Position",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "match_id" TEXT NOT NULL,
    "roster_player_id" TEXT NOT NULL,
    "afl_player_id" TEXT NOT NULL,

    CONSTRAINT "match_player_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_game_results" (
    "id" TEXT NOT NULL,
    "match_type" "MatchType" NOT NULL,
    "margin" INTEGER NOT NULL,
    "game_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "club_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,

    CONSTRAINT "home_game_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_picks" (
    "id" TEXT NOT NULL,
    "draft_type" "DraftType" NOT NULL,
    "round" INTEGER NOT NULL,
    "pick_number" INTEGER NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "season_id" TEXT NOT NULL,
    "original_club_id" TEXT NOT NULL,
    "current_club_id" TEXT NOT NULL,
    "player_selected_id" TEXT,

    CONSTRAINT "draft_picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_eligibility" (
    "id" TEXT NOT NULL,
    "is_eligible" BOOLEAN NOT NULL,
    "reason_ineligible" TEXT,
    "senior_games" INTEGER NOT NULL DEFAULT 0,
    "reserve_games" INTEGER NOT NULL DEFAULT 0,
    "is_rookie" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "afl_player_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,

    CONSTRAINT "draft_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_offers" (
    "id" TEXT NOT NULL,
    "offer_type" "ContractOfferType" NOT NULL,
    "total_value" DECIMAL(10,2) NOT NULL,
    "years" INTEGER NOT NULL,
    "year_breakdown" JSONB NOT NULL,
    "offer_expires" TIMESTAMP(3) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "is_rfa_eligible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "afl_player_id" TEXT NOT NULL,
    "offering_club_id" TEXT NOT NULL,
    "previous_club_id" TEXT,

    CONSTRAINT "contract_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfa_players" (
    "id" TEXT NOT NULL,
    "previous_salary" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "afl_player_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "previous_club_id" TEXT NOT NULL,

    CONSTRAINT "rfa_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PROPOSED',
    "commissioner_note" TEXT,
    "proposed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "proposed_by" TEXT NOT NULL,
    "proposed_to" TEXT NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_assets" (
    "id" TEXT NOT NULL,
    "asset_type" "TradeAssetType" NOT NULL,
    "salary_amount" DECIMAL(10,2),
    "salary_retention" DECIMAL(10,2),
    "salary_years" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trade_id" TEXT NOT NULL,
    "from_club_id" TEXT NOT NULL,
    "to_club_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "staff_contract_id" TEXT,
    "draft_pick_id" TEXT,

    CONSTRAINT "trade_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings" (
    "id" TEXT NOT NULL,
    "competition" "MatchType" NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "points_for" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "points_against" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "percentage" DECIMAL(7,2) NOT NULL DEFAULT 100,
    "ladder_position" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "season_id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_results" (
    "id" TEXT NOT NULL,
    "competition" "MatchType" NOT NULL,
    "final_position" INTEGER NOT NULL,
    "made_finals" BOOLEAN NOT NULL DEFAULT false,
    "is_premier" BOOLEAN NOT NULL DEFAULT false,
    "salary_bonus" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "season_id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,

    CONSTRAINT "season_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaches_email_key" ON "coaches"("email");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_discord_id_key" ON "coaches"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_abbreviation_key" ON "clubs"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_coach_id_key" ON "clubs"("coach_id");

-- CreateIndex
CREATE UNIQUE INDEX "rivals_club_a_id_club_b_id_season_id_key" ON "rivals"("club_a_id", "club_b_id", "season_id");

-- CreateIndex
CREATE UNIQUE INDEX "afl_teams_name_key" ON "afl_teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "afl_teams_abbreviation_key" ON "afl_teams"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "afl_players_afl_fantasy_id_key" ON "afl_players"("afl_fantasy_id");

-- CreateIndex
CREATE INDEX "afl_players_last_name_first_name_idx" ON "afl_players"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "roster_players_club_id_contract_id_round_id_key" ON "roster_players"("club_id", "contract_id", "round_id");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_year_key" ON "seasons"("year");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_season_id_round_number_key" ON "rounds"("season_id", "round_number");

-- CreateIndex
CREATE UNIQUE INDEX "matches_round_id_home_club_id_away_club_id_match_type_key" ON "matches"("round_id", "home_club_id", "away_club_id", "match_type");

-- CreateIndex
CREATE UNIQUE INDEX "match_player_scores_match_id_roster_player_id_key" ON "match_player_scores"("match_id", "roster_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "home_game_results_club_id_match_id_match_type_key" ON "home_game_results"("club_id", "match_id", "match_type");

-- CreateIndex
CREATE UNIQUE INDEX "draft_picks_season_id_draft_type_pick_number_key" ON "draft_picks"("season_id", "draft_type", "pick_number");

-- CreateIndex
CREATE UNIQUE INDEX "draft_eligibility_afl_player_id_round_id_key" ON "draft_eligibility"("afl_player_id", "round_id");

-- CreateIndex
CREATE UNIQUE INDEX "rfa_players_afl_player_id_season_id_key" ON "rfa_players"("afl_player_id", "season_id");

-- CreateIndex
CREATE UNIQUE INDEX "standings_season_id_club_id_competition_key" ON "standings"("season_id", "club_id", "competition");

-- CreateIndex
CREATE UNIQUE INDEX "season_results_season_id_club_id_competition_key" ON "season_results"("season_id", "club_id", "competition");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rivals" ADD CONSTRAINT "rivals_club_a_id_fkey" FOREIGN KEY ("club_a_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rivals" ADD CONSTRAINT "rivals_club_b_id_fkey" FOREIGN KEY ("club_b_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rivals" ADD CONSTRAINT "rivals_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afl_players" ADD CONSTRAINT "afl_players_afl_team_id_fkey" FOREIGN KEY ("afl_team_id") REFERENCES "afl_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_afl_player_id_fkey" FOREIGN KEY ("afl_player_id") REFERENCES "afl_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_players" ADD CONSTRAINT "roster_players_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_players" ADD CONSTRAINT "roster_players_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_players" ADD CONSTRAINT "roster_players_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_history" ADD CONSTRAINT "roster_history_roster_player_id_fkey" FOREIGN KEY ("roster_player_id") REFERENCES "roster_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_history" ADD CONSTRAINT "roster_history_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_afl_team_id_fkey" FOREIGN KEY ("afl_team_id") REFERENCES "afl_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_contracts" ADD CONSTRAINT "staff_contracts_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_contracts" ADD CONSTRAINT "staff_contracts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_club_id_fkey" FOREIGN KEY ("home_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_club_id_fkey" FOREIGN KEY ("away_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_sold_to_fkey" FOREIGN KEY ("venue_sold_to") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_scores" ADD CONSTRAINT "match_player_scores_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_scores" ADD CONSTRAINT "match_player_scores_roster_player_id_fkey" FOREIGN KEY ("roster_player_id") REFERENCES "roster_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_scores" ADD CONSTRAINT "match_player_scores_afl_player_id_fkey" FOREIGN KEY ("afl_player_id") REFERENCES "afl_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_game_results" ADD CONSTRAINT "home_game_results_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_game_results" ADD CONSTRAINT "home_game_results_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_original_club_id_fkey" FOREIGN KEY ("original_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_current_club_id_fkey" FOREIGN KEY ("current_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_player_selected_id_fkey" FOREIGN KEY ("player_selected_id") REFERENCES "afl_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_eligibility" ADD CONSTRAINT "draft_eligibility_afl_player_id_fkey" FOREIGN KEY ("afl_player_id") REFERENCES "afl_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_eligibility" ADD CONSTRAINT "draft_eligibility_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_offers" ADD CONSTRAINT "contract_offers_afl_player_id_fkey" FOREIGN KEY ("afl_player_id") REFERENCES "afl_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_offers" ADD CONSTRAINT "contract_offers_offering_club_id_fkey" FOREIGN KEY ("offering_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_offers" ADD CONSTRAINT "contract_offers_previous_club_id_fkey" FOREIGN KEY ("previous_club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfa_players" ADD CONSTRAINT "rfa_players_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfa_players" ADD CONSTRAINT "rfa_players_previous_club_id_fkey" FOREIGN KEY ("previous_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_proposed_to_fkey" FOREIGN KEY ("proposed_to") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_assets" ADD CONSTRAINT "trade_assets_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_assets" ADD CONSTRAINT "trade_assets_from_club_id_fkey" FOREIGN KEY ("from_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_assets" ADD CONSTRAINT "trade_assets_to_club_id_fkey" FOREIGN KEY ("to_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_assets" ADD CONSTRAINT "trade_assets_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_assets" ADD CONSTRAINT "trade_assets_staff_contract_id_fkey" FOREIGN KEY ("staff_contract_id") REFERENCES "staff_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_assets" ADD CONSTRAINT "trade_assets_draft_pick_id_fkey" FOREIGN KEY ("draft_pick_id") REFERENCES "draft_picks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_results" ADD CONSTRAINT "season_results_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_results" ADD CONSTRAINT "season_results_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

