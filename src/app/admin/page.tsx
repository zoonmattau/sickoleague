import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAllClubsWithCoaches, getAllCoaches, getAllContracts, getAllAflPlayers } from "./actions";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getRounds() {
  const rounds = await prisma.round.findMany({
    where: {
      season: {
        status: { in: ["ACTIVE", "UPCOMING"] }
      }
    },
    include: {
      matches: {
        include: {
          homeClub: true,
          awayClub: true,
        }
      }
    },
    orderBy: { roundNumber: "asc" }
  });
  // Serialize Decimal fields to numbers
  return rounds.map(round => ({
    ...round,
    matches: round.matches.map(match => ({
      ...match,
      homeScore: match.homeScore ? Number(match.homeScore) : null,
      awayScore: match.awayScore ? Number(match.awayScore) : null,
    })),
  }));
}

async function getClubs() {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" }
  });
  return clubs;
}

async function getStandings() {
  const standings = await prisma.standing.findMany({
    include: { club: true },
    orderBy: [
      { competition: "asc" },
      { wins: "desc" },
      { percentage: "desc" }
    ]
  });
  // Serialize Decimal fields to numbers
  return standings.map(s => ({
    ...s,
    pointsFor: Number(s.pointsFor),
    pointsAgainst: Number(s.pointsAgainst),
    percentage: Number(s.percentage),
  }));
}

export default async function AdminPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const [rounds, clubs, standings, clubsWithCoaches, coaches, contracts, aflPlayers] = await Promise.all([
    getRounds(),
    getClubs(),
    getStandings(),
    getAllClubsWithCoaches(),
    getAllCoaches(),
    getAllContracts(),
    getAllAflPlayers(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage clubs, coaches, contracts, and match results</p>
        </div>

        <AdminDashboard
          rounds={rounds}
          clubs={clubs}
          standings={standings}
          clubsWithCoaches={clubsWithCoaches}
          coaches={coaches}
          contracts={contracts}
          aflPlayers={aflPlayers}
        />
      </div>
    </div>
  );
}
