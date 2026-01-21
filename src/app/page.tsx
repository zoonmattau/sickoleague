import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowRightLeft,
  Home,
  BookOpen,
  UserPlus,
  BarChart3,
  Shield,
  Target,
  Clock,
  AlertCircle,
  FileText,
  Briefcase,
  Gavel,
  Heart,
  Star,
  ChevronRight
} from "lucide-react";
import prisma from "@/lib/prisma";

async function getStandings() {
  try {
    const standings = await prisma.standing.findMany({
      include: { club: true },
      orderBy: [
        { wins: "desc" },
        { percentage: "desc" },
      ],
    });
    return standings;
  } catch {
    return [];
  }
}

async function getSeasonInfo() {
  try {
    const season = await prisma.season.findFirst({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      orderBy: { year: "desc" },
    });
    return season;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const allStandings = await getStandings();
  const season = await getSeasonInfo();

  const seniorsStandings = allStandings.filter(s => s.competition === "SENIORS");
  const reservesStandings = allStandings.filter(s => s.competition === "RESERVES");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Sicko League"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold">Sicko League</h1>
              <p className="text-xs text-muted-foreground">AFL Fantasy League</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Join League</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            {season ? `Season ${season.year}` : "New Season Coming"}
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Where AFL Fantasy Gets Serious
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage your club across senior and reserve squads, navigate the salary cap,
            make blockbuster trades, and compete for glory in the most in-depth AFL fantasy league.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 gap-2">
                <Trophy className="h-5 w-5" />
                Enter the League
              </Button>
            </Link>
            <Link href="https://discord.gg/jQ65xTRcRb" target="_blank">
              <Button size="lg" variant="outline" className="text-lg px-8 gap-2">
                <Users className="h-5 w-5" />
                Join Discord
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <Home className="h-4 w-4 hidden sm:block" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <BookOpen className="h-4 w-4 hidden sm:block" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="coaches" className="gap-2">
              <UserPlus className="h-4 w-4 hidden sm:block" />
              Join Us
            </TabsTrigger>
            <TabsTrigger value="standings" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Standings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary">8</div>
                  <p className="text-sm text-muted-foreground">Clubs</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary">750</div>
                  <p className="text-sm text-muted-foreground">Salary Cap</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary">19-23</div>
                  <p className="text-sm text-muted-foreground">List Size</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary">10</div>
                  <p className="text-sm text-muted-foreground">Draft Rounds</p>
                </CardContent>
              </Card>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Dual Squad System</CardTitle>
                  <CardDescription>
                    Seniors & affiliated reserves
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Field 11 in seniors and 8 in reserves. Each club runs both teams
                    playing the same fixture each week.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-2 group-hover:bg-green-500/20 transition-colors">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle>Salary Cap & Contracts</CardTitle>
                  <CardDescription>
                    750 points, multi-year deals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sign players to contracts, manage extensions, trade salary.
                    Reserves bonuses reward depth building.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2 group-hover:bg-orange-500/20 transition-colors">
                    <Home className="h-6 w-6 text-orange-500" />
                  </div>
                  <CardTitle>Home Field Advantage</CardTitle>
                  <CardDescription>
                    Dynamic HFA system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Build your fortress based on last 10 home games.
                    1.5x HFA against rivals. Sell home games for cap space.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                    <ArrowRightLeft className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle>Trading</CardTitle>
                  <CardDescription>
                    Players, picks, salary & staff
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Trade contracted players, future picks (3 years), coaching staff,
                    and salary with retention options.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2 group-hover:bg-purple-500/20 transition-colors">
                    <Target className="h-6 w-6 text-purple-500" />
                  </div>
                  <CardTitle>Draft & Rule 9</CardTitle>
                  <CardDescription>
                    10 rounds + mid-season draft
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Annual 10-round draft in reverse order. Rule 9 Draft prevents
                    stashing quality players in reserves.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-2 group-hover:bg-pink-500/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-pink-500" />
                  </div>
                  <CardTitle>Free Agency & RFAs</CardTitle>
                  <CardDescription>
                    Competitive bidding system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    In-season and end of season FA. Top 25% earners are RFAs
                    with matching rights for previous clubs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <Tabs defaultValue="gameplay" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
                <TabsTrigger value="gameplay" className="text-xs sm:text-sm">Gameplay</TabsTrigger>
                <TabsTrigger value="rosters" className="text-xs sm:text-sm">Rosters</TabsTrigger>
                <TabsTrigger value="scoring" className="text-xs sm:text-sm">Scoring</TabsTrigger>
                <TabsTrigger value="hfa" className="text-xs sm:text-sm">HFA</TabsTrigger>
                <TabsTrigger value="cap" className="text-xs sm:text-sm">Salary Cap</TabsTrigger>
                <TabsTrigger value="contracts" className="text-xs sm:text-sm">Contracts</TabsTrigger>
                <TabsTrigger value="draft" className="text-xs sm:text-sm">Draft</TabsTrigger>
                <TabsTrigger value="freeagency" className="text-xs sm:text-sm">Free Agency</TabsTrigger>
                <TabsTrigger value="trading" className="text-xs sm:text-sm">Trading</TabsTrigger>
                <TabsTrigger value="staff" className="text-xs sm:text-sm">Staff</TabsTrigger>
              </TabsList>

              {/* Gameplay */}
              <TabsContent value="gameplay">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Gameplay & Season Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">League Management</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Managed on Discord and this website</li>
                        <li>Each club has a senior and affiliated reserve team</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Season Structure</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Home and away fixture structure</li>
                        <li>Seniors and reserves play the same opponent each round</li>
                        <li>League-wide bye rounds during AFL byes</li>
                        <li>Scored using AFL Fantasy points</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Finals Structure</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Week 1: 1st vs 2nd & 3rd vs 4th</li>
                        <li>Week 2: Loser of 1v2 vs Winner of 3v4</li>
                        <li>Week 3: Winner of Week 1&apos;s first game vs Winner of Week 2</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rosters */}
              <TabsContent value="rosters">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Teams & Rosters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-semibold mb-2">Seniors (11 players)</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>3 Defenders (DEF)</li>
                          <li>4 Midfielders (MID)</li>
                          <li>1 Ruck (RUC)</li>
                          <li>3 Forwards (FWD)</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-semibold mb-2">Reserves (8 players)</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>2 Defenders (DEF)</li>
                          <li>3 Midfielders (MID)</li>
                          <li>1 Ruck (RUC)</li>
                          <li>2 Forwards (FWD)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">List Requirements</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>2 Injury List spots + 2 Bench spots</li>
                        <li>Minimum 19 players, maximum 21 active players</li>
                        <li>Can have 0-2 injured players</li>
                        <li>Rosters lock at first bounce, open at final siren</li>
                        <li>Late submissions default to previous round&apos;s lineup</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Captaincy</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Nominate captain and vice-captain for each squad pre-season</li>
                        <li>Can only change captaincy if captain is benched, on IL, traded, released, or moved between squads</li>
                        <li>Senior and reserve captaincy are independent</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                      <strong>Roster Example:</strong>
                      <p>You have 21 contracted players. Your lineup could be:</p>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>11 in seniors (3 DEF, 4 MID, 1 RUC, 3 FWD)</li>
                        <li>8 in reserves (2 DEF, 3 MID, 1 RUC, 2 FWD)</li>
                        <li>2 on bench (any position)</li>
                      </ul>
                      <p className="text-muted-foreground mt-1">If a player is marked &quot;unavailable&quot; on the AFL website, they can go on your IL instead.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scoring */}
              <TabsContent value="scoring">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Scoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                      <li>Points scored using AFL Fantasy system</li>
                      <li><strong>Captains earn 2x points</strong></li>
                      <li>If captain doesn&apos;t play, vice-captain scores 2x</li>
                      <li>No emergency scoring</li>
                      <li>Bye rounds: Top 9 scoring for seniors, top 7 for reserves</li>
                    </ul>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                      <strong>Example:</strong>
                      <p>Your captain Marcus Bontempelli scores 120 AFL Fantasy points.</p>
                      <p>With the 2x captain bonus: <strong>240 points</strong> for your team.</p>
                      <p className="text-muted-foreground">If Bontempelli didn&apos;t play and your VC Lachie Neale scored 95, Neale would score 190 points instead.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* HFA */}
              <TabsContent value="hfa">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-orange-500" />
                      Home Field Advantage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">HFA Calculation</h4>
                      <p className="text-sm text-muted-foreground">
                        HFA = (Average of last 3 home margins ÷ 5) + (Average of 4th-10th last home margins ÷ 20)
                      </p>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <strong>Example:</strong> Last 10 home margins: 35, 25, -20, -30, -10, 5, -45, 20, 50, -30<br/>
                        Last 3: (35+25-20) ÷ 5 = 8<br/>
                        Next 7: (-30-10+5-45+20+50-30) ÷ 20 = -2<br/>
                        <strong>HFA = 6 points</strong>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">HFA Rules</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Teams start with 0 HFA</li>
                        <li>Seniors capped at ±15, Reserves capped at ±8</li>
                        <li>Reserves HFA is half of calculated amount</li>
                        <li><strong>1.5x HFA against rivals</strong> (finals opponents or nominated clubs)</li>
                        <li>Can sell home games to other clubs for salary cap value</li>
                        <li>Cannot sell home games to rival teams</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Salary Cap */}
              <TabsContent value="cap">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Salary Cap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Cap Rules</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li><strong>750 point salary cap</strong></li>
                        <li>Must stay under cap during current season</li>
                        <li>Can go over in future seasons if compliant by draft</li>
                        <li>Non-compliant clubs have players auto-released to pool</li>
                        <li>Salary can be traded between clubs</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Reserves Ladder Bonuses</h4>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div className="p-2 rounded bg-yellow-500/10">
                          <div className="font-bold text-yellow-500">1st</div>
                          <div className="text-sm">+75</div>
                        </div>
                        <div className="p-2 rounded bg-gray-500/10">
                          <div className="font-bold text-gray-400">2nd</div>
                          <div className="text-sm">+50</div>
                        </div>
                        <div className="p-2 rounded bg-orange-500/10">
                          <div className="font-bold text-orange-500">3rd</div>
                          <div className="text-sm">+30</div>
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <div className="font-bold">4th</div>
                          <div className="text-sm">+20</div>
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <div className="font-bold">5th</div>
                          <div className="text-sm">+10</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                      <strong>Cap Example:</strong>
                      <p>Your club finished 2nd in reserves last year (+50 bonus).</p>
                      <p>Your effective cap: 750 + 50 = <strong>800 pts</strong></p>
                      <p className="text-muted-foreground">This rewards clubs that invest in reserves depth rather than stacking all salary on seniors.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contracts */}
              <TabsContent value="contracts">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Contracts & Extensions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Contract Basics</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Every senior player must be on a contract</li>
                        <li>Reserves players without senior games are effectively free</li>
                        <li>Minimum contract: 1pt/game + 2pt signing bonus</li>
                        <li>Released players owed remaining contract (spread over years)</li>
                        <li>Minimum contract release costs 3 pts</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Contract Extensions</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Player must have 5+ AFL games that year</li>
                        <li>Only in final year of contract</li>
                        <li>Cost = (Season average ÷ 2), rounded down</li>
                        <li>Other clubs can counter with 20%+ higher offer</li>
                        <li>Long-term: +10% year-on-year increase</li>
                        <li>Max 10-year contracts</li>
                        <li>7-day bidding period (resets each new offer)</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                      <strong>Extension Example:</strong>
                      <p>Nick Daicos has a season average of 110 points.</p>
                      <p>Base extension cost: 110 ÷ 2 = <strong>55 pts/year</strong></p>
                      <p>For a 3-year deal with 10% escalation:</p>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>Year 1: 55 pts</li>
                        <li>Year 2: 60.5 pts</li>
                        <li>Year 3: 66.5 pts</li>
                      </ul>
                      <p>Total: <strong>182 pts over 3 years</strong></p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Draft */}
              <TabsContent value="draft">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      Draft & Rule 9
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Annual Draft</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>~14 days before first game</li>
                        <li>10 rounds</li>
                        <li>Reverse finishing order of previous seniors</li>
                        <li>Forfeit remaining picks if no roster spots</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Rule 9 Draft (Mid-Season)</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Between Round 13 and 14</li>
                        <li>Prevents stashing quality players in reserves</li>
                        <li>Eligible: Majority reserves games, senior contract, not a rookie this year or last</li>
                        <li>Drafted players must stay on seniors/IL for current + next season</li>
                        <li>Must have open roster spot to draft</li>
                        <li>Can pass picks</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                      <strong>Rule 9 Example:</strong>
                      <p>Club A has Sam Walsh on a senior contract but has played him in reserves for 8 of 13 rounds (majority).</p>
                      <p>Walsh is NOT a rookie (debuted 2019), so he&apos;s eligible for Rule 9.</p>
                      <p>Club B selects Walsh in the Rule 9 Draft. Walsh must now play seniors or IL for Club B for the rest of this season and all of next season.</p>
                      <p className="text-muted-foreground">This prevents clubs from &quot;hiding&quot; quality contracted players in reserves.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Free Agency */}
              <TabsContent value="freeagency">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-pink-500" />
                      Free Agency
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">In-Season Free Agency</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Sign any non-contracted player</li>
                        <li>48-hour counter-offer window</li>
                        <li>Reserve squad contracts can start at 0 salary</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">End of Season Free Agency</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Opens day after Grand Final</li>
                        <li>Closes day before first game</li>
                        <li>7-day bidding period (5% minimum increase)</li>
                        <li>Period halves as deadline approaches</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Restricted Free Agents (RFAs)</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Top 25% highest paid players</li>
                        <li>Previous club can match offer + 20%</li>
                        <li>2 days to accept/reject RFA match</li>
                        <li>Players offered contracts pushing them into top 25% become RFAs</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                      <strong>RFA Example:</strong>
                      <p>Christian Petracca is an RFA (top 25% salary). His contract expires.</p>
                      <p>Club B offers 60 pts/year for 3 years.</p>
                      <p>Club A (his previous club) can match at 60 + 20% = <strong>72 pts/year</strong> to retain him.</p>
                      <p className="text-muted-foreground">Petracca has 2 days to accept or reject Club A&apos;s match offer. If he rejects, he goes to Club B at 60 pts/year.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Trading */}
              <TabsContent value="trading">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                      Trading
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                      <li>Trade contracted players (new team takes contract)</li>
                      <li>Include salary retention to stay under cap</li>
                      <li>Trade salary tied to players, coaches, or freely</li>
                      <li>Trade future draft picks up to 3 years ahead</li>
                      <li>Any combination of players, coaches, picks, salary</li>
                    </ul>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                      <strong>Trade Example:</strong>
                      <p className="font-medium">Club A receives:</p>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>Jordan De Goey (45 pts/yr, 2 years left)</li>
                        <li>2027 2nd round pick</li>
                      </ul>
                      <p className="font-medium mt-2">Club B receives:</p>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>Tim Taranto (30 pts/yr)</li>
                        <li>15 pts salary retention (Club A pays 15 of De Goey&apos;s 45)</li>
                        <li>2026 1st round pick</li>
                      </ul>
                      <p className="text-muted-foreground mt-2">Club B effectively gets De Goey at 30 pts/yr (45 - 15 retention).</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Coaching Staff */}
              <TabsContent value="staff">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Coaching Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Available Staff</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Senior team assistant coach</li>
                        <li>Reserves team assistant coach</li>
                        <li>List manager</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Assistant Coaches</h4>
                      <p className="text-sm text-muted-foreground">
                        Add/subtract their real AFL team&apos;s margin ÷ 10 to your score.<br/>
                        <em>Example: If your assistant&apos;s AFL team wins by 20, you get +2 points.</em>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">List Manager</h4>
                      <p className="text-sm text-muted-foreground">
                        Contract discount = (19 - ladder position) ÷ 3<br/>
                        <em>Example: If manager&apos;s AFL team is 6th, discount = (19-6) ÷ 3 = 4.33%</em>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Staff Contracts</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Come out of salary cap</li>
                        <li>Can be traded</li>
                        <li>Free agent bidding like players</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Looking to Coach Tab */}
          <TabsContent value="coaches" className="space-y-6">
            <Card className="border-primary/50">
              <CardHeader className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Want to Join Sicko League?</CardTitle>
                <CardDescription className="text-base">
                  We&apos;re always looking for committed coaches who love AFL fantasy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Commitment
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Set your roster weekly (5-10 mins). Be active in trades and discussions.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Community
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Active Discord community for banter, trade talk, and league discussion.
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">What We Look For</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-500 text-sm">✓</span>
                      </div>
                      <span className="text-sm">Active participation - set your roster each week</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-500 text-sm">✓</span>
                      </div>
                      <span className="text-sm">Engaged in the community - trades, banter, discussions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-500 text-sm">✓</span>
                      </div>
                      <span className="text-sm">Long-term commitment - we want coaches who stick around</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-500 text-sm">✓</span>
                      </div>
                      <span className="text-sm">Good sport - win with grace, lose with dignity</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <h4 className="font-semibold mb-2">Current Availability</h4>
                  <p className="text-muted-foreground mb-4">
                    Check Discord for current openings or to join the waitlist
                  </p>
                  <Link href="https://discord.gg/jQ65xTRcRb" target="_blank">
                    <Button className="gap-2">
                      <Users className="h-4 w-4" />
                      Join Our Discord
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Seniors Ladder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {season ? `${season.year} Seniors` : "Seniors Ladder"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seniorsStandings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 pr-2 font-medium text-muted-foreground">#</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground">Club</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">P</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">W</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">L</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seniorsStandings.map((standing, index) => (
                            <tr key={standing.id} className="border-b last:border-0">
                              <td className="py-2 pr-2">
                                <span className={`font-semibold ${index < 4 ? 'text-primary' : ''}`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-2 pr-2 font-medium">{standing.club.name}</td>
                              <td className="py-2 pr-2 text-center text-muted-foreground">{standing.played}</td>
                              <td className="py-2 pr-2 text-center text-green-500">{standing.wins}</td>
                              <td className="py-2 pr-2 text-center text-red-500">{standing.losses}</td>
                              <td className="py-2 text-right">{Number(standing.percentage).toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Season hasn&apos;t started yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reserves Ladder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    {season ? `${season.year} Reserves` : "Reserves Ladder"}
                  </CardTitle>
                  <CardDescription>Affiliated with senior clubs above</CardDescription>
                </CardHeader>
                <CardContent>
                  {reservesStandings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 pr-2 font-medium text-muted-foreground">#</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground">Club</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">P</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">W</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">L</th>
                            <th className="pb-2 font-medium text-muted-foreground text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservesStandings.map((standing, index) => (
                            <tr key={standing.id} className="border-b last:border-0">
                              <td className="py-2 pr-2">
                                <span className={`font-semibold ${index < 5 ? 'text-green-500' : ''}`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                <span className="font-medium">{standing.club.name}</span>
                                <span className="text-muted-foreground text-xs ml-1">Res.</span>
                              </td>
                              <td className="py-2 pr-2 text-center text-muted-foreground">{standing.played}</td>
                              <td className="py-2 pr-2 text-center text-green-500">{standing.wins}</td>
                              <td className="py-2 pr-2 text-center text-red-500">{standing.losses}</td>
                              <td className="py-2 text-right">{Number(standing.percentage).toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Season hasn&apos;t started yet</p>
                    </div>
                  )}
                  {reservesStandings.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Top 5 earn salary cap bonuses (75/50/30/20/10)
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Sicko League"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-semibold">Sicko League</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="https://discord.gg/jQ65xTRcRb" target="_blank" className="hover:text-foreground transition-colors">
                Discord
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
