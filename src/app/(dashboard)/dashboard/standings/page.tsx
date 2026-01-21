import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StandingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Standings</h1>
        <p className="text-muted-foreground">
          League ladder and statistics
        </p>
      </div>

      <Tabs defaultValue="seniors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="seniors">Seniors</TabsTrigger>
          <TabsTrigger value="reserves">Reserves</TabsTrigger>
        </TabsList>

        <TabsContent value="seniors">
          <Card>
            <CardHeader>
              <CardTitle>Seniors Ladder</CardTitle>
              <CardDescription>Current season standings</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Season not started - standings will appear here
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reserves">
          <Card>
            <CardHeader>
              <CardTitle>Reserves Ladder</CardTitle>
              <CardDescription>
                Current season standings - Top 5 earn salary cap bonuses
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Season not started - standings will appear here
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
