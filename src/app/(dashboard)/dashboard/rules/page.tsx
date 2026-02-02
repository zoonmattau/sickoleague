"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold uppercase tracking-wide border-b-2 border-foreground pb-2 mb-4">
        {number}. {title}
      </h2>
      <div className="space-y-4 pl-4">
        {children}
      </div>
    </section>
  );
}

function SubSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">{number} {title}</h3>
      <div className="pl-4 text-sm space-y-2">
        {children}
      </div>
    </div>
  );
}

function Clause({ number, children, className }: { number: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm", className)}>
      <span className="text-muted-foreground mr-2">({number})</span>
      {children}
    </p>
  );
}

function DefinitionList({ items }: { items: { term: string; definition: string }[] }) {
  return (
    <dl className="grid gap-1 text-sm">
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr] gap-2">
          <dt className="font-medium">&quot;{item.term}&quot;</dt>
          <dd className="text-muted-foreground">means {item.definition}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Sicko League</h1>
        <p className="text-lg text-muted-foreground">Official Rules and Regulations</p>
        <p className="text-sm text-muted-foreground mt-2">Effective Season 2025</p>
      </div>

      {/* Table of Contents */}
      <nav className="mb-8 p-4 bg-muted/50 rounded-lg">
        <h2 className="font-bold mb-3 text-sm uppercase tracking-wide">Table of Contents</h2>
        <ol className="grid grid-cols-2 gap-1 text-sm">
          <li><a href="#roster" className="hover:underline">1. Roster Rules</a></li>
          <li><a href="#scoring" className="hover:underline">2. Scoring</a></li>
          <li><a href="#staff" className="hover:underline">3. Coaches & Staff</a></li>
          <li><a href="#salary" className="hover:underline">4. Salary Cap</a></li>
          <li><a href="#hfa" className="hover:underline">5. Home Field Advantage</a></li>
          <li><a href="#season" className="hover:underline">6. Season Structure</a></li>
          <li><a href="#freeagency" className="hover:underline">7. Free Agency</a></li>
          <li><a href="#eosfreeagency" className="hover:underline">8. End of Season Free Agency</a></li>
          <li><a href="#rule9" className="hover:underline">9. Rule 9 Draft</a></li>
          <li><a href="#trading" className="hover:underline">10. Trading</a></li>
          <li><a href="#draft" className="hover:underline">11. Annual Draft</a></li>
          <li><a href="#rivalries" className="hover:underline">12. Rivalries</a></li>
        </ol>
      </nav>

      {/* 1. ROSTER RULES */}
      <Section number="1" title="ROSTER RULES">
        <div id="roster" className="scroll-mt-20" />

        <SubSection number="1.1" title="Squad Composition">
          <Clause number="a">
            Each Club shall maintain a roster not exceeding twenty-one (21) contracted players.
          </Clause>
          <Clause number="b">
            The roster shall be divided as follows:
          </Clause>
          <div className="pl-8 space-y-1 text-sm">
            <p>(i) <strong>Seniors Squad:</strong> Eleven (11) on-field positions;</p>
            <p>(ii) <strong>Reserves Squad:</strong> Eight (8) on-field positions;</p>
            <p>(iii) <strong>Bench:</strong> Two (2) positions, shared between squads;</p>
            <p>(iv) <strong>Injury List:</strong> Two (2) positions, shared between squads.</p>
          </div>
        </SubSection>

        <SubSection number="1.2" title="Positional Requirements">
          <Clause number="a">
            Players must be assigned to positions for which they hold eligibility. The positions are:
          </Clause>
          <div className="pl-8 my-3 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600 text-white font-mono">DEF</Badge>
              <span>Defender &mdash; 3 seniors, 2 reserves</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white font-mono">MID</Badge>
              <span>Midfielder &mdash; 4 seniors, 3 reserves</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500 text-black font-mono">RUC</Badge>
              <span>Ruck &mdash; 1 senior, 1 reserve</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white font-mono">FWD</Badge>
              <span>Forward &mdash; 3 seniors, 2 reserves</span>
            </div>
          </div>
          <Clause number="b">
            A player holding multiple position eligibilities may be assigned to any one of their eligible positions.
          </Clause>
        </SubSection>

        <SubSection number="1.3" title="Bench">
          <Clause number="a">
            Players on the Bench shall not score points under any circumstances.
          </Clause>
          <Clause number="b">
            There shall be no emergency elevation or automatic substitution from the Bench.
          </Clause>
          <Clause number="c">
            Any position may use the Bench.
          </Clause>
        </SubSection>

        <SubSection number="1.4" title="Injury List">
          <Clause number="a">
            Players may be placed on the Injury List (&quot;IL&quot;) only if they are listed as unavailable for selection on the official AFL website.
          </Clause>
          <Clause number="b">
            A player may not be placed on the IL if they played in the prior round, unless they are subsequently injured and listed on the AFL website.
          </Clause>
          <Clause number="c">
            Players on the IL shall not score points.
          </Clause>
          <Clause number="d">
            Any position may use the IL.
          </Clause>
        </SubSection>

        <SubSection number="1.5" title="Reserves Finals Eligibility">
          <Clause number="a">
            To be eligible for a Reserves Finals roster, a player must have played a majority of their games for the Reserves Squad during that season.
          </Clause>
          <Clause number="b">
            Where a player has equal games played for both squads, they shall be eligible for the Reserves.
          </Clause>
        </SubSection>
      </Section>

      {/* 2. SCORING */}
      <Section number="2" title="SCORING">
        <div id="scoring" className="scroll-mt-20" />

        <SubSection number="2.1" title="Player Scores">
          <Clause number="a">
            Player scores shall be determined by AFL Fantasy points earned in real AFL matches.
          </Clause>
          <Clause number="b">
            A player who does not participate in a real AFL match during a round shall score zero (0) points.
          </Clause>
          <Clause number="c">
            Only players assigned to on-field positions shall score points. Bench and Injury List players score zero (0) points regardless of AFL participation.
          </Clause>
        </SubSection>

        <SubSection number="2.2" title="Captaincy">
          <Clause number="a">
            Each squad shall designate one (1) Captain and one (1) Vice-Captain.
          </Clause>
          <Clause number="b">
            The Captain&apos;s score shall be multiplied by <strong>1.5</strong> (one and one-half).
          </Clause>
          <Clause number="c">
            The Vice-Captain&apos;s score shall be multiplied by <strong>1.25</strong> (one and one-quarter).
          </Clause>
          <Clause number="d">
            A Captain or Vice-Captain may only be changed when the current holder is:
          </Clause>
          <div className="pl-8 space-y-1 text-sm">
            <p>(i) Dropped from the on-field roster;</p>
            <p>(ii) Placed on the Bench;</p>
            <p>(iii) Placed on the Injury List; or</p>
            <p>(iv) Traded to another Club.</p>
          </div>
        </SubSection>

        <SubSection number="2.3" title="Team Score Calculation">
          <Clause number="a">
            A team&apos;s score for a round shall be calculated as follows:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded font-mono text-sm">
            Team Score = Sum of On-Field Player Scores + Captain Bonus + Vice-Captain Bonus + Coach Bonus + HFA (if home)
          </div>
        </SubSection>
      </Section>

      {/* 3. COACHES & STAFF */}
      <Section number="3" title="COACHES & STAFF">
        <div id="staff" className="scroll-mt-20" />

        <SubSection number="3.1" title="Assistant Coaches">
          <Clause number="a">
            Each Club shall appoint real-life AFL or State League (VFL, SANFL, WAFL, NTFL) coaches to serve as their Assistant Coaches.
          </Clause>
          <Clause number="b">
            Clubs must appoint a separate Assistant Coach for their Seniors squad and their Reserves squad. The same coach cannot serve both squads.
          </Clause>
          <Clause number="c">
            Once appointed, Assistant Coaches cannot be changed during the season. Coaches may only be replaced at the conclusion of each season.
          </Clause>
          <Clause number="d">
            Assistant Coaches provide a scoring bonus based on their real-life AFL team&apos;s performance:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded font-mono text-sm space-y-1">
            <p>AFL Coach Bonus = AFL Team Match Margin &times; 0.5</p>
            <p>State League Coach Bonus = AFL Team Match Margin &times; 0.25</p>
          </div>
          <Clause number="e">
            Example: If an AFL coach&apos;s team wins by 40 points, the bonus is +20 points (40 &times; 0.5). If they lose by 40 points, the penalty is -20 points. State League coaches earn half this rate.
          </Clause>
        </SubSection>

        <SubSection number="3.2" title="List Managers">
          <Clause number="a">
            List Managers provide a percentage discount on all player contract negotiations.
          </Clause>
          <Clause number="b">
            The discount percentage is calculated based on the List Manager&apos;s AFL team ladder position:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded font-mono text-sm">
            Discount % = ROUND((18 - Ladder Position) &divide; 3, 0)
          </div>
          <Clause number="c">
            Examples of discount by ladder position:
          </Clause>
          <div className="pl-8 grid grid-cols-4 gap-2 text-sm">
            <span>1st: 6%</span>
            <span>5th: 4%</span>
            <span>10th: 3%</span>
            <span>18th: 0%</span>
          </div>
        </SubSection>

        <SubSection number="3.3" title="Staff Contracts">
          <Clause number="a">
            Staff contracts count against the Club&apos;s salary cap.
          </Clause>
          <Clause number="b">
            Staff may be traded between Clubs subject to mutual agreement.
          </Clause>
        </SubSection>
      </Section>

      {/* 4. SALARY CAP */}
      <Section number="4" title="SALARY CAP">
        <div id="salary" className="scroll-mt-20" />

        <SubSection number="4.1" title="Cap Amount">
          <Clause number="a">
            The salary cap shall be <strong>$750,000</strong> per season.
          </Clause>
          <Clause number="b">
            All active contract values for players and staff count against the cap for each year of their term.
          </Clause>
        </SubSection>

        <SubSection number="4.2" title="Contract Types">
          <Clause number="a">
            <strong>Standard Contract:</strong> A contract at negotiated annual values. There is no rule-imposed limit on contract length.
          </Clause>
          <Clause number="b">
            <strong>Reserve Squad Contract:</strong> Players on the Reserve roster who have not played a Senior game for their current Club in the current season may be signed for $0 salary.
          </Clause>
        </SubSection>

        <SubSection number="4.3" title="Contract Extensions">
          <Clause number="a">
            To be offered a contract extension, a player must have played five (5) games in the AFL that year.
          </Clause>
          <Clause number="b">
            Extensions may only be offered in the final year of a player&apos;s current contract.
          </Clause>
          <Clause number="c">
            Extensions may be offered at any time after the eligibility requirement is met, until the first game of the next season.
          </Clause>
          <Clause number="d">
            The base cost of an extension is calculated as:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded font-mono text-sm">
            Base Cost = FLOOR(Season Points Average) &divide; 2
          </div>
          <Clause number="e">
            Example: A player averaging 96.33 points rounds down to 96, divided by 2 = $48k per year.
          </Clause>
          <Clause number="f">
            Long-term contracts incur a 10% year-on-year increase (rounded down). This determines the total contract cost.
          </Clause>
          <Clause number="g">
            Clubs may structure long-term contracts freely, provided each year&apos;s value is not more than 50% above or below the previous year.
          </Clause>
          <Clause number="h">
            Contract extensions may be offered for up to ten (10) years.
          </Clause>
          <Clause number="i">
            Once an extension is offered, other Clubs have seven (7) days to submit a competing offer of at least 20% higher total value. The decision period halves with each new offer.
          </Clause>
          <Clause number="j">
            Offers may only be made if the offering Club will remain salary cap compliant as of the next season.
          </Clause>
          <Clause number="k">
            Offers to players may not be withdrawn.
          </Clause>
          <Clause number="l">
            If a Club has multiple outstanding offers, the total committed salary (assuming all acceptances) must not exceed the next year&apos;s salary cap.
          </Clause>
        </SubSection>

        <SubSection number="4.4" title="Minimum Salary">
          <Clause number="a">
            The minimum contract value shall be calculated as:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded font-mono text-sm">
            Minimum = (Games Remaining &times; $1,000) + $2,000
          </div>
          <Clause number="b">
            Example: With 10 games remaining, minimum salary = (10 &times; $1,000) + $2,000 = $12,000.
          </Clause>
        </SubSection>

        <SubSection number="4.5" title="Cap Compliance">
          <Clause number="a">
            Clubs may exceed the salary cap in future years when executing trades.
          </Clause>
          <Clause number="b">
            However, all Clubs must be cap compliant by Opening Day of each season.
          </Clause>
        </SubSection>
      </Section>

      {/* 5. HOME FIELD ADVANTAGE */}
      <Section number="5" title="HOME FIELD ADVANTAGE">
        <div id="hfa" className="scroll-mt-20" />

        <SubSection number="5.1" title="Definition">
          <Clause number="a">
            Home Field Advantage (&quot;HFA&quot;) is a bonus added to the home team&apos;s score in each match.
          </Clause>
          <Clause number="b">
            HFA reflects a Club&apos;s historical performance advantage when playing at home, influenced by venue quality and market size.
          </Clause>
        </SubSection>

        <SubSection number="5.2" title="Calculation Components">
          <Clause number="a">
            HFA is calculated using the following formula:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded font-mono text-xs space-y-1">
            <p>HFA = (Base Performance + Venue Bonus + Market Bonus) &times; Competition Multiplier</p>
          </div>

          <Clause number="b">
            <strong>Base Performance:</strong> Calculated from the Club&apos;s last ten (10) home matches:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded text-sm space-y-1">
            <p>(i) Home wins: Full margin added (e.g., win by 30 = +30)</p>
            <p>(ii) Home losses: Half margin subtracted (e.g., loss by 40 = -20)</p>
            <p>(iii) Base Performance = Average of all ten results</p>
          </div>

          <Clause number="c">
            <strong>Venue Bonus:</strong> Based on stadium capacity classification:
          </Clause>
          <div className="pl-8 my-2 text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Venue Class</th>
                  <th className="text-left py-1">Capacity</th>
                  <th className="text-right py-1">Bonus</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr><td>Elite</td><td>80,000+</td><td className="text-right">+3</td></tr>
                <tr><td>Major</td><td>40,000-79,999</td><td className="text-right">+2</td></tr>
                <tr><td>Standard</td><td>20,000-39,999</td><td className="text-right">+1</td></tr>
                <tr><td>Boutique</td><td>Under 20,000</td><td className="text-right">+0</td></tr>
              </tbody>
            </table>
          </div>

          <Clause number="d">
            <strong>Market Size Bonus:</strong> Based on the Club&apos;s home city population:
          </Clause>
          <div className="pl-8 my-2 text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Market Size</th>
                  <th className="text-right py-1">Appeal Bonus</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr><td>Major (dual-team cities)</td><td className="text-right">+15%</td></tr>
                <tr><td>Large</td><td className="text-right">+10%</td></tr>
                <tr><td>Medium</td><td className="text-right">+5%</td></tr>
                <tr><td>Small</td><td className="text-right">+0%</td></tr>
              </tbody>
            </table>
          </div>

          <Clause number="e">
            <strong>Competition Multiplier:</strong>
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded text-sm space-y-1">
            <p>(i) Seniors: 1.0 (full value)</p>
            <p>(ii) Reserves: 0.6 (60% of calculated value)</p>
          </div>
        </SubSection>

        <SubSection number="5.3" title="Maximum Values">
          <Clause number="a">
            The maximum HFA values are:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded text-sm space-y-1">
            <p>(i) <strong>Seniors:</strong> Fifty (50) points maximum</p>
            <p>(ii) <strong>Reserves:</strong> Thirty (30) points maximum</p>
          </div>
          <Clause number="b">
            HFA values shall be capped at these maximums regardless of calculated value.
          </Clause>
        </SubSection>

        <SubSection number="5.4" title="Transparency">
          <Clause number="a">
            All HFA calculations are publicly visible to ensure fairness.
          </Clause>
          <Clause number="b">
            Each Club&apos;s current HFA value and calculation breakdown can be viewed on their Club page.
          </Clause>
        </SubSection>
      </Section>

      {/* 6. SEASON STRUCTURE */}
      <Section number="6" title="SEASON STRUCTURE">
        <div id="season" className="scroll-mt-20" />

        <SubSection number="6.1" title="Competition Structure">
          <Clause number="a">
            The Sicko League operates two (2) parallel competitions: Seniors and Reserves.
          </Clause>
          <Clause number="b">
            Both competitions follow identical structures, schedules, and rules as outlined in this section.
          </Clause>
          <Clause number="c">
            Each competition maintains separate ladders, finals series, and premierships.
          </Clause>
        </SubSection>

        <SubSection number="6.2" title="Regular Season">
          <Clause number="a">
            The regular season shall follow the real AFL season schedule.
          </Clause>
          <Clause number="b">
            Premiership points shall be awarded as follows:
          </Clause>
          <div className="pl-8 space-y-1 text-sm">
            <p>(i) Win: Four (4) points</p>
            <p>(ii) Draw: Two (2) points</p>
            <p>(iii) Loss: Zero (0) points</p>
          </div>
        </SubSection>

        <SubSection number="6.3" title="Finals Series">
          <Clause number="a">
            The top four (4) teams on the ladder shall qualify for finals in each competition.
          </Clause>
          <Clause number="b">
            The finals series shall proceed as follows for both Seniors and Reserves:
          </Clause>
          <div className="pl-8 space-y-1 text-sm">
            <p>(i) <strong>Week 1:</strong> 1st vs 2nd (Qualifying Final); 3rd vs 4th (Elimination Final)</p>
            <p>(ii) <strong>Week 2:</strong> Loser of Qualifying Final vs Winner of Elimination Final (Preliminary Final)</p>
            <p>(iii) <strong>Week 3:</strong> Grand Final</p>
          </div>
        </SubSection>

        <SubSection number="6.4" title="Lockout">
          <Clause number="a">
            Lineups shall lock at the first bounce of each round.
          </Clause>
          <Clause number="b">
            Once locked, no roster changes may be made until the round is complete.
          </Clause>
          <Clause number="c">
            Late scratches shall result in zero (0) points &mdash; bench players are NOT elevated.
          </Clause>
        </SubSection>
      </Section>

      {/* 7. FREE AGENCY */}
      <Section number="7" title="FREE AGENCY">
        <div id="freeagency" className="scroll-mt-20" />

        <SubSection number="7.1" title="Definition">
          <Clause number="a">
            A &quot;Free Agent&quot; is any player not currently under contract with a Club.
          </Clause>
          <Clause number="b">
            Free Agents may be signed by any Club at any time, subject to salary cap compliance.
          </Clause>
        </SubSection>

        <SubSection number="7.2" title="Bidding Process">
          <Clause number="a">
            When an offer is made to a Free Agent, other Clubs shall have forty-eight (48) hours to submit a counter-offer.
          </Clause>
          <Clause number="b">
            Each subsequent offer shall halve the decision period:
          </Clause>
          <div className="pl-8 my-2 font-mono text-sm">
            48h &rarr; 24h &rarr; 12h &rarr; 6h &rarr; 3h &rarr; ...
          </div>
          <Clause number="c">
            The player shall sign with the Club offering the highest total contract value when the timer expires.
          </Clause>
        </SubSection>

        <SubSection number="7.3" title="Reserve Squad Contracts">
          <Clause number="a">
            A Club may offer a Reserve Squad Contract to any Free Agent.
          </Clause>
          <Clause number="b">
            The first Club to offer a Reserve Squad Contract may do so at $0 salary.
          </Clause>
          <Clause number="c">
            If any other Club offers a salaried contract, that offer shall take precedence.
          </Clause>
        </SubSection>
      </Section>

      {/* 8. END OF SEASON FREE AGENCY */}
      <Section number="8" title="END OF SEASON FREE AGENCY">
        <div id="eosfreeagency" className="scroll-mt-20" />

        <SubSection number="8.1" title="Period">
          <Clause number="a">
            End of Season Free Agency shall commence the day after the Grand Final.
          </Clause>
          <Clause number="b">
            End of Season Free Agency shall conclude the day before the first match of the following season.
          </Clause>
        </SubSection>

        <SubSection number="8.2" title="Bidding Rules">
          <Clause number="a">
            Once a Free Agent receives a contract offer, other Clubs shall have seven (7) days to submit a counter-offer.
          </Clause>
          <Clause number="b">
            Counter-offers must exceed the current highest offer by at least five percent (5%).
          </Clause>
          <Clause number="c">
            Each new offer shall halve the decision period.
          </Clause>
          <Clause number="d">
            If the end of the free agency period falls within seven (7) days, the offer period shall be half the remaining time.
          </Clause>
        </SubSection>

        <SubSection number="8.3" title="Restricted Free Agents">
          <Clause number="a">
            The highest paid twenty-five percent (25%) of players in the previous season shall be designated as Restricted Free Agents (&quot;RFA&quot;).
          </Clause>
          <Clause number="b">
            The RFA list shall be published on the first day of End of Season Free Agency.
          </Clause>
          <Clause number="c">
            When an RFA accepts an offer from another Club, the RFA&apos;s previous Club may match the offer plus twenty percent (+20%) to retain the player.
          </Clause>
          <Clause number="d">
            Previous Clubs have two (2) days after contract acceptance to exercise the matching right.
          </Clause>
          <Clause number="e">
            If a non-RFA player receives an offer that would place them in the RFA salary range, they shall be treated as an RFA.
          </Clause>
        </SubSection>
      </Section>

      {/* 9. RULE 9 DRAFT */}
      <Section number="9" title="RULE 9 DRAFT">
        <div id="rule9" className="scroll-mt-20" />

        <SubSection number="9.1" title="Purpose">
          <Clause number="a">
            The Rule 9 Draft ensures players of senior team standard receive appropriate playing time.
          </Clause>
          <Clause number="b">
            This provision prevents Clubs from stockpiling quality players in their Reserve squad.
          </Clause>
        </SubSection>

        <SubSection number="9.2" title="Timing">
          <Clause number="a">
            The Rule 9 Draft shall take place between Round 13 and Round 14 of the current season.
          </Clause>
          <Clause number="b">
            Draft order shall be the reverse finishing order of the Senior competition from the prior season.
          </Clause>
        </SubSection>

        <SubSection number="9.3" title="Player Eligibility">
          <Clause number="a">
            A player is eligible for the Rule 9 Draft if they meet ALL of the following criteria:
          </Clause>
          <div className="pl-8 space-y-1 text-sm">
            <p>(i) Has played a majority of games for the Reserves squad in the current season;</p>
            <p>(ii) Holds a Senior squad contract;</p>
            <p>(iii) Was not a rookie in the current or prior season;</p>
            <p>(iv) Is not currently on the Injury List.</p>
          </div>
        </SubSection>

        <SubSection number="9.4" title="Post-Draft Requirements">
          <Clause number="a">
            Any player selected in the Rule 9 Draft must remain on the Senior squad or Injury List for:
          </Clause>
          <div className="pl-8 space-y-1 text-sm">
            <p>(i) The remainder of the current season; and</p>
            <p>(ii) The entirety of the following season.</p>
          </div>
          <Clause number="b">
            Clubs must have an open roster spot to select a player.
          </Clause>
          <Clause number="c">
            Clubs may pass on any or all of their picks.
          </Clause>
        </SubSection>

        <SubSection number="9.5" title="Release Provisions">
          <Clause number="a">
            If a Club releases a player obtained through the Rule 9 Draft, the player&apos;s original Club has the first right to re-sign them.
          </Clause>
          <Clause number="b">
            If the original Club exercises this right, they must keep the player on their Senior roster or Injury List for the remainder of the requirement period.
          </Clause>
          <Clause number="c">
            If the original Club wishes to demote the player to Reserves, the player shall immediately be returned to the drafting Club (roster permitting), or the drafting Club must release a player to accommodate them.
          </Clause>
        </SubSection>
      </Section>

      {/* 10. TRADING */}
      <Section number="10" title="TRADING">
        <div id="trading" className="scroll-mt-20" />

        <SubSection number="10.1" title="Tradeable Assets">
          <Clause number="a">
            The following assets may be traded between Clubs:
          </Clause>
          <div className="pl-8 space-y-1 text-sm">
            <p>(i) Players (with their contracts);</p>
            <p>(ii) Draft picks (up to three years in advance);</p>
            <p>(iii) Salary cap space;</p>
            <p>(iv) Coaches and staff.</p>
          </div>
        </SubSection>

        <SubSection number="10.2" title="Trade Execution">
          <Clause number="a">
            All trades require mutual agreement from both participating Clubs.
          </Clause>
          <Clause number="b">
            Trades are final upon acceptance and cannot be reversed.
          </Clause>
          <Clause number="c">
            No trades shall be permitted during the Finals series.
          </Clause>
        </SubSection>

        <SubSection number="10.3" title="Trade Block">
          <Clause number="a">
            Clubs may place players on the Trade Block to signal availability.
          </Clause>
          <Clause number="b">
            Placement on the Trade Block does not obligate the Club to accept any offer.
          </Clause>
        </SubSection>
      </Section>

      {/* 11. ANNUAL DRAFT */}
      <Section number="11" title="ANNUAL DRAFT">
        <div id="draft" className="scroll-mt-20" />

        <SubSection number="11.1" title="Draft Order">
          <Clause number="a">
            Draft order shall be determined by reverse ladder position.
          </Clause>
          <Clause number="b">
            The Club finishing last on the ladder shall receive the first pick.
          </Clause>
          <Clause number="c">
            Draft picks may be traded up to three (3) years in advance.
          </Clause>
        </SubSection>

        <SubSection number="11.2" title="Draft Structure">
          <Clause number="a">
            The draft shall consist of twenty (20) rounds.
          </Clause>
          <Clause number="b">
            Each Club receives one (1) pick per round unless that pick has been traded.
          </Clause>
        </SubSection>

        <SubSection number="11.3" title="Roster Requirements">
          <Clause number="a">
            A Club must have an open roster spot to select a player.
          </Clause>
          <Clause number="b">
            If a Club has no available roster spots, they shall automatically pass on all remaining picks.
          </Clause>
        </SubSection>
      </Section>

      {/* 12. RIVALRIES */}
      <Section number="12" title="RIVALRIES">
        <div id="rivalries" className="scroll-mt-20" />

        <SubSection number="12.1" title="Natural Formation">
          <Clause number="a">
            Rivalries are not declared or nominated &mdash; they form organically through competitive tension over time.
          </Clause>
          <Clause number="b">
            Clubs sharing the same home city are considered natural rivals from inception.
          </Clause>
          <Clause number="c">
            When the tension score between two Clubs reaches a sufficient threshold, they become official rivals.
          </Clause>
        </SubSection>

        <SubSection number="12.2" title="Tension Score">
          <Clause number="a">
            Tension between Clubs accumulates based on the following events:
          </Clause>
          <div className="pl-8 my-2 text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Event</th>
                  <th className="text-right py-1">Points</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr><td>Finals meeting</td><td className="text-right">+5 to +6</td></tr>
                <tr><td>Close game (margin under 20)</td><td className="text-right">+3 to +4</td></tr>
                <tr><td>Star player signings from rival</td><td className="text-right">+2 to +6</td></tr>
                <tr><td>Direct trades between Clubs</td><td className="text-right">+2 to +5</td></tr>
                <tr><td>Ladder position battles</td><td className="text-right">+2 to +4</td></tr>
              </tbody>
            </table>
          </div>
          <Clause number="b">
            Tension decays over time, with current season events weighted most heavily.
          </Clause>
          <Clause number="c">
            Historical events carry progressively less weight:
          </Clause>
          <div className="pl-8 my-2 p-3 bg-muted/50 rounded text-sm space-y-1">
            <p>(i) Current season: 100% weight</p>
            <p>(ii) Last season: 60% weight</p>
            <p>(iii) Two seasons ago: 30% weight</p>
            <p>(iv) Older: 10% weight</p>
          </div>
        </SubSection>

        <SubSection number="12.3" title="Rivalry Effects">
          <Clause number="a">
            Matches against official rivals are marked as &quot;Rivalry Matches&quot; and may carry additional tension bonuses.
          </Clause>
          <Clause number="b">
            Rivalry status is reviewed at the end of each season and may fade if tension drops below the threshold.
          </Clause>
        </SubSection>
      </Section>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <p>These rules are subject to amendment by the Commissioner.</p>
        <p className="mt-1">Last updated: Season 2025</p>
      </div>
    </div>
  );
}
