"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlayerPortraitProps {
  name: string;
  photoUrl?: string | null;
  position?: string;
  role?: string;
  aflTeam?: string | null;
  mood: number;
  emotion?: string;
}

export function PlayerPortrait({
  name,
  photoUrl,
  position,
  role,
  aflTeam,
  mood,
  emotion,
}: PlayerPortraitProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Mood ring color
  const moodColor =
    mood >= 70
      ? "ring-green-500"
      : mood >= 40
      ? "ring-yellow-500"
      : "ring-red-500";

  // Emotion-based glow effect
  const emotionGlow = {
    happy: "shadow-green-500/30",
    excited: "shadow-green-500/40",
    interested: "shadow-blue-500/30",
    grateful: "shadow-green-500/30",
    thoughtful: "shadow-blue-500/20",
    skeptical: "shadow-yellow-500/30",
    concerned: "shadow-yellow-500/30",
    disappointed: "shadow-orange-500/30",
    frustrated: "shadow-red-500/30",
    offended: "shadow-red-500/40",
    neutral: "shadow-gray-500/20",
  };

  const glowClass = emotion
    ? emotionGlow[emotion as keyof typeof emotionGlow] || emotionGlow.neutral
    : emotionGlow.neutral;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn("relative rounded-full ring-4 transition-all", moodColor)}>
        <Avatar className={cn("h-32 w-32 shadow-lg", glowClass)}>
          <AvatarImage src={photoUrl ?? undefined} alt={name} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>

        {/* Mood indicator dot */}
        <div
          className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-background",
            mood >= 70 ? "bg-green-500" : mood >= 40 ? "bg-yellow-500" : "bg-red-500"
          )}
        />
      </div>

      <div className="text-center">
        <h3 className="font-semibold text-lg">{name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          {position && (
            <Badge variant="secondary" className="text-xs">
              {position}
            </Badge>
          )}
          {role && (
            <Badge variant="secondary" className="text-xs">
              {role.replace(/_/g, " ")}
            </Badge>
          )}
          {aflTeam && (
            <Badge variant="outline" className="text-xs">
              {aflTeam}
            </Badge>
          )}
        </div>
        {emotion && (
          <p className="text-sm text-muted-foreground mt-2 capitalize italic">
            Feeling {emotion}
          </p>
        )}
      </div>
    </div>
  );
}
