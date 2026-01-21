import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyClubWithRoster } from "./actions";
import { RosterSlot } from "./roster-slot";
import { RosterSpot, Squad } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function RosterPage() {
  const club = await getMyClubWithRoster();

  // If no club, show a message or redirect
  if (!club) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roster Management</h1>
          <p className="text-muted-foreground">
            You don&apos;t have a club assigned yet. Contact the commissioner to get started.
          </p>
        </div>
      </div>
    );
  }

  // Build a map of roster spot -> roster player
  const rosterMap = new Map(
    club.rosterPlayers.map((rp) => [rp.rosterSpot, rp])
  );

  // Count assigned players
  const seniorsCount = club.rosterPlayers.filter(
    (rp) => rp.squad === "SENIORS"
  ).length;
  const reservesCount = club.rosterPlayers.filter(
    (rp) => rp.squad === "RESERVES"
  ).length;
  const benchIlCount = club.rosterPlayers.filter(
    (rp) => ["BENCH1", "BENCH2", "IL1", "IL2"].includes(rp.rosterSpot)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roster Management</h1>
          <p className="text-muted-foreground">
            Manage your senior and reserve squads for {club.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {club.contracts.length} Contracted Players
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Rosters Open
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="seniors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="seniors">Seniors ({seniorsCount}/11)</TabsTrigger>
          <TabsTrigger value="reserves">Reserves ({reservesCount}/8)</TabsTrigger>
          <TabsTrigger value="bench">Bench & IL ({benchIlCount}/4)</TabsTrigger>
        </TabsList>

        <TabsContent value="seniors" className="space-y-4">
          <div className="grid gap-4">
            {/* Defenders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Defenders
                  <Badge>3 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["DEF1", "DEF2", "DEF3"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="DEF"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Midfielders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Midfielders
                  <Badge>4 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["MID1", "MID2", "MID3", "MID4"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="MID"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ruck */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Ruck
                  <Badge>1 spot</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RosterSlot
                  position="RUC"
                  rosterSpot="RUC"
                  squad="SENIORS"
                  clubId={club.id}
                  assignedPlayer={rosterMap.get("RUC")}
                  availablePlayers={club.contracts}
                />
              </CardContent>
            </Card>

            {/* Forwards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Forwards
                  <Badge>3 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["FWD1", "FWD2", "FWD3"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="FWD"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reserves" className="space-y-4">
          <div className="grid gap-4">
            {/* Defenders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Defenders
                  <Badge>2 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["RDEF1", "RDEF2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="DEF"
                      rosterSpot={spot}
                      squad="RESERVES"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Midfielders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Midfielders
                  <Badge>3 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["RMID1", "RMID2", "RMID3"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="MID"
                      rosterSpot={spot}
                      squad="RESERVES"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ruck */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Ruck
                  <Badge>1 spot</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RosterSlot
                  position="RUC"
                  rosterSpot="RRUC"
                  squad="RESERVES"
                  clubId={club.id}
                  assignedPlayer={rosterMap.get("RRUC")}
                  availablePlayers={club.contracts}
                />
              </CardContent>
            </Card>

            {/* Forwards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Forwards
                  <Badge>2 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["RFWD1", "RFWD2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="FWD"
                      rosterSpot={spot}
                      squad="RESERVES"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bench" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Bench
                  <Badge>2 spots</Badge>
                </CardTitle>
                <CardDescription>
                  Bench players can be any position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["BENCH1", "BENCH2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="BENCH"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Injury List
                  <Badge>2 spots</Badge>
                </CardTitle>
                <CardDescription>
                  Players must be unavailable per AFL website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["IL1", "IL2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="IL"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
