import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getPendingTrades, getTradeHistory, getClubsForTrade, getTradeablePlayers } from "./actions";
import { formatDistanceToNow } from "date-fns";
import { TradesHeader } from "./trades-header";

export default async function TradesPage() {
  const [pendingTrades, tradeHistory, { myClub, clubs }] = await Promise.all([
    getPendingTrades(),
    getTradeHistory(),
    getClubsForTrade(),
  ]);

  // Get my players if logged in
  const myPlayers = myClub ? await getTradeablePlayers(myClub.id) : [];

  const incomingTradesCount = pendingTrades.filter((t) => t.isIncoming).length;

  return (
    <div className="space-y-6">
      <TradesHeader clubs={clubs} myClub={myClub} myPlayers={myPlayers} />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {incomingTradesCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {incomingTradesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

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
