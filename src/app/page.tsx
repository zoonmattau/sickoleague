import { redirect } from "next/navigation";
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
  ChevronRight,
  Vote,
  Send
} from "lucide-react";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { RuleAmendmentForm } from "@/components/rule-amendment-form";

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

async function getClubsWithCoaches() {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        coach: {
          select: {
            id: true,
            displayName: true,
            discordId: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return clubs;
  } catch {
    return [];
  }
}

async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// Fallback clubs data if database is empty
const fallbackClubs = [
  { name: 'The Sickos', abbreviation: 'SCK', reservesName: 'Sicko Symptoms', primaryColor: '#1a1a2e', secondaryColor: '#eaeaea' },
  { name: 'Ball Hoggers', abbreviation: 'BHG', reservesName: 'Piglets', primaryColor: '#ff6b6b', secondaryColor: '#ffffff' },
  { name: 'Midfield Maulers', abbreviation: 'MFM', reservesName: 'Clearance Crew', primaryColor: '#4ecdc4', secondaryColor: '#1a1a1a' },
  { name: 'Ruckus Makers', abbreviation: 'RKM', reservesName: 'Tap Specialists', primaryColor: '#45b7d1', secondaryColor: '#ffffff' },
  { name: 'Forward Press', abbreviation: 'FWP', reservesName: 'Goal Kickers', primaryColor: '#f9ca24', secondaryColor: '#1a1a1a' },
  { name: 'Back Line Bandits', abbreviation: 'BLB', reservesName: 'Intercept FC', primaryColor: '#6c5ce7', secondaryColor: '#ffffff' },
  { name: 'Fantasy Flops', abbreviation: 'FLO', reservesName: 'Donut Club', primaryColor: '#fd79a8', secondaryColor: '#1a1a1a' },
  { name: 'Bench Warmers', abbreviation: 'BWM', reservesName: 'Pine Riders', primaryColor: '#a29bfe', secondaryColor: '#1a1a1a' },
  { name: 'Contested Marks', abbreviation: 'CTM', reservesName: 'High Flyers', primaryColor: '#00b894', secondaryColor: '#ffffff' },
  { name: 'Clearance Kings', abbreviation: 'CLK', reservesName: 'Stoppage Princes', primaryColor: '#e17055', secondaryColor: '#ffffff' },
  { name: 'Inside 50 FC', abbreviation: 'I50', reservesName: 'Arc Attackers', primaryColor: '#0984e3', secondaryColor: '#ffffff' },
  { name: 'Rebound Rebels', abbreviation: 'RBR', reservesName: 'D50 Defenders', primaryColor: '#636e72', secondaryColor: '#dfe6e9' },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const params = await searchParams;

  // If OAuth code arrives at root, redirect to auth callback
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`);
  }

  const allStandings = await getStandings();
  const season = await getSeasonInfo();
  const clubs = await getClubsWithCoaches();
  const user = await getUser();

  const totalClubs = clubs.length || 12;
  const vacantClubs = clubs.filter(c => !c.coach).length || 12;

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
            {user ? (
              <>
                <Link href="/admin">
                  <Button variant="ghost" size="sm">Admin</Button>
                </Link>
                <span className="text-sm text-muted-foreground self-center">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">Join League</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <Badge variant="secondary" className="mb-4">
            {season ? `Season ${season.year}` : "New Season Coming"}
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Be a Real Coach
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Not just a fantasy team. A full club to manage.
          </p>
        </div>

        {/* Key Features - Immediate Impact */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-5 text-center">
            <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="font-bold text-lg">750k Salary Cap</div>
            <p className="text-sm text-muted-foreground">Sign multi-year contracts. Manage your cap. Build dynasties.</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-5 text-center">
            <ArrowRightLeft className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="font-bold text-lg">Real Trading</div>
            <p className="text-sm text-muted-foreground">Trade players, draft picks, salary & staff with any club.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl p-5 text-center">
            <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="font-bold text-lg">Two Squads</div>
            <p className="text-sm text-muted-foreground">Run Seniors & Reserves. Develop depth. Win on two fronts.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
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

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <Home className="h-4 w-4 hidden sm:block" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="coaches" className="gap-2">
              <UserPlus className="h-4 w-4 hidden sm:block" />
              Join Us
            </TabsTrigger>
            <TabsTrigger value="standings" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <BookOpen className="h-4 w-4 hidden sm:block" />
              Rules
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Coaches Needed Banner */}
            {vacantClubs > 0 && (
              <Card className="border-accent bg-accent/10">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center">
                        <UserPlus className="h-7 w-7 text-accent" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{vacantClubs} Coaches Needed!</div>
                        <p className="text-muted-foreground">We&apos;re looking for dedicated coaches to join Season {season?.year || 2026}</p>
                      </div>
                    </div>
                    <Link href="https://discord.gg/jQ65xTRcRb" target="_blank">
                      <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Users className="h-5 w-5" />
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

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
                <TabsTrigger value="amendments" className="text-xs sm:text-sm">Amendments</TabsTrigger>
              </TabsList>

              {/* Gameplay */}
              <TabsContent value="gameplay">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Section 1: Gameplay & Season Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">1.1 League Management</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>1.1.1 The League shall be managed via Discord and this website.</p>
                        <p>1.1.2 Each Club shall consist of a Senior team and an affiliated Reserves team.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">1.2 Season Structure</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>1.2.1 The season shall follow a home and away fixture structure.</p>
                        <p>1.2.2 Seniors and Reserves shall play the same opponent each round.</p>
                        <p>1.2.3 League-wide bye rounds shall coincide with AFL bye rounds.</p>
                        <p>1.2.4 All scoring shall be calculated using AFL Fantasy points.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">1.3 Finals Structure</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>1.3.1 Week 1: 1st vs 2nd and 3rd vs 4th.</p>
                        <p>1.3.2 Week 2: Loser of 1st vs 2nd shall play Winner of 3rd vs 4th.</p>
                        <p>1.3.3 Week 3 (Grand Final): Winner of Week 1&apos;s first game vs Winner of Week 2.</p>
                        <p>1.3.4 In the event of a draw in any finals match, the higher-seeded team shall advance.</p>
                        <p>1.3.5 Players are only eligible for Reserves finals if they have played an equal or greater number of games in Reserves than Seniors during the regular season.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">1.4 Ladder Tie-Breakers</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>1.4.1 When teams are equal on points, ladder position shall be determined by:</p>
                        <div className="pl-4">
                          <p>(a) Percentage (Points For ÷ Points Against × 100)</p>
                          <p>(b) Head-to-head record</p>
                          <p>(c) Total games won</p>
                          <p>(d) Coin flip</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">1.5 Club Management</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>1.5.1 If a coach abandons their club mid-season, the club shall be immediately available for a new coach to claim.</p>
                        <p>1.5.2 Until a replacement is found, the roster shall default to the previous week&apos;s lineup.</p>
                      </div>
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
                      Section 2: Teams & Rosters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">2.1 Team Composition</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>2.1.1 Seniors team shall consist of eleven (11) players:</p>
                        <div className="pl-4">
                          <p>(a) Three (3) Defenders (DEF)</p>
                          <p>(b) Four (4) Midfielders (MID)</p>
                          <p>(c) One (1) Ruck (RUC)</p>
                          <p>(d) Three (3) Forwards (FWD)</p>
                        </div>
                        <p>2.1.2 Reserves team shall consist of eight (8) players:</p>
                        <div className="pl-4">
                          <p>(a) Two (2) Defenders (DEF)</p>
                          <p>(b) Three (3) Midfielders (MID)</p>
                          <p>(c) One (1) Ruck (RUC)</p>
                          <p>(d) Two (2) Forwards (FWD)</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">2.2 List Requirements</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>2.2.1 Each Club shall maintain two (2) Injury List spots and two (2) Bench spots.</p>
                        <p>2.2.2 Minimum list size shall be nineteen (19) players; maximum shall be twenty-one (21) active players.</p>
                        <p>2.2.3 Clubs may have zero (0) to two (2) injured players at any time.</p>
                        <p>2.2.4 Rosters shall lock at first bounce of the round (typically Thursday) and unlock after the final game of the round.</p>
                        <p>2.2.5 Late submissions shall default to previous round&apos;s lineup.</p>
                        <p>2.2.6 Bench player scores shall not count toward match results.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">2.3 Position Eligibility</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>2.3.1 Players with dual-position eligibility (e.g., DEF/MID) may fill either eligible position slot.</p>
                        <p>2.3.2 If a rostered player does not play in a given round (late omission, injury), they shall score zero (0) points with no replacement.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">2.4 Captaincy</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>2.4.1 Coaches shall nominate a Captain and Vice-Captain for each squad prior to the season.</p>
                        <p>2.4.2 Captain or Vice-Captain may only change if they are:</p>
                        <div className="pl-4">
                          <p>(a) Benched for one (1) game week where the team is active</p>
                          <p>(b) Placed on Injury List</p>
                          <p>(c) Traded</p>
                          <p>(d) Released</p>
                          <p>(e) Moved between squads</p>
                        </div>
                        <p>2.4.3 Senior and Reserve captaincy/vice-captaincy shall be independent of each other.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">2.5 Squad Movement</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>2.5.1 Players with an existing Senior contract shall retain their contract when moved between squads.</p>
                        <p>2.5.2 Players without a Senior contract who are promoted to Seniors shall receive a contract valued at one (1) point per game remaining in the regular season.</p>
                      </div>
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
                      Section 3: Scoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">3.1 Points System</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>3.1.1 All points shall be calculated using the official AFL Fantasy scoring system.</p>
                        <p>3.1.2 Captains shall earn one and a half times (1.5x) their AFL Fantasy points.</p>
                        <p>3.1.3 Vice-Captains shall earn one and a quarter times (1.25x) their AFL Fantasy points.</p>
                        <p>3.1.4 No emergency scoring shall apply.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">3.2 Bye Rounds</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>3.2.1 During bye rounds, Seniors shall score from the top nine (9) scoring players.</p>
                        <p>3.2.2 During bye rounds, Reserves shall score from the top seven (7) scoring players.</p>
                        <p>3.2.3 Captain and Vice-Captain multipliers shall apply during bye rounds if those players are among the top scorers.</p>
                      </div>
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
                      Section 4: Home Field Advantage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">4.1 HFA Calculation</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>4.1.1 HFA shall be calculated as follows:</p>
                        <p className="pl-4 font-mono text-xs">HFA = (Average of last 3 home margins ÷ 5) + (Average of 4th-10th home margins ÷ 20)</p>
                        <p>4.1.2 All teams shall start with zero (0) HFA.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">4.2 HFA Limits</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>4.2.1 Seniors HFA shall be capped at plus or minus fifteen (±15) points.</p>
                        <p>4.2.2 Reserves HFA shall be capped at plus or minus eight (±8) points.</p>
                        <p>4.2.3 Reserves HFA shall be calculated at half (50%) of the standard amount.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">4.3 Rivalry System</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>4.3.1 HFA shall be dynamically multiplied based on rivalry intensity when playing against Rival clubs.</p>
                        <p>4.3.2 The more severe the rivalry, the greater the HFA multiplier shall be.</p>
                        <p>4.3.3 Rivalry shall be determined by a dynamic tension system between clubs.</p>
                        <p>4.3.4 Tension shall increase based on:</p>
                        <div className="pl-4">
                          <p>(a) Close matches (decided by fewer than 20 points)</p>
                          <p>(b) Player trades between clubs</p>
                          <p>(c) Finals matchups</p>
                          <p>(d) Ladder proximity during the season</p>
                        </div>
                        <p>4.3.5 Tension shall naturally decay over time without interaction.</p>
                        <p>4.3.6 When tension between two clubs exceeds the rivalry threshold, they shall become official Rivals.</p>
                        <p>4.3.7 Rivalry tension scores shall be publicly visible to all coaches.</p>
                        <p>4.3.8 There shall be no limit to the number of Rivals a club may have.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">4.4 Home Game Sales</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>4.4.1 Clubs may sell home games to other clubs in exchange for salary cap value.</p>
                        <p>4.4.2 Clubs shall not sell home games to Rival teams.</p>
                      </div>
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
                      Section 5: Salary Cap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">5.1 Cap Rules</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>5.1.1 The base salary cap shall be seven hundred and fifty (750) points.</p>
                        <p>5.1.2 All contract values must be expressed as whole numbers (no decimals).</p>
                        <p>5.1.3 Clubs must remain under the salary cap during the current season.</p>
                        <p>5.1.4 Clubs may exceed the cap in future seasons provided they are compliant by draft day.</p>
                        <p>5.1.5 Non-compliant clubs shall have players auto-released in alternating order: lowest paid, then highest paid, then second lowest, then second highest, and so on until compliant.</p>
                        <p>5.1.6 Salary may be traded between clubs.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">5.2 Reserves Ladder Bonuses</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>5.2.1 Clubs shall receive salary cap bonuses based on Reserves ladder position:</p>
                        <div className="pl-4">
                          <p>(a) First place: +75 points</p>
                          <p>(b) Second place: +50 points</p>
                          <p>(c) Third place: +30 points</p>
                          <p>(d) Fourth place: +20 points</p>
                          <p>(e) Fifth place: +10 points</p>
                        </div>
                      </div>
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
                      Section 6: Contracts & Extensions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">6.1 Contract Requirements</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>6.1.1 Every Senior player must be under contract.</p>
                        <p>6.1.2 Reserves players without Senior games are effectively free (0 salary).</p>
                        <p>6.1.3 Minimum contract value shall be one (1) point per game plus two (2) point signing bonus.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">6.2 Contract Releases</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>6.2.1 Released players shall be owed their remaining contract value, spread across remaining years.</p>
                        <p>6.2.2 Minimum contract release cost shall be three (3) points.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">6.3 Contract Extensions</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>6.3.1 Players must have played five (5) or more AFL games that year to be eligible.</p>
                        <p>6.3.2 Extensions may only be offered in the final year of a contract.</p>
                        <p>6.3.3 Extension cost shall be calculated as: AFL Fantasy Season Average ÷ 2, rounded down to the nearest whole number.</p>
                        <p>6.3.4 Other clubs may counter-offer with twenty percent (20%) or greater increase.</p>
                        <p>6.3.5 Multi-year deals shall include ten percent (10%) year-on-year increase.</p>
                        <p>6.3.6 Maximum contract length shall be ten (10) years.</p>
                        <p>6.3.7 Bidding period shall be seven (7) days, resetting with each new offer.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">6.4 Player Retirement</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>6.4.1 If an AFL player retires, their Sicko League contract shall be voided with no cap penalty.</p>
                        <p>6.4.2 The player shall be removed from the club&apos;s roster immediately.</p>
                      </div>
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
                      Section 7: Draft & Rule 9
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">7.1 Annual Draft</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>7.1.1 The Annual Draft shall occur approximately fourteen (14) days before the first game.</p>
                        <p>7.1.2 The Draft shall consist of ten (10) rounds.</p>
                        <p>7.1.3 Draft order shall be in reverse finishing order of the previous Seniors ladder.</p>
                        <p>7.1.4 Clubs shall forfeit remaining picks if no roster spots are available.</p>
                        <p>7.1.5 Each coach shall have one (1) minute to make their pick; failure to pick in time shall result in an automatic pass.</p>
                        <p>7.1.6 Draft picks may be traded up to three (3) years in advance.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">7.2 Rule 9 Draft (Mid-Season)</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>7.2.1 The Rule 9 Draft shall occur between Round 13 and Round 14.</p>
                        <p>7.2.2 Purpose: To prevent clubs from stashing quality players in Reserves.</p>
                        <p>7.2.3 Player eligibility requires:</p>
                        <div className="pl-4">
                          <p>(a) Majority of games played in Reserves</p>
                          <p>(b) Active Senior contract</p>
                          <p>(c) Not classified as a rookie</p>
                        </div>
                        <p>7.2.4 A &quot;rookie&quot; for Rule 9 purposes is defined as a player in their first or second AFL season who has not played the requisite number of Senior games in Sicko League.</p>
                        <p>7.2.5 Drafted players must remain on Seniors or Injury List for the current and following season.</p>
                        <p>7.2.6 Clubs must have an open roster spot to draft.</p>
                        <p>7.2.7 Clubs may pass on their pick.</p>
                      </div>
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
                      Section 8: Free Agency
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">8.1 In-Season Free Agency</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>8.1.1 Clubs may sign any non-contracted player during the season.</p>
                        <p>8.1.2 A forty-eight (48) hour counter-offer window shall apply.</p>
                        <p>8.1.3 Each new counter-offer shall reset the forty-eight (48) hour window.</p>
                        <p>8.1.4 Reserves squad contracts may commence at zero (0) salary; Senior contracts require minimum one (1) point.</p>
                        <p>8.1.5 Released players shall become free agents immediately and may be signed by any club.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">8.2 End of Season Free Agency</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>8.2.1 The period shall open the day after the Grand Final.</p>
                        <p>8.2.2 There shall be no deadline for free agency signings.</p>
                        <p>8.2.3 Initial bidding period shall be seven (7) days with five percent (5%) minimum increase required.</p>
                        <p>8.2.4 Each new offer shall halve the remaining bidding period (minimum twelve (12) hours).</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">8.3 Restricted Free Agents (RFAs)</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>8.3.1 RFAs are defined as players in the top twenty-five percent (25%) of salary.</p>
                        <p>8.3.2 The previous club may match any offer plus twenty percent (20%).</p>
                        <p>8.3.3 Players have two (2) days to accept or reject the RFA match offer.</p>
                        <p>8.3.4 Players receiving offers that push them into the top 25% shall become RFAs.</p>
                      </div>
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
                      Section 9: Trading
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">9.1 Tradeable Assets</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>9.1.1 Contracted players may be traded; the receiving club assumes the contract.</p>
                        <p>9.1.2 Draft picks may be traded up to three (3) years in advance.</p>
                        <p>9.1.3 Coaching staff may be traded.</p>
                        <p>9.1.4 Salary cap space may be traded freely or attached to players/staff.</p>
                        <p>9.1.5 Any number of clubs may participate in a single trade.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">9.2 Trade Deadline</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>9.2.1 The trade deadline shall be four (4) weeks before the start of Sicko League finals.</p>
                        <p>9.2.2 No trades may be processed after the deadline until the off-season.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">9.3 Salary Retention</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>9.3.1 Clubs may include salary retention to facilitate trades.</p>
                        <p>9.3.2 Retained salary shall count against the retaining club&apos;s cap.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">9.4 Trade Combinations</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>9.4.1 Any combination of players, coaches, picks, and salary may be included in trades.</p>
                      </div>
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
                      Section 10: Coaching Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">10.1 Available Staff Positions</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>10.1.1 Each club may employ the following staff:</p>
                        <div className="pl-4">
                          <p>(a) Senior Team Assistant Coach</p>
                          <p>(b) Reserves Team Assistant Coach</p>
                          <p>(c) List Manager</p>
                        </div>
                        <p>10.1.2 Assistant Coaches shall be real-life AFL team coaches, linked to their respective AFL teams.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">10.2 Assistant Coach Bonus</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>10.2.1 The Assistant Coach bonus shall be calculated as: their linked AFL Team&apos;s Margin ÷ 10.</p>
                        <p>10.2.2 The bonus is added to (or subtracted from) the club&apos;s score each round.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">10.3 List Manager Discount</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>10.3.1 The List Manager discount shall be calculated as: (19 - AFL Ladder Position) ÷ 3, rounded to the nearest whole number.</p>
                        <p>10.3.2 The discount applies as a percentage reduction on contract signings.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">10.4 Staff Contract Rules</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>10.4.1 Staff salaries shall be determined by market-based negotiation, similar to player contracts.</p>
                        <p>10.4.2 Staff salaries shall count against the salary cap.</p>
                        <p>10.4.3 Staff may be traded between clubs.</p>
                        <p>10.4.4 Staff free agency shall follow the same bidding rules as players.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Amendments */}
              <TabsContent value="amendments">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5 text-primary" />
                      Section 11: Rule Amendments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">11.1 Amendment Process</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>11.1.1 Any coach may submit a proposed rule change for consideration.</p>
                        <p>11.1.2 Proposed amendments shall be reviewed for inclusion in the following season.</p>
                        <p>11.1.3 All coaches shall vote on proposed amendments before each new season.</p>
                        <p>11.1.4 A proposed amendment shall pass with a majority vote of fifty percent plus one (50%+1) of all coaches.</p>
                        <p>11.1.5 Passed amendments shall take effect at the start of the following season.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">11.2 Emergency Amendments</h4>
                      <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>11.2.1 In cases of urgent rule clarification, the League Commissioner may implement temporary rulings.</p>
                        <p>11.2.2 Temporary rulings shall be subject to formal vote at the end of the season.</p>
                      </div>
                    </div>

                    {/* Rule Change Submission Form */}
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Submit a Rule Change Proposal
                      </h4>
                      {user ? (
                        <RuleAmendmentForm
                          userEmail={user.email}
                          userName={user.user_metadata?.full_name || user.user_metadata?.name}
                        />
                      ) : (
                        <div className="text-center py-8 space-y-4">
                          <p className="text-muted-foreground">
                            You must be signed in to submit a rule change proposal.
                          </p>
                          <Link href="/login">
                            <Button className="gap-2">
                              <Users className="h-4 w-4" />
                              Sign In with Discord
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Looking to Coach Tab */}
          <TabsContent value="coaches" className="space-y-6">
            {/* Vacancies Banner */}
            {vacantClubs > 0 && (
              <Card className="border-accent bg-accent/10">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center">
                        <UserPlus className="h-7 w-7 text-accent" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{vacantClubs} of {totalClubs} Spots Available!</div>
                        <p className="text-muted-foreground">Claim your club for Season {season?.year || 2026}</p>
                      </div>
                    </div>
                    <Link href="https://discord.gg/jQ65xTRcRb" target="_blank">
                      <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Users className="h-5 w-5" />
                        Sign Up Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teams & Coaches List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Clubs & Coaches
                </CardTitle>
                <CardDescription>
                  Current club roster - vacant spots are waiting for you!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  Team names, colors, and logos shown below are placeholders.
                  When you claim a club, you can <strong className="text-foreground">fully customize your team&apos;s branding</strong> - choose your own seniors name,
                  reserves name, colors, and upload custom logos!
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(clubs.length > 0 ? clubs : fallbackClubs.map((c, i) => ({ ...c, id: String(i), coach: null }))).map((club) => {
                    const hasCoach = 'coach' in club && club.coach !== null;

                    return (
                      <div
                        key={club.id || club.name}
                        className={`rounded-lg border p-4 transition-all ${
                          hasCoach
                            ? "bg-muted/30"
                            : "bg-card hover:border-accent hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold">{club.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Reserves: {club.reservesName || 'TBD'}
                            </div>
                          </div>
                          <div
                            className="w-8 h-8 rounded-md border flex-shrink-0"
                            style={{ backgroundColor: club.primaryColor || '#6b7280' }}
                            title="Team color (customizable)"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Coach:</span>
                          {hasCoach && club.coach ? (
                            <Badge variant="secondary" className="text-xs">
                              @{club.coach.displayName || "Coach"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-accent text-accent">
                              Vacant
                            </Badge>
                          )}
                        </div>

                        {!hasCoach && (
                          <Link href="https://discord.gg/jQ65xTRcRb" target="_blank" className="block mt-3">
                            <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                              <UserPlus className="h-3 w-3" />
                              Claim This Club
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Want to Join Sicko League?</CardTitle>
                <CardDescription>
                  We&apos;re looking for committed coaches who love AFL fantasy
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

                <div className="bg-primary/10 rounded-lg p-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Ready to Coach?</h4>
                  <p className="text-muted-foreground mb-4">
                    Join our Discord and introduce yourself to claim your club!
                  </p>
                  <Link href="https://discord.gg/jQ65xTRcRb" target="_blank">
                    <Button size="lg" className="gap-2">
                      <Users className="h-5 w-5" />
                      Join Discord & Sign Up
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Seniors Ladder */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {season ? `${season.year} Seniors` : "Seniors Ladder"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 px-0">
                  {seniorsStandings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 pr-2 pl-6 font-medium text-muted-foreground">#</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground">Club</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">P</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">W</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">L</th>
                            <th className="pb-2 pr-6 font-medium text-muted-foreground text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seniorsStandings.map((standing, index) => (
                            <tr key={standing.id} className={`border-b last:border-0 ${index < 4 ? 'bg-green-500/10' : ''}`}>
                              <td className="py-2 pr-2 pl-6">
                                <span className="font-semibold">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                <span
                                  className="px-2 py-1 rounded text-xs font-semibold"
                                  style={{
                                    backgroundColor: standing.club.primaryColor || '#666',
                                    color: standing.club.secondaryColor || '#fff'
                                  }}
                                >
                                  {standing.club.name}
                                </span>
                              </td>
                              <td className="py-2 pr-2 text-center text-muted-foreground">{standing.played}</td>
                              <td className="py-2 pr-2 text-center text-green-500">{standing.wins}</td>
                              <td className="py-2 pr-2 text-center text-red-500">{standing.losses}</td>
                              <td className="py-2 pr-6 text-right">{Number(standing.percentage).toFixed(1)}</td>
                            </tr>
                          ))}
                          {/* Pad to match reserves row count */}
                          {Array.from({ length: Math.max(0, reservesStandings.length - seniorsStandings.length) }).map((_, i) => (
                            <tr key={`pad-s-${i}`} className="border-b last:border-0">
                              <td className="py-2 pl-6" colSpan={6}>&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-6 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Season hasn&apos;t started yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reserves Ladder */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    {season ? `${season.year} Reserves` : "Reserves Ladder"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 px-0">
                  {reservesStandings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 pr-2 pl-6 font-medium text-muted-foreground">#</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground">Club</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">P</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">W</th>
                            <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">L</th>
                            <th className="pb-2 pr-6 font-medium text-muted-foreground text-right">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservesStandings.map((standing, index) => (
                            <tr key={standing.id} className={`border-b last:border-0 ${index < 4 ? 'bg-green-500/10' : ''}`}>
                              <td className="py-2 pr-2 pl-6">
                                <span className="font-semibold">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                <span
                                  className="px-2 py-1 rounded text-xs font-semibold"
                                  style={{
                                    backgroundColor: standing.club.primaryColor || '#666',
                                    color: standing.club.secondaryColor || '#fff'
                                  }}
                                >
                                  {standing.club.reservesName || standing.club.name}
                                </span>
                              </td>
                              <td className="py-2 pr-2 text-center text-muted-foreground">{standing.played}</td>
                              <td className="py-2 pr-2 text-center text-green-500">{standing.wins}</td>
                              <td className="py-2 pr-2 text-center text-red-500">{standing.losses}</td>
                              <td className="py-2 pr-6 text-right">{Number(standing.percentage).toFixed(1)}</td>
                            </tr>
                          ))}
                          {/* Pad to match seniors row count */}
                          {Array.from({ length: Math.max(0, seniorsStandings.length - reservesStandings.length) }).map((_, i) => (
                            <tr key={`pad-r-${i}`} className="border-b last:border-0">
                              <td className="py-2 pl-6" colSpan={6}>&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-6 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Season hasn&apos;t started yet</p>
                    </div>
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
