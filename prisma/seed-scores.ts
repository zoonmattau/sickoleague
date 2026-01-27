import { PrismaClient, MatchType, MatchStatus, RoundType, RoundStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Seeds dummy match scores for all rostered players so avg PPG shows on dashboard.
 * Creates a few completed rounds with matches and random fantasy scores.
 */
async function main() {
  // Find the active season
  const season = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { year: "desc" },
  });

  if (!season) {
    console.log("No active/upcoming season found. Skipping score seeding.");
    return;
  }

  // Get all clubs with roster players
  const clubs = await prisma.club.findMany({
    include: {
      rosterPlayers: {
        where: { roundId: null },
        include: {
          contract: {
            include: { aflPlayer: true },
          },
        },
      },
    },
  });

  const clubsWithPlayers = clubs.filter((c) => c.rosterPlayers.length > 0);
  if (clubsWithPlayers.length < 2) {
    console.log("Need at least 2 clubs with rostered players. Skipping.");
    return;
  }

  // Create 3 completed rounds if they don't exist
  const roundNumbers = [1, 2, 3];
  const rounds = [];

  for (const rn of roundNumbers) {
    let round = await prisma.round.findUnique({
      where: { seasonId_roundNumber: { seasonId: season.id, roundNumber: rn } },
    });

    if (!round) {
      round = await prisma.round.create({
        data: {
          seasonId: season.id,
          roundNumber: rn,
          roundType: RoundType.REGULAR,
          status: RoundStatus.COMPLETED,
        },
      });
      console.log(`Created round ${rn}`);
    } else if (round.status !== "COMPLETED") {
      round = await prisma.round.update({
        where: { id: round.id },
        data: { status: RoundStatus.COMPLETED },
      });
    }

    rounds.push(round);
  }

  // For each round, create matches between clubs and score players
  for (const round of rounds) {
    // Pair clubs up for seniors and reserves matches
    for (let i = 0; i < clubsWithPlayers.length - 1; i += 2) {
      const home = clubsWithPlayers[i];
      const away = clubsWithPlayers[i + 1];
      if (!away) break;

      for (const matchType of [MatchType.SENIORS, MatchType.RESERVES] as const) {
        // Check if match exists
        const existing = await prisma.match.findUnique({
          where: {
            roundId_homeClubId_awayClubId_matchType: {
              roundId: round.id,
              homeClubId: home.id,
              awayClubId: away.id,
              matchType,
            },
          },
        });

        let match = existing;
        if (!match) {
          match = await prisma.match.create({
            data: {
              roundId: round.id,
              homeClubId: home.id,
              awayClubId: away.id,
              matchType,
              status: MatchStatus.COMPLETED,
              homeScore: randomScore(),
              awayScore: randomScore(),
            },
          });
        }

        // Create round-specific roster snapshots and scores for both clubs
        for (const club of [home, away]) {
          const squadFilter = matchType === "SENIORS" ? "SENIORS" : "RESERVES";
          const squadPlayers = club.rosterPlayers.filter(
            (rp) =>
              rp.squad === squadFilter ||
              rp.rosterSpot.startsWith("BENCH") // bench can count for seniors
          );

          for (const rp of squadPlayers) {
            // Create a round-specific roster player if not exists
            const roundRp = await prisma.rosterPlayer.upsert({
              where: {
                clubId_contractId_roundId: {
                  clubId: club.id,
                  contractId: rp.contractId,
                  roundId: round.id,
                },
              },
              update: {},
              create: {
                clubId: club.id,
                contractId: rp.contractId,
                squad: rp.squad,
                rosterSpot: rp.rosterSpot,
                roundId: round.id,
              },
            });

            // Create score if not exists
            const existingScore = await prisma.matchPlayerScore.findUnique({
              where: {
                matchId_rosterPlayerId: {
                  matchId: match.id,
                  rosterPlayerId: roundRp.id,
                },
              },
            });

            if (!existingScore) {
              const fantasyScore = randomFantasyScore();
              await prisma.matchPlayerScore.create({
                data: {
                  matchId: match.id,
                  rosterPlayerId: roundRp.id,
                  aflPlayerId: rp.contract.aflPlayerId,
                  aflFantasyScore: fantasyScore,
                  finalScore: fantasyScore,
                  played: true,
                  positionPlayed: rp.contract.aflPlayer.positions[0],
                },
              });
            }
          }
        }
      }
    }

    console.log(`Scored round ${round.roundNumber}`);
  }

  console.log("Done seeding scores.");
}

function randomScore(): number {
  return Math.round((Math.random() * 600 + 800) * 100) / 100;
}

function randomFantasyScore(): number {
  // Realistic AFL Fantasy range: 40-130
  return Math.round(Math.random() * 90 + 40);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
