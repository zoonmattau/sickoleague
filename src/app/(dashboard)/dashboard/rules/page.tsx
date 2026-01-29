import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  DollarSign,
  Calendar,
  Trophy,
  ArrowLeftRight,
  FileText,
  Swords,
} from "lucide-react";

export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">League Rules</h1>
        <p className="text-muted-foreground">
          Official rules and regulations for the Sicko League
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roster Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Roster Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="squad-size">
                <AccordionTrigger>Squad Size</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Each club must maintain a roster of players across two squads:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Seniors:</strong> 11 on-field + 2 bench + 2 IL = 15 spots</li>
                    <li><strong>Reserves:</strong> 8 on-field = 8 spots</li>
                  </ul>
                  <p className="text-muted-foreground">Maximum 21 contracted players per club.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="positions">
                <AccordionTrigger>Positions</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Players must be placed in valid positions based on their eligibility:</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-600">DEF</Badge>
                      <span>Defenders (3 seniors, 2 reserves)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-600">MID</Badge>
                      <span>Midfielders (4 seniors, 3 reserves)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-600">RUC</Badge>
                      <span>Rucks (1 senior, 1 reserve)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500/20 text-orange-600">FWD</Badge>
                      <span>Forwards (3 seniors, 2 reserves)</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="bench-il">
                <AccordionTrigger>Bench & Injury List</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p><strong>Bench (2 spots):</strong> Any position eligible. Used as emergency replacements.</p>
                  <p><strong>Injury List (2 spots):</strong> For injured players only. Do not score points but don&apos;t count against active roster.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Salary Cap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Salary Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cap-amount">
                <AccordionTrigger>Cap Amount</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>The salary cap is <strong>$750k</strong> per season.</p>
                  <p>All contract values count against the cap for each year they are active.</p>
                  <p className="text-muted-foreground">Clubs over the cap cannot sign new players or make trades that increase their cap hit.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="contracts">
                <AccordionTrigger>Contract Types</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Standard:</strong> 1-4 year contracts at negotiated values</li>
                    <li><strong>Rookie:</strong> Minimum salary contracts for first-year players</li>
                    <li><strong>Extension:</strong> Added years to existing contracts</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="minimum">
                <AccordionTrigger>Minimum Salary</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Minimum contract value is <strong>$10k</strong> per season.</p>
                  <p>Rookie contracts are typically at minimum value for 2 years.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Season Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Season Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="regular-season">
                <AccordionTrigger>Regular Season</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>The regular season consists of <strong>18 rounds</strong>.</p>
                  <p>Each club plays each other club twice (home and away).</p>
                  <p>Points: <strong>Win = 4 pts</strong>, <strong>Draw = 2 pts</strong>, <strong>Loss = 0 pts</strong></p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="finals">
                <AccordionTrigger>Finals Series</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Top 4 teams qualify for finals.</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Week 1:</strong> 1st vs 2nd (Qualifying), 3rd vs 4th (Elimination)</li>
                    <li><strong>Week 2:</strong> Loser QF vs Winner EF (Preliminary)</li>
                    <li><strong>Week 3:</strong> Grand Final</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="lockout">
                <AccordionTrigger>Lockout Rules</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Lineups lock at the <strong>first bounce</strong> of each round.</p>
                  <p>Once locked, no roster changes can be made until the round completes.</p>
                  <p className="text-muted-foreground">Late scratches are handled automatically - bench players are elevated if available.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Scoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Scoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="player-scores">
                <AccordionTrigger>Player Scores</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Player scores are based on AFL Fantasy points from real AFL matches.</p>
                  <p>If a player doesn&apos;t play in the real AFL round, they score <strong>0 points</strong>.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="team-scores">
                <AccordionTrigger>Team Scores</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Team score = Sum of all on-field player scores.</p>
                  <p>Bench players only count if an on-field player scores 0 (auto-emergency).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="captaincy">
                <AccordionTrigger>Captaincy</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p><strong>Captain (C):</strong> Scores double points (2x multiplier)</p>
                  <p><strong>Vice-Captain (VC):</strong> Becomes captain if C scores 0</p>
                  <p>Each squad (Seniors/Reserves) has its own captain and vice-captain.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Trading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-orange-500" />
              Trading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="trade-window">
                <AccordionTrigger>Trade Window</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Trades can occur during the <strong>off-season trade period</strong> and <strong>mid-season trade deadline</strong>.</p>
                  <p>No trades are allowed during finals.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="trade-rules">
                <AccordionTrigger>Trade Rules</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Both clubs must remain under the salary cap after the trade</li>
                    <li>Trades can include players, draft picks, and future considerations</li>
                    <li>All trades require mutual agreement from both clubs</li>
                    <li>Trades are final once accepted - no take-backs</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="trade-block">
                <AccordionTrigger>Trade Block</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Clubs can place players on the <strong>trade block</strong> to signal availability.</p>
                  <p>Being on the trade block doesn&apos;t obligate a trade - it&apos;s just a signal to other clubs.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Draft */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-500" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="draft-order">
                <AccordionTrigger>Draft Order</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Draft order is determined by <strong>reverse ladder position</strong>.</p>
                  <p>The team that finishes last gets the first pick.</p>
                  <p className="text-muted-foreground">Draft picks can be traded, affecting the order.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="draft-rounds">
                <AccordionTrigger>Draft Rounds</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>The draft consists of <strong>3 rounds</strong>.</p>
                  <p>Each club gets one pick per round (unless traded).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rookie-contracts">
                <AccordionTrigger>Rookie Contracts</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Drafted players receive <strong>2-year rookie contracts</strong> at minimum salary.</p>
                  <p>Clubs can negotiate extensions after the first year.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Rivalries */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-red-500" />
              Rivalries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="official-rivals">
                <AccordionTrigger>Official Rivals</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Clubs become official rivals through:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Finals matchups:</strong> Meeting in finals creates automatic rivalry</li>
                    <li><strong>Coach nomination:</strong> Coaches can nominate one rival per season</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tension">
                <AccordionTrigger>Tension Score</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Tension builds between clubs based on:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Finals meetings (+5):</strong> Playing in finals</li>
                    <li><strong>Close games (+4):</strong> Matches with margin under 20 points</li>
                    <li><strong>Player movements (+2-6):</strong> Signing star players from other clubs</li>
                    <li><strong>Trades (+2-5):</strong> Direct trades, especially lopsided ones</li>
                    <li><strong>Ladder battles (+2-4):</strong> Fighting for same ladder positions</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">Tension decays over time - current season events matter most.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
