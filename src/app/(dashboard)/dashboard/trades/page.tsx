import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { FreeAgentsTab } from "./free-agents-tab";
import { StaffTab } from "./staff-tab";
import {
  getFreeAgentPlayers,
  getFreeAgentStaff,
  getMyBids,
  getPendingTrades,
  getTradeHistory,
} from "./actions";
import { formatDistanceToNow } from "date-fns";

async function getMyClubId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
    include: { club: true },
  });

  return coach?.club?.id ?? null;
}

export default async function TradesPage() {
  const [
    freeAgentPlayers,
    freeAgentStaff,
    myBids,
    pendingTrades,
    tradeHistory,
    myClubId,
  ] = await Promise.all([
    getFreeAgentPlayers(),
    getFreeAgentStaff(),
    getMyBids(),
    getPendingTrades(),
    getTradeHistory(),
    getMyClubId(),
  ]);

  const activeBidsCount = myBids.filter((b) => b.status === "PENDING").length;
  const incomingTradesCount = pendingTrades.filter((t) => t.isIncoming).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            Manage trades, free agents, and staff contracts
          </p>
        </div>
        <Button>Propose Trade</Button>
      </div>

      <Tabs defaultValue="free-agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="free-agents">
            Free Agents
            {freeAgentPlayers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {freeAgentPlayers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="staff">
            Staff
          </TabsTrigger>
          <TabsTrigger value="my-bids">
            My Bids
            {activeBidsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeBidsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Trades
            {incomingTradesCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {incomingTradesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="free-agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Free Agent Players</CardTitle>
              <CardDescription>
                Players without an active contract available for signing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FreeAgentsTab players={freeAgentPlayers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coaches & List Managers</CardTitle>
              <CardDescription>
                Sign staff to gain scoring bonuses and contract discounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaffTab staff={freeAgentStaff} myClubId={myClubId} />
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

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Trades</CardTitle>
              <CardDescription>
                Trades awaiting response or completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTrades.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No pending trades
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {trade.isIncoming ? (
                            <Badge variant="destructive">Incoming</Badge>
                          ) : (
                            <Badge>Outgoing</Badge>
                          )}
                          <span className="font-medium">
                            {trade.proposedBy.name} → {trade.proposedTo.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(trade.proposedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">
                            You receive:
                          </p>
                          <ul className="space-y-1">
                            {trade.assets
                              .filter((a) => a.direction === "incoming")
                              .map((a, i) => (
                                <li key={i}>
                                  {a.playerName ??
                                    a.staffName ??
                                    a.draftPick ??
                                    (a.salary && `$${a.salary}`)}
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">You send:</p>
                          <ul className="space-y-1">
                            {trade.assets
                              .filter((a) => a.direction === "outgoing")
                              .map((a, i) => (
                                <li key={i}>
                                  {a.playerName ??
                                    a.staffName ??
                                    a.draftPick ??
                                    (a.salary && `$${a.salary}`)}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                      {trade.isIncoming && (
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Accept
                          </Button>
                          <Button size="sm" variant="destructive">
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Completed and rejected trades</CardDescription>
            </CardHeader>
            <CardContent>
              {tradeHistory.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No trade history
                </p>
              ) : (
                <div className="space-y-3">
                  {tradeHistory.map((trade) => (
                    <div
                      key={trade.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              trade.status === "COMPLETED"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              trade.status === "COMPLETED"
                                ? "bg-green-600"
                                : undefined
                            }
                          >
                            {trade.status}
                          </Badge>
                          <span className="font-medium">
                            {trade.proposedBy.name} ↔ {trade.proposedTo.name}
                          </span>
                        </div>
                        {trade.completedAt && (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(trade.completedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
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
