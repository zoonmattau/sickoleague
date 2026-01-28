import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { StandingsTable, FinalsProjection } from "./standings-table";

async function getStandings() {
  const standings = await prisma.standing.findMany({
    include: {
      club: true,
    },
  });

  // Sort by points (4*wins + 2*draws) desc, then percentage desc
  const sortByPointsThenPct = (a: typeof standings[0], b: typeof standings[0]) => {
    const pointsA = a.wins * 4 + a.draws * 2;
    const pointsB = b.wins * 4 + b.draws * 2;
    if (pointsB !== pointsA) return pointsB - pointsA;
    return Number(b.percentage) - Number(a.percentage);
  };

  const serialize = (s: typeof standings[0]) => ({
    id: s.id,
    played: s.played,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    pointsFor: Number(s.pointsFor),
    pointsAgainst: Number(s.pointsAgainst),
    percentage: Number(s.percentage),
    club: {
      id: s.club.id,
      name: s.club.name,
      abbreviation: s.club.abbreviation,
      reservesName: s.club.reservesName,
      primaryColor: s.club.primaryColor,
      secondaryColor: s.club.secondaryColor,
    },
  });

  return {
    seniors: standings.filter((s) => s.competition === "SENIORS").sort(sortByPointsThenPct).map(serialize),
    reserves: standings.filter((s) => s.competition === "RESERVES").sort(sortByPointsThenPct).map(serialize),
  };
}

export default async function StandingsPage() {
  const { seniors, reserves } = await getStandings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Standings</h1>
        <p className="text-muted-foreground">
          League ladder and statistics - Click a team for details
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seniors Ladder */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Seniors Ladder</CardTitle>
            <CardDescription>Current season standings</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <StandingsTable standings={seniors} />
            <FinalsProjection standings={seniors} />
          </CardContent>
        </Card>

        {/* Reserves Ladder */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Reserves Ladder</CardTitle>
            <CardDescription>Current season standings</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <StandingsTable standings={reserves} isReserves />
            <FinalsProjection standings={reserves} isReserves />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
