import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { isAdmin } from "@/lib/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userIsAdmin = isAdmin(user);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} isAdmin={userIsAdmin} />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
