import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { getFreeAgentStaff } from "../trades/actions";
import { StaffTab } from "../trades/staff-tab";

async function getMyClubId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
    include: { club: true },
  });

  return coach?.club?.id ?? null;
}

export default async function StaffPage() {
  const [staff, myClubId] = await Promise.all([
    getFreeAgentStaff(),
    getMyClubId(),
  ]);

  // Count my staff
  const myStaffCount = staff.filter(
    (s) => s.currentContract?.clubId === myClubId
  ).length;

  // Count available staff
  const availableCount = staff.filter((s) => !s.currentContract).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coaches & Staff</h1>
        <p className="text-muted-foreground">
          Sign coaches and list managers to gain bonuses
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Staff</CardDescription>
            <CardTitle className="text-2xl">{myStaffCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available</CardDescription>
            <CardTitle className="text-2xl text-green-600">{availableCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Staff</CardDescription>
            <CardTitle className="text-2xl">{staff.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coaches & List Managers</CardTitle>
          <CardDescription>
            Sign staff to gain scoring bonuses and contract discounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffTab staff={staff} myClubId={myClubId} />
        </CardContent>
      </Card>
    </div>
  );
}
