import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentRoundMatches, getRecentResults, getFullFixture } from "../fixture/actions";
import { CurrentRoundView } from "./current-round-view";
import { ResultsView } from "./results-view";
import { FixtureView } from "../fixture/fixture-view";

export default async function MatchesPage() {
  const [currentRound, recentResults, { rounds, clubs }] = await Promise.all([
    getCurrentRoundMatches(),
    getRecentResults(5),
    getFullFixture(),
  ]);

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
          <TabsTrigger value="upcoming">Current Round</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="fixture">Full Fixture</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <CurrentRoundView data={currentRound} />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <ResultsView rounds={recentResults} />
        </TabsContent>

        <TabsContent value="fixture" className="space-y-4">
          <FixtureView rounds={rounds} clubs={clubs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
