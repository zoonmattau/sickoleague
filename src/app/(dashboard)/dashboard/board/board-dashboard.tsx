"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoalCard } from "@/components/board/goal-card";
import { ConfidenceMeter } from "@/components/board/confidence-meter";
import { MeetingTimeline } from "@/components/board/meeting-timeline";
import { createBoardMeeting } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface BoardDashboardProps {
  board: {
    id: string;
    boardType: string;
    toleranceRating: number;
    goals: {
      id: string;
      goalType: string;
      priority: string;
      targetValue?: number | null;
      currentValue?: number | null;
      isAchieved: boolean;
      competition?: string | null;
      season: { year: number };
    }[];
    meetings: {
      id: string;
      meetingType: string;
      status: string;
      outcome?: string | null;
      confidenceLevel?: number | null;
      season: { year: number };
      round?: { roundNumber: number } | null;
      createdAt: Date;
    }[];
    club: {
      name: string;
      standings: {
        competition: string;
        wins: number;
        losses: number;
        draws: number;
        ladderPosition?: number | null;
        season: { year: number };
      }[];
      seasonResults: {
        competition: string;
        finalPosition: number;
        madeFinals: boolean;
        isPremier: boolean;
        season: { year: number };
      }[];
    };
  };
  currentSeasonYear: number;
}

const boardTypeDescriptions: Record<string, { label: string; description: string }> = {
  TRADITIONAL: {
    label: "Traditional",
    description: "Patient and values loyalty. Expects consistent progress.",
  },
  AMBITIOUS: {
    label: "Ambitious",
    description: "Results-focused. Expects immediate success.",
  },
  DEVELOPMENT: {
    label: "Development",
    description: "Youth-focused with a long-term vision.",
  },
  RUTHLESS: {
    label: "Ruthless",
    description: "Very impatient. Quick to fire underperformers.",
  },
  SUPPORTIVE: {
    label: "Supportive",
    description: "Very patient. Stands by coaches through tough times.",
  },
};

export function BoardDashboard({ board, currentSeasonYear }: BoardDashboardProps) {
  const router = useRouter();
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  const currentSeasonGoals = board.goals.filter(
    (g) => g.season.year === currentSeasonYear
  );

  const currentStandings = board.club.standings.filter(
    (s) => s.season.year === currentSeasonYear
  );

  const seniorsStanding = currentStandings.find(
    (s) => s.competition === "SENIORS"
  );

  // Calculate current confidence based on latest meeting or default
  const latestCompletedMeeting = board.meetings.find(
    (m) => m.status === "COMPLETED" && m.confidenceLevel !== null
  );
  const currentConfidence = latestCompletedMeeting?.confidenceLevel ?? 70;

  const boardConfig = boardTypeDescriptions[board.boardType] || {
    label: board.boardType,
    description: "",
  };

  const handleRequestMeeting = async (type: "MID_SEASON_REVIEW" | "EMERGENCY_REVIEW") => {
    setIsCreatingMeeting(true);
    try {
      const result = await createBoardMeeting(type);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Meeting scheduled");
      router.push(`/dashboard/board/meeting/${result.meetingId}`);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Board Room</h1>
          <p className="text-muted-foreground">
            {board.club.name} Board of Directors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleRequestMeeting("MID_SEASON_REVIEW")}
            disabled={isCreatingMeeting}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Request Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Board info and confidence */}
        <div className="space-y-6">
          {/* Board Type Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Board Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {boardConfig.label}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {boardConfig.description}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Patience Level</span>
                  <span>{board.toleranceRating}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${board.toleranceRating}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confidence Meter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Job Security
              </CardTitle>
              <CardDescription>
                Board&apos;s confidence in your leadership
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <ConfidenceMeter value={currentConfidence} size="md" />
            </CardContent>
          </Card>

          {/* Current Performance */}
          {seniorsStanding && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Current Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {seniorsStanding.ladderPosition || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ladder Position
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {seniorsStanding.wins}-{seniorsStanding.losses}
                      {seniorsStanding.draws > 0 && `-${seniorsStanding.draws}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Record</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle column - Goals */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Season Goals</CardTitle>
              <CardDescription>
                Objectives set by the board for {currentSeasonYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSeasonGoals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No goals set for this season yet
                </p>
              ) : (
                currentSeasonGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goalType={goal.goalType}
                    priority={goal.priority}
                    targetValue={goal.targetValue}
                    currentValue={goal.currentValue}
                    isAchieved={goal.isAchieved}
                    competition={goal.competition}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Meeting timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Meeting History</CardTitle>
              <CardDescription>
                Board meetings and reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeetingTimeline meetings={board.meetings} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning if confidence is low */}
      {currentConfidence < 30 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-500">Job in Jeopardy</h4>
              <p className="text-sm text-muted-foreground">
                The board&apos;s confidence in your leadership is critically low.
                Consider requesting a meeting to address their concerns before
                they take action.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => handleRequestMeeting("EMERGENCY_REVIEW")}
              disabled={isCreatingMeeting}
              className="flex-shrink-0"
            >
              Request Emergency Meeting
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
