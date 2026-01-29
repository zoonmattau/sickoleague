import { redirect } from "next/navigation";
import { getMyBoard } from "./actions";
import { BoardDashboard } from "./board-dashboard";
import prisma from "@/lib/prisma";

export default async function BoardPage() {
  const board = await getMyBoard();

  if (!board) {
    redirect("/dashboard");
  }

  // Get current season year
  const currentSeason = await prisma.season.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { year: "desc" },
  });

  const currentSeasonYear = currentSeason?.year ?? new Date().getFullYear();

  return (
    <div className="container mx-auto py-6">
      <BoardDashboard board={board} currentSeasonYear={currentSeasonYear} />
    </div>
  );
}
