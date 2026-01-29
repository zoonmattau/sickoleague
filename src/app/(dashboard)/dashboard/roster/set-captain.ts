"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Squad = "SENIORS" | "RESERVES";
type CaptainRole = "captain" | "viceCaptain" | "none";

export async function setCaptainAction(
  contractId: string,
  squad: Squad,
  role: CaptainRole
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [
        { discordId: user.id },
        { email: user.email ?? "" },
      ],
    },
    include: { club: true },
  });

  if (!coach?.club) return { error: "No club found" };

  const rosterPlayer = await prisma.rosterPlayer.findFirst({
    where: {
      contractId,
      clubId: coach.club.id,
      roundId: null,
      squad,
    },
  });

  if (!rosterPlayer) return { error: "Player not found in roster" };

  if (role === "captain") {
    await prisma.rosterPlayer.updateMany({
      where: {
        clubId: coach.club.id,
        roundId: null,
        squad,
        isCaptain: true,
      },
      data: { isCaptain: false },
    });
    await prisma.rosterPlayer.update({
      where: { id: rosterPlayer.id },
      data: { isCaptain: true, isViceCaptain: false },
    });
  } else if (role === "viceCaptain") {
    await prisma.rosterPlayer.updateMany({
      where: {
        clubId: coach.club.id,
        roundId: null,
        squad,
        isViceCaptain: true,
      },
      data: { isViceCaptain: false },
    });
    await prisma.rosterPlayer.update({
      where: { id: rosterPlayer.id },
      data: { isViceCaptain: true, isCaptain: false },
    });
  } else {
    await prisma.rosterPlayer.update({
      where: { id: rosterPlayer.id },
      data: { isCaptain: false, isViceCaptain: false },
    });
  }

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true };
}
