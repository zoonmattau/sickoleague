"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Squad } from "@prisma/client";

// Set captain or vice-captain for a squad (C or VC)
export async function setCaptain(
  contractId: string,
  squad: Squad,
  role: "captain" | "viceCaptain" | "none"
) {
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

  // Find the roster player for this contract
  const rosterPlayer = await prisma.rosterPlayer.findFirst({
    where: {
      contractId,
      clubId: coach.club.id,
      roundId: null,
      squad,
    },
  });

  if (!rosterPlayer) return { error: "Player not found in roster" };

  // If setting as captain or VC, clear the existing one first
  if (role === "captain") {
    // Clear existing captain in this squad
    await prisma.rosterPlayer.updateMany({
      where: {
        clubId: coach.club.id,
        roundId: null,
        squad,
        isCaptain: true,
      },
      data: { isCaptain: false },
    });
    // Set new captain
    await prisma.rosterPlayer.update({
      where: { id: rosterPlayer.id },
      data: { isCaptain: true, isViceCaptain: false },
    });
  } else if (role === "viceCaptain") {
    // Clear existing VC in this squad
    await prisma.rosterPlayer.updateMany({
      where: {
        clubId: coach.club.id,
        roundId: null,
        squad,
        isViceCaptain: true,
      },
      data: { isViceCaptain: false },
    });
    // Set new VC
    await prisma.rosterPlayer.update({
      where: { id: rosterPlayer.id },
      data: { isViceCaptain: true, isCaptain: false },
    });
  } else {
    // Remove captain/VC status
    await prisma.rosterPlayer.update({
      where: { id: rosterPlayer.id },
      data: { isCaptain: false, isViceCaptain: false },
    });
  }

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true };
}
