import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TradesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trades</h1>
          <p className="text-muted-foreground">
            Propose and manage trades with other clubs
          </p>
        </div>
        <Button>Propose Trade</Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="free-agents">Free Agents</TabsTrigger>
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
              <p className="text-muted-foreground">
                No pending trades
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>
                Completed and rejected trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No trade history
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free-agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Free Agent Offers</CardTitle>
              <CardDescription>
                Active bids on free agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No active free agent offers
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
