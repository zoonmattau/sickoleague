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
  UserPlus,
  Home,
  Briefcase,
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
                    <li><strong>Seniors:</strong> 11 on-field positions</li>
                    <li><strong>Reserves:</strong> 8 on-field positions</li>
                    <li><strong>Bench:</strong> 2 spots (neither seniors nor reserves)</li>
                    <li><strong>Injury List:</strong> 2 spots (neither seniors nor reserves)</li>
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
                      <Badge className="bg-blue-600 text-white">DEF</Badge>
                      <span>Defenders (3 seniors, 2 reserves)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white">MID</Badge>
                      <span>Midfielders (4 seniors, 3 reserves)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600 text-white">RUC</Badge>
                      <span>Rucks (1 senior, 1 reserve)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white">FWD</Badge>
                      <span>Forwards (3 seniors, 2 reserves)</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="bench-il">
                <AccordionTrigger>Bench & Injury List</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p><strong>Bench (2 spots):</strong> Any position eligible. Bench players do NOT score points - there is no emergency or auto-elevation.</p>
                  <p><strong>Injury List (2 spots):</strong> For injured players only. Do not score points.</p>
                  <p className="text-muted-foreground">Bench and IL spots are shared between squads - they are neither seniors nor reserves.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="reserves-eligibility">
                <AccordionTrigger>Reserves Finals Eligibility</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>To be eligible for a reserves finals roster, a player must play a <strong>majority of his games for the reserves squad</strong>.</p>
                  <p>If a player is tied in games played between seniors and reserves, he shall be eligible for the reserves.</p>
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
                  <p className="text-muted-foreground">Only on-field players score. Bench players never score - there is no emergency elevation.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="captaincy">
                <AccordionTrigger>Captaincy</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p><strong>Captain (C):</strong> Scores <strong>1.5x</strong> points</p>
                  <p><strong>Vice-Captain (VC):</strong> Scores <strong>1.25x</strong> points</p>
                  <p>Each squad (Seniors/Reserves) has its own captain and vice-captain.</p>
                  <p className="text-muted-foreground mt-2"><strong>Important:</strong> Captains can only be changed when rules allow - when they are dropped, benched, injured, or traded.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="team-scores">
                <AccordionTrigger>Team Scores</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Team score = Sum of all on-field player scores (with captain/VC multipliers applied).</p>
                  <p>Coach bonuses are added to the team score (see Staff section).</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Coaches & Staff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              Coaches & Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="assistant-coaches">
                <AccordionTrigger>Assistant Coaches</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Clubs can sign assistant coaches from AFL or state leagues (VFL, SANFL, WAFL, NTFL).</p>
                  <p><strong>Scoring Bonus:</strong> Coaches earn <strong>0.5x their real-life AFL team&apos;s margin</strong> as bonus points for your team.</p>
                  <p className="text-muted-foreground">Example: If your coach&apos;s AFL team wins by 40 points, you get +20 bonus points.</p>
                  <p className="text-muted-foreground">State league coaches provide half the bonus (0.25x margin).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="list-managers">
                <AccordionTrigger>List Managers</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>List managers save your club a <strong>percentage discount</strong> on player contracts based on their AFL team&apos;s ladder position.</p>
                  <p><strong>Formula:</strong> <code>ROUND((18 - ladder_position) / 3, 0)%</code></p>
                  <div className="mt-2 space-y-1">
                    <p className="text-muted-foreground">Examples:</p>
                    <ul className="list-disc list-inside ml-2 text-muted-foreground">
                      <li>1st place = 6% discount</li>
                      <li>5th place = 4% discount</li>
                      <li>10th place = 3% discount</li>
                      <li>18th place = 0% discount</li>
                    </ul>
                  </div>
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
                  <p className="text-muted-foreground">Staff contracts also count against the salary cap.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="contracts">
                <AccordionTrigger>Contract Types</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Standard:</strong> 1-4 year contracts at negotiated values</li>
                    <li><strong>Extension:</strong> Added years to existing contracts</li>
                    <li><strong>Reserve Squad:</strong> Players on reserve roster who haven&apos;t played a senior game this season for their current club are effectively free (no contract required)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="minimum">
                <AccordionTrigger>Minimum Salary</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Minimum contract value is calculated as:</p>
                  <p><strong>$1k per games remaining until end of season + $2k</strong></p>
                  <p className="text-muted-foreground">Example: If there are 10 games left, minimum = $10k + $2k = $12k</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="trading-cap">
                <AccordionTrigger>Trading & Cap Compliance</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Teams may go <strong>over the salary cap in future years</strong> when trading.</p>
                  <p className="text-muted-foreground">However, clubs must be cap compliant by <strong>opening day</strong> of that season.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Home Field Advantage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-teal-500" />
              Home Field Advantage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="hfa-calculation">
                <AccordionTrigger>HFA Calculation</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Home teams receive a <strong>Home Field Advantage (HFA)</strong> bonus added to their score.</p>
                  <p>HFA is calculated based on your recent home game performance.</p>
                  <p className="text-muted-foreground">The better you perform at home, the higher your HFA grows.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="hfa-caps">
                <AccordionTrigger>HFA Caps</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Seniors:</strong> Maximum 15 points HFA</li>
                    <li><strong>Reserves:</strong> Maximum 8 points HFA</li>
                  </ul>
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
                  <p>The regular season follows the real AFL season schedule.</p>
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
                  <p className="text-muted-foreground">Late scratches result in 0 points - bench players are NOT elevated.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Free Agency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              Free Agency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="free-agents">
                <AccordionTrigger>Free Agents</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Any player who is not currently contracted to a club is a <strong>Free Agent</strong>.</p>
                  <p>Free Agents can be signed at any time by any club.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="bidding">
                <AccordionTrigger>Bidding Process</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Once an offer is made to a Free Agent, other clubs have <strong>48 hours</strong> to make a counter offer.</p>
                  <p><strong>This time halves every time a new offer is made.</strong></p>
                  <p className="text-muted-foreground">48h → 24h → 12h → 6h → 3h → ...</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="reserve-contracts">
                <AccordionTrigger>Reserve Squad Contracts</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>You may offer a <strong>reserve squad contract</strong> to a free agent.</p>
                  <p>The first club to offer a reserve squad contract can offer <strong>$0 salary cap</strong>.</p>
                  <p>However, if another club offers <strong>any salary</strong> to that player, they take the lead.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* End of Season Free Agency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              End of Season Free Agency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="eos-period">
                <AccordionTrigger>Free Agency Period</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>End of Season Free Agency opens the <strong>day after the Grand Final</strong>.</p>
                  <p>End of Season Free Agency closes the <strong>day before the first game</strong> of the next season.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="eos-bidding">
                <AccordionTrigger>Bidding Rules</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Clubs may offer any Free Agent a contract, subject to salary cap compliance.</p>
                  <p>Once a Free Agent is offered a contract, other clubs have a <strong>seven (7) day period</strong> to make an offer of <strong>5% above the previous highest offer</strong>.</p>
                  <p>Each time a new club offers a contract, the decision time is <strong>halved</strong>.</p>
                  <p className="text-muted-foreground">If the end of free agency is within 7 days, the offer period is half the time to the end.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rfa">
                <AccordionTrigger>Restricted Free Agents (RFA)</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>The <strong>highest 25% of paid players</strong> in the previous season are RFAs.</p>
                  <p>This list is made public on day one of End of Season Free Agency.</p>
                  <p><strong>RFA Matching:</strong> Any free agency offer to an RFA can be matched <strong>+20%</strong> by their previous club.</p>
                  <p className="text-muted-foreground">If a non-RFA player receives an offer that would put them in the RFA salary range, they are treated as an RFA.</p>
                  <p className="text-muted-foreground">Teams have <strong>two days</strong> after the contract offer is accepted to match their RFA.</p>
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
              <AccordionItem value="trade-assets">
                <AccordionTrigger>Tradeable Assets</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>You can trade the following:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Players</strong> (with their contracts)</li>
                    <li><strong>Draft picks</strong> (up to 3 years in advance)</li>
                    <li><strong>Salary cap space</strong></li>
                    <li><strong>Coaches and staff</strong></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="trade-rules">
                <AccordionTrigger>Trade Rules</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li>All trades require mutual agreement from both clubs</li>
                    <li>Trades are final once accepted</li>
                    <li>No trades during finals</li>
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

        {/* Annual Draft */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-500" />
              Annual Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="draft-order">
                <AccordionTrigger>Draft Order</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Draft order is determined by <strong>reverse ladder position</strong>.</p>
                  <p>The team that finishes last gets the first pick.</p>
                  <p className="text-muted-foreground">Draft picks can be traded up to 3 years in advance.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="draft-rounds">
                <AccordionTrigger>Draft Rounds</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>The draft consists of <strong>20 rounds</strong>.</p>
                  <p>Each club gets one pick per round (unless traded).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="roster-requirement">
                <AccordionTrigger>Roster Requirement</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>You <strong>must have an open roster spot</strong> to draft a player.</p>
                  <p>If you don&apos;t have a spot, you automatically <strong>pass on all remaining picks</strong>.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Rule 9 Draft */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-rose-500" />
              Rule 9 Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="rule9-purpose">
                <AccordionTrigger>Purpose</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>The Rule 9 Draft gives players who are of <strong>senior team standard</strong> game time on senior teams.</p>
                  <p>This prevents clubs from stashing quality players in their reserve team.</p>
                  <p className="text-muted-foreground">Similar to the Rule 5 Draft in MLB.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rule9-timing">
                <AccordionTrigger>Timing & Order</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>The Rule 9 Draft takes place <strong>between Round 13 and Round 14</strong> of the current season.</p>
                  <p>Draft order is the <strong>reverse finishing order</strong> of the senior competition from the year prior.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rule9-eligibility">
                <AccordionTrigger>Player Eligibility</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Players eligible to be selected must:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Have played a <strong>majority of games for the reserves</strong> squad</li>
                    <li>Have a <strong>senior squad contract</strong></li>
                    <li><strong>Not</strong> have been a rookie in the current or prior year</li>
                    <li><strong>Not</strong> be on the Injury List</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rule9-requirements">
                <AccordionTrigger>Roster Requirements</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>Any player drafted in the Rule 9 Draft <strong>must remain on the senior squad or Injury List</strong> for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>The remainder of the current season</li>
                    <li>The entire next season</li>
                  </ul>
                  <p className="text-muted-foreground">Clubs must have an open spot on their list to draft a Rule 9 player.</p>
                  <p className="text-muted-foreground">Clubs may pass their picks.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rule9-release">
                <AccordionTrigger>Release Rules</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm">
                  <p>If a team releases a Rule 9 drafted player, the <strong>original team</strong> gets the option to re-sign that player.</p>
                  <p>If they accept, they must keep that player on the senior roster or Injury List for the remainder of the year.</p>
                  <p className="text-muted-foreground">If the original team wants to demote them to reserves, the player is immediately returned to their drafting club (if a spot is available). If not, a player must be released immediately.</p>
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
