import { getAllClubsWithContracts, getCurrentSeason, getMyClubId } from "./actions";
import { getAllClubTensions } from "./rivalry-actions";
import { ClubsView } from "./clubs-view";

export default async function ClubsPage() {
  const [clubs, season, myClubId, tensions] = await Promise.all([
    getAllClubsWithContracts(),
    getCurrentSeason(),
    getMyClubId(),
    getAllClubTensions(),
  ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">All Clubs</h1>
        <p className="text-muted-foreground">
          View contracts, salary cap usage, and rivalries across the league
        </p>
      </div>
      <ClubsView clubs={clubs} season={season} myClubId={myClubId} tensions={tensions} />
    </div>
  );
}
