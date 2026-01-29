"use client";

import { cn } from "@/lib/utils";
import { TrophyCase } from "./trophy-case";

interface BoardroomSceneProps {
  clubName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  trophies?: {
    season: { year: number };
    competition: string;
  }[];
  children?: React.ReactNode;
}

export function BoardroomScene({
  clubName,
  primaryColor,
  secondaryColor,
  logoUrl,
  trophies = [],
  children,
}: BoardroomSceneProps) {
  // Default colors if not provided
  const bgColor = primaryColor || "#1a1a2e";
  const accentColor = secondaryColor || "#e94560";

  return (
    <div
      className="relative w-full min-h-[500px] rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${bgColor}dd 0%, ${bgColor}aa 50%, ${bgColor}dd 100%)`,
      }}
    >
      {/* Wood paneling effect on sides */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 100px,
            rgba(139, 90, 43, 0.3) 100px,
            rgba(139, 90, 43, 0.3) 102px
          )`,
        }}
      />

      {/* Club logo watermark */}
      {logoUrl && (
        <div className="absolute top-4 right-4 opacity-20">
          <img
            src={logoUrl}
            alt={clubName}
            className="h-24 w-24 object-contain"
          />
        </div>
      )}

      {/* Trophy case on the left */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 max-w-[200px]">
        <TrophyCase trophies={trophies} clubName={clubName} />
      </div>

      {/* Club banner */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 px-8 py-2 rounded-b-lg shadow-lg"
        style={{
          background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}dd)`,
        }}
      >
        <h2
          className="font-bold text-lg tracking-wide"
          style={{
            color: bgColor,
            textShadow: "0 1px 2px rgba(255,255,255,0.3)",
          }}
        >
          {clubName}
        </h2>
      </div>

      {/* Conference table visualization */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32"
        style={{
          background: `linear-gradient(to bottom, #8b5a2b 0%, #654321 100%)`,
          borderRadius: "100px 100px 0 0 / 30px 30px 0 0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      />

      {/* Main content area */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[500px] p-8 pt-16">
        {children}
      </div>

      {/* Accent lines */}
      <div
        className="absolute bottom-32 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)`,
        }}
      />
    </div>
  );
}
