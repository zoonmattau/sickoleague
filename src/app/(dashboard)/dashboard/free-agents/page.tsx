import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFreeAgentPlayers, getMyBids, getGamesRemaining } from "../trades/actions";
import { FreeAgentsTab } from "../trades/free-agents-tab";
import { formatDistanceToNow } from "date-fns";

export default async function FreeAgentsPage() {
  const [freeAgentPlayers, myBids, gamesRemaining] = await Promise.all([
    getFreeAgentPlayers(),
    getMyBids(),
    getGamesRemaining(),
  ]);

  const activeBidsCount = myBids.filter((b) => b.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Free Agents</h1>
        <p className="text-muted-foreground">
          Sign uncontracted players to your roster
        </p>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">
            Browse Players
            {freeAgentPlayers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {freeAgentPlayers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-bids">
            My Bids
            {activeBidsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeBidsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Free Agents</CardTitle>
              <CardDescription>
                Players without an active contract available for signing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FreeAgentsTab players={freeAgentPlayers} gamesRemaining={gamesRemaining} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-bids" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Active Bids</CardTitle>
              <CardDescription>
                Contract offers you&apos;ve placed on free agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myBids.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  You have no active bids on free agents
                </p>
              ) : (
                <div className="space-y-3">
                  {myBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{bid.playerName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {bid.playerPosition.join("/")}
                          </span>
                          {bid.aflTeam && (
                            <Badge variant="outline">{bid.aflTeam}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${bid.totalValue} / {bid.years}yr
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              bid.status === "PENDING"
                                ? "default"
                                : bid.status === "ACCEPTED"
                                  ? "default"
                                  : "destructive"
                            }
                            className={
                              bid.status === "ACCEPTED"
                                ? "bg-green-600"
                                : undefined
                            }
                          >
                            {bid.status}
                          </Badge>
                          {bid.status === "PENDING" && (
                            <span className="text-xs text-muted-foreground">
                              Expires{" "}
                              {formatDistanceToNow(new Date(bid.offerExpires), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
