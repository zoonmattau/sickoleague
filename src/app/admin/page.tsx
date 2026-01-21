import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin-dashboard";

// List of admin Discord IDs (add your Discord user ID here)
const ADMIN_IDS = [
  // Add admin Discord IDs here
];

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
  return rounds;
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
  return standings;
}

export default async function AdminPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // For now, allow any authenticated user to access admin
  // Uncomment below to restrict to specific Discord IDs
  // const discordId = user.user_metadata?.provider_id;
  // if (!ADMIN_IDS.includes(discordId)) {
  //   redirect("/");
  // }

  const [rounds, clubs, standings] = await Promise.all([
    getRounds(),
    getClubs(),
    getStandings()
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage matches and standings</p>
        </div>

        <AdminDashboard
          rounds={rounds}
          clubs={clubs}
          standings={standings}
        />
      </div>
    </div>
  );
}
