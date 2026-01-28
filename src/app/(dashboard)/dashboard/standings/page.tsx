import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import prisma from "@/lib/prisma";

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

  return {
    seniors: standings.filter((s) => s.competition === "SENIORS").sort(sortByPointsThenPct),
    reserves: standings.filter((s) => s.competition === "RESERVES").sort(sortByPointsThenPct),
  };
}

export default async function StandingsPage() {
  const { seniors, reserves } = await getStandings();

  const maxRows = Math.max(seniors.length, reserves.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Standings</h1>
        <p className="text-muted-foreground">
          League ladder and statistics
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-right">PF</TableHead>
                  <TableHead className="text-right">PA</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seniors.length > 0 ? (
                  <>
                    {seniors.map((s, i) => (
                      <TableRow
                        key={s.id}
                        className={i < 4 ? "bg-green-500/10" : ""}
                      >
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.club.name}</TableCell>
                        <TableCell className="text-center">{s.played}</TableCell>
                        <TableCell className="text-center">{s.wins}</TableCell>
                        <TableCell className="text-center">{s.losses}</TableCell>
                        <TableCell className="text-center">{s.draws}</TableCell>
                        <TableCell className="text-right">{Number(s.pointsFor)}</TableCell>
                        <TableCell className="text-right">{Number(s.pointsAgainst)}</TableCell>
                        <TableCell className="text-right">{Number(s.percentage).toFixed(1)}</TableCell>
                        <TableCell className="text-right font-bold">
                          {s.wins * 4 + s.draws * 2}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Pad rows to match the other ladder */}
                    {Array.from({ length: maxRows - seniors.length }).map((_, i) => (
                      <TableRow key={`pad-s-${i}`}>
                        <TableCell colSpan={10}>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Season not started - standings will appear here
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Reserves Ladder */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Reserves Ladder</CardTitle>
            <CardDescription>
              Current season standings - Top 5 earn salary cap bonuses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-right">PF</TableHead>
                  <TableHead className="text-right">PA</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reserves.length > 0 ? (
                  <>
                    {reserves.map((s, i) => (
                      <TableRow
                        key={s.id}
                        className={i < 4 ? "bg-green-500/10" : ""}
                      >
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.club.reservesName ?? s.club.name}</TableCell>
                        <TableCell className="text-center">{s.played}</TableCell>
                        <TableCell className="text-center">{s.wins}</TableCell>
                        <TableCell className="text-center">{s.losses}</TableCell>
                        <TableCell className="text-center">{s.draws}</TableCell>
                        <TableCell className="text-right">{Number(s.pointsFor)}</TableCell>
                        <TableCell className="text-right">{Number(s.pointsAgainst)}</TableCell>
                        <TableCell className="text-right">{Number(s.percentage).toFixed(1)}</TableCell>
                        <TableCell className="text-right font-bold">
                          {i < 5 ? ["$50k", "$40k", "$30k", "$20k", "$10k"][i] : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Pad rows to match the other ladder */}
                    {Array.from({ length: maxRows - reserves.length }).map((_, i) => (
                      <TableRow key={`pad-r-${i}`}>
                        <TableCell colSpan={10}>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Season not started - standings will appear here
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
