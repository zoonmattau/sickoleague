import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAllClubsWithCoaches, getAllCoaches, getAllContracts, getAllAflPlayers, getSeasonSettings } from "./actions";
import { isAdmin } from "@/lib/admin";

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

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  const [rounds, clubs, standings, clubsWithCoaches, coaches, contracts, aflPlayers, seasonSettings] = await Promise.all([
    getRounds(),
    getClubs(),
    getStandings(),
    getAllClubsWithCoaches(),
    getAllCoaches(),
    getAllContracts(),
    getAllAflPlayers(),
    getSeasonSettings(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <a href="/dashboard" className="font-bold text-xl">
              Sicko League
            </a>
            <nav className="flex items-center gap-4">
              <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </a>
              <span className="text-sm font-medium">Admin Panel</span>
            </nav>
          </div>
        </div>
      </header>
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
          seasonSettings={seasonSettings}
        />
      </div>
    </div>
  );
}
