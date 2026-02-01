import { getFullFixture } from "./actions";
import { FixtureView } from "./fixture-view";

export default async function FixturePage() {
  const { rounds, clubs } = await getFullFixture();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fixture</h1>
        <p className="text-muted-foreground">
          Full season schedule and results
        </p>
      </div>

      <FixtureView rounds={rounds} clubs={clubs} />
    </div>
  );
}
