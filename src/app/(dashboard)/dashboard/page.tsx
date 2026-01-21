import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          {user?.user_metadata?.full_name || user?.email}
        </p>
      </div>

      {/* Club Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary Cap</CardTitle>
            <Badge variant="outline">750</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--/750</div>
            <p className="text-xs text-muted-foreground">
              -- points remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roster Size</CardTitle>
            <Badge variant="outline">19-21</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--/21</div>
            <p className="text-xs text-muted-foreground">
              -- seniors, -- reserves
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seniors HFA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0</div>
            <p className="text-xs text-muted-foreground">
              Based on last 10 home games
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserves HFA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0</div>
            <p className="text-xs text-muted-foreground">
              Based on last 10 home games
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Match</CardTitle>
            <CardDescription>Next round fixture</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No upcoming matches scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest league activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Standings Preview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seniors Ladder</CardTitle>
            <CardDescription>Current season standings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Season not started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reserves Ladder</CardTitle>
            <CardDescription>Current season standings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Season not started</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
