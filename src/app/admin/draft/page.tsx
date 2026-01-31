import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { AdminDraftClient } from "./admin-draft-client";
import { getCurrentSeason, getDraftState, getDraftEligiblePlayers } from "@/app/(dashboard)/dashboard/draft/actions";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getAllClubs() {
  return prisma.club.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      primaryColor: true,
      secondaryColor: true,
    },
  });
}

async function getAllSeasons() {
  return prisma.season.findMany({
    orderBy: { year: "desc" },
    select: {
      id: true,
      year: true,
      status: true,
      draftStatus: true,
      draftOrderType: true,
      pickTimerSeconds: true,
      currentPickNumber: true,
    },
  });
}

export default async function AdminDraftPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  const [seasons, clubs, currentSeason] = await Promise.all([
    getAllSeasons(),
    getAllClubs(),
    getCurrentSeason(),
  ]);

  let draftState = null;
  let eligiblePlayers: Awaited<ReturnType<typeof getDraftEligiblePlayers>> = [];

  if (currentSeason) {
    [draftState, eligiblePlayers] = await Promise.all([
      getDraftState(currentSeason.id),
      getDraftEligiblePlayers(currentSeason.id),
    ]);
  }

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
              <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                Admin
              </a>
              <span className="text-sm font-medium">Draft Control</span>
            </nav>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Draft Commissioner Controls</h1>
          <p className="text-muted-foreground">
            Manage draft settings, generate picks, and control the live draft
          </p>
        </div>

        <AdminDraftClient
          seasons={seasons}
          clubs={clubs}
          currentSeasonId={currentSeason?.id ?? null}
          initialDraftState={draftState}
          eligiblePlayers={eligiblePlayers}
        />
      </div>
    </div>
  );
}
