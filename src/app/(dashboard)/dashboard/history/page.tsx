import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, TrendingUp, Calendar, Building2, MapPin, Users } from "lucide-react";
import { getLeagueHistory, getBackstories } from "./actions";

export default async function HistoryPage() {
  const [history, backstories] = await Promise.all([
    getLeagueHistory(),
    getBackstories(),
  ]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">League History</h1>
        <p className="text-muted-foreground">
          Past champions, records, and memorable moments
        </p>
      </div>

      {/* Season Champions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Season Champions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.champions.length > 0 ? (
            <div className="space-y-3">
              {history.champions.map((champion) => (
                <div
                  key={champion.year}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {champion.year}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-sm font-bold"
                          style={{
                            backgroundColor: champion.club.primaryColor || "#6b7280",
                            color: champion.club.secondaryColor || "#ffffff",
                          }}
                        >
                          {champion.club.abbreviation}
                        </span>
                        <span className="font-semibold">{champion.club.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {champion.matchType === "SENIORS" ? "Seniors" : "Reserves"}
                        </Badge>
                      </div>
                      {champion.coach && (
                        <div className="text-sm text-muted-foreground">
                          Coach: {champion.coach}
                        </div>
                      )}
                    </div>
                  </div>
                  {champion.grandFinalScore && (
                    <div className="text-right">
                      <div className="font-semibold">{champion.grandFinalScore}</div>
                      <div className="text-xs text-muted-foreground">Grand Final</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No champions recorded yet. History is waiting to be made!
            </p>
          )}
        </CardContent>
      </Card>

      {/* All-Time Records */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Scoring Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.records.highestScore && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Highest Team Score</div>
                <div className="font-semibold">
                  {history.records.highestScore.score.toFixed(1)} pts
                </div>
                <div className="text-xs text-muted-foreground">
                  {history.records.highestScore.club} vs {history.records.highestScore.opponent}
                  {" "}(Round {history.records.highestScore.round}, {history.records.highestScore.year})
                </div>
              </div>
            )}
            {history.records.highestPlayerScore && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Highest Player Score</div>
                <div className="font-semibold">
                  {history.records.highestPlayerScore.score.toFixed(1)} pts
                </div>
                <div className="text-xs text-muted-foreground">
                  {history.records.highestPlayerScore.player} ({history.records.highestPlayerScore.club})
                  {" "}(Round {history.records.highestPlayerScore.round}, {history.records.highestPlayerScore.year})
                </div>
              </div>
            )}
            {history.records.biggestWin && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Biggest Win Margin</div>
                <div className="font-semibold">
                  {history.records.biggestWin.margin.toFixed(1)} pts
                </div>
                <div className="text-xs text-muted-foreground">
                  {history.records.biggestWin.winner} def {history.records.biggestWin.loser}
                  {" "}(Round {history.records.biggestWin.round}, {history.records.biggestWin.year})
                </div>
              </div>
            )}
            {!history.records.highestScore && !history.records.highestPlayerScore && !history.records.biggestWin && (
              <p className="text-muted-foreground text-center py-4">
                No records yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-orange-500" />
              Club Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.clubStats.length > 0 ? (
              history.clubStats.slice(0, 5).map((club) => (
                <div key={club.id} className="flex items-center justify-between p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: club.primaryColor || "#6b7280",
                        color: club.secondaryColor || "#ffffff",
                      }}
                    >
                      {club.abbreviation}
                    </span>
                    <span className="font-medium">{club.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">{club.titles}</div>
                      <div className="text-[10px] text-muted-foreground">Titles</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{club.wins}</div>
                      <div className="text-[10px] text-muted-foreground">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-muted-foreground">{club.winRate}%</div>
                      <div className="text-[10px] text-muted-foreground">Win %</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No club stats yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notable Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Notable Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.events.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {history.events.map((event, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary" />
                    <div className="text-sm text-muted-foreground">{event.date}</div>
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No notable events recorded yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Club Histories */}
      {backstories.clubs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Club Histories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {backstories.clubs.map((club) => (
              <div key={club.id} className="border-b last:border-0 pb-6 last:pb-0">
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className="px-3 py-1 rounded text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: club.primaryColor || "#6b7280",
                      color: club.secondaryColor || "#ffffff",
                    }}
                  >
                    {club.abbreviation}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg">{club.name}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {club.founded && <span>Est. {club.founded}</span>}
                      {club.cityName && <span>Based in {club.cityName}</span>}
                      {club.venueName && <span>Home: {club.venueName}</span>}
                    </div>
                    {club.reservesName && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Reserves: {club.reservesName}
                        {club.townName && ` (${club.townName})`}
                        {club.reservesVenueName && ` at ${club.reservesVenueName}`}
                      </div>
                    )}
                  </div>
                </div>
                {club.history && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {club.history}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* City Histories */}
      {backstories.cities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              City Histories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {backstories.cities.map((city) => (
              <div key={city.id} className="border-b last:border-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{city.name}, {city.state}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {city.founded && <span>Founded {city.founded}</span>}
                      <span>Pop. {city.population.toLocaleString()}</span>
                      <Badge variant="outline" className="text-xs">
                        {city.marketSize} Market
                      </Badge>
                    </div>
                  </div>
                </div>
                {city.description && (
                  <p className="text-sm mb-2">{city.description}</p>
                )}
                {city.history && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {city.history}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Town Histories */}
      {backstories.towns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Town Histories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {backstories.towns.map((town) => (
              <div key={town.id} className="border-b last:border-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{town.name}, {town.state}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {town.founded && <span>Founded {town.founded}</span>}
                      <span>Pop. {town.population.toLocaleString()}</span>
                      {town.nearCityName && (
                        <span>Near {town.nearCityName}</span>
                      )}
                    </div>
                  </div>
                </div>
                {town.description && (
                  <p className="text-sm mb-2">{town.description}</p>
                )}
                {town.history && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {town.history}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
