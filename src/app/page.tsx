import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sicko League</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6">
            AFL Fantasy League Management
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Manage your club with senior and reserve squads, navigate the salary cap,
            make trades, and compete for the premiership.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">
              Enter the League
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dual Squad System</CardTitle>
              <CardDescription>
                Manage both seniors and reserves teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Field 11 players in seniors (3 DEF, 4 MID, 1 RUC, 3 FWD) and
                8 in reserves. Promote and demote players between squads.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Cap</CardTitle>
              <CardDescription>
                750 point cap with contract management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sign players to contracts, offer extensions, manage your cap space,
                and earn bonuses for reserves ladder finishes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Home Field Advantage</CardTitle>
              <CardDescription>
                Dynamic HFA based on home performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build your fortress at home. HFA calculated from your last 10
                home games, with bonuses against rivals.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trading</CardTitle>
              <CardDescription>
                Trade players, picks, and salary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Execute trades involving players, coaching staff, draft picks,
                and salary. Retain salary on player trades.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Draft System</CardTitle>
              <CardDescription>
                Annual draft plus Rule 9 mid-season draft
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                10-round annual draft in reverse standings order. Rule 9 draft
                prevents stashing quality players in reserves.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Free Agency</CardTitle>
              <CardDescription>
                In-season and end of season free agency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sign free agents with competitive bidding. Top 25% earners are
                restricted free agents with matching rights.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>Sicko League - AFL Fantasy League Management</p>
          <p className="text-sm mt-2">
            <Link href="https://discord.gg/jQ65xTRcRb" className="hover:underline">
              Join the Discord
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
