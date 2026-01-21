import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DraftPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Draft</h1>
        <p className="text-muted-foreground">
          Annual draft and Rule 9 draft management
        </p>
      </div>

      <Tabs defaultValue="picks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="picks">My Picks</TabsTrigger>
          <TabsTrigger value="order">Draft Order</TabsTrigger>
          <TabsTrigger value="history">Draft History</TabsTrigger>
          <TabsTrigger value="rule9">Rule 9</TabsTrigger>
        </TabsList>

        <TabsContent value="picks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Draft Picks</CardTitle>
              <CardDescription>
                Picks you own for upcoming drafts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Original Owner</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Draft picks will be assigned before the season
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Order</CardTitle>
              <CardDescription>
                Based on reverse finishing order from previous season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Draft order will be set after the previous season concludes
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft History</CardTitle>
              <CardDescription>
                Past draft selections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No draft history yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rule9" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule 9 Draft</CardTitle>
              <CardDescription>
                Mid-season draft for players stashed in reserves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Eligibility Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Majority of games played for reserves</li>
                  <li>Has a senior squad contract</li>
                  <li>Not a rookie in current or prior year</li>
                  <li>Not on the injured list</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                The Rule 9 Draft takes place between Round 13 and Round 14
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
