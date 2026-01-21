import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MatchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Matches</h1>
        <p className="text-muted-foreground">
          View fixtures, results, and scores
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="fixture">Full Fixture</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Next Round</CardTitle>
              <CardDescription>No upcoming matches scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Matches will appear here once the season begins.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>No completed matches yet</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Match results will appear here after rounds are completed.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Season Fixture</CardTitle>
              <CardDescription>Full season schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The fixture will be generated before the season starts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
