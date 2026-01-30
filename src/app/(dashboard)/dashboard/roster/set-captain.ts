"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Squad = "SENIORS" | "RESERVES";
type CaptainRole = "captain" | "viceCaptain" | "none";

// Check if a roster spot is "off-field" (bench or IL)
function isOffField(rosterSpot: string | null): boolean {
  if (!rosterSpot) return true;
  return rosterSpot.startsWith("BENCH") || rosterSpot.startsWith("IL");
}

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

  // Captain change restriction: can only change captain if current captain
  // is dropped (unassigned), benched, injured (IL), or traded (no longer on roster)
  if (role === "captain") {
    // Find current captain in this squad
    const currentCaptain = await prisma.rosterPlayer.findFirst({
      where: {
        clubId: coach.club.id,
        roundId: null,
        squad,
        isCaptain: true,
      },
    });

    // If there's a current captain and they're on-field, block the change
    // (unless we're setting the same player as captain, which is a no-op)
    if (currentCaptain && currentCaptain.id !== rosterPlayer.id) {
      if (!isOffField(currentCaptain.rosterSpot)) {
        return {
          error: "Cannot change captain while current captain is on field. Drop, bench, or injure them first.",
        };
      }
    }

    // Clear existing captain and set new one
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
    // Find current VC in this squad
    const currentVc = await prisma.rosterPlayer.findFirst({
      where: {
        clubId: coach.club.id,
        roundId: null,
        squad,
        isViceCaptain: true,
      },
    });

    // If there's a current VC and they're on-field, block the change
    if (currentVc && currentVc.id !== rosterPlayer.id) {
      if (!isOffField(currentVc.rosterSpot)) {
        return {
          error: "Cannot change vice captain while current VC is on field. Drop, bench, or injure them first.",
        };
      }
    }

    // Clear existing VC and set new one
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
    // Removing captain/VC status - only allowed if player is off-field
    if (!isOffField(rosterPlayer.rosterSpot)) {
      return {
        error: "Cannot remove captain/VC status from a player on field. Drop, bench, or injure them first.",
      };
    }
    await prisma.rosterPlayer.update({
      where: { id: rosterPlayer.id },
      data: { isCaptain: false, isViceCaptain: false },
    });
  }

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true };
}
