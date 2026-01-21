import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RosterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roster Management</h1>
          <p className="text-muted-foreground">
            Manage your senior and reserve squads
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Rosters Open
        </Badge>
      </div>

      <Tabs defaultValue="seniors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="seniors">Seniors (11)</TabsTrigger>
          <TabsTrigger value="reserves">Reserves (8)</TabsTrigger>
          <TabsTrigger value="bench">Bench & IL (4)</TabsTrigger>
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
                  {[1, 2, 3].map((i) => (
                    <RosterSlot key={i} position="DEF" index={i} />
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
                  {[1, 2, 3, 4].map((i) => (
                    <RosterSlot key={i} position="MID" index={i} />
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
                <RosterSlot position="RUC" index={1} />
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
                  {[1, 2, 3].map((i) => (
                    <RosterSlot key={i} position="FWD" index={i} />
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
                  {[1, 2].map((i) => (
                    <RosterSlot key={i} position="DEF" index={i} squad="reserves" />
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
                  {[1, 2, 3].map((i) => (
                    <RosterSlot key={i} position="MID" index={i} squad="reserves" />
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
                <RosterSlot position="RUC" index={1} squad="reserves" />
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
                  {[1, 2].map((i) => (
                    <RosterSlot key={i} position="FWD" index={i} squad="reserves" />
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
                  {[1, 2].map((i) => (
                    <RosterSlot key={i} position="BENCH" index={i} />
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
                  {[1, 2].map((i) => (
                    <RosterSlot key={i} position="IL" index={i} />
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

function RosterSlot({
  position,
  index,
  squad = "seniors",
}: {
  position: string;
  index: number;
  squad?: "seniors" | "reserves";
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <Badge variant="outline">{position}</Badge>
        <span className="text-muted-foreground">Empty slot</span>
      </div>
      <span className="text-sm text-muted-foreground">
        Click to assign player
      </span>
    </div>
  );
}
