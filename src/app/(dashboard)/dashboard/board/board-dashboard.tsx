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
import { Progress } from "@/components/ui/progress";
import { GoalCard } from "@/components/board/goal-card";
import { MeetingTimeline } from "@/components/board/meeting-timeline";
import { createBoardMeeting, cancelBoardMeeting } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Users,
  Trophy,
  Calendar,
  AlertTriangle,
  Shield,
  Target,
  History,
  CheckCircle2,
  XCircle,
  Medal,
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

const goalTypeLabels: Record<string, string> = {
  WIN_PREMIERSHIP: "Win Premiership",
  MAKE_FINALS: "Make Finals",
  FINISH_TOP_4: "Finish Top 4",
  IMPROVE_LADDER: "Improve Ladder Position",
  SPECIFIC_POSITION: "Finish in Position",
  STAY_UNDER_CAP: "Stay Under Salary Cap",
  WIN_PERCENTAGE: "Win Percentage",
  AVOID_BOTTOM: "Avoid Bottom",
};

function getSecurityStatus(confidence: number) {
  if (confidence >= 80) return { label: "SECURE", color: "bg-green-500", textColor: "text-green-500", description: "The board fully supports you" };
  if (confidence >= 60) return { label: "STABLE", color: "bg-blue-500", textColor: "text-blue-500", description: "Good standing with the board" };
  if (confidence >= 40) return { label: "UNCERTAIN", color: "bg-yellow-500", textColor: "text-yellow-500", description: "The board has some concerns" };
  if (confidence >= 20) return { label: "AT RISK", color: "bg-orange-500", textColor: "text-orange-500", description: "Your position is under review" };
  return { label: "CRITICAL", color: "bg-red-500", textColor: "text-red-500", description: "Termination is imminent" };
}

export function BoardDashboard({ board, currentSeasonYear }: BoardDashboardProps) {
  const router = useRouter();
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentSeasonGoals = board.goals.filter(
    (g) => g.season.year === currentSeasonYear
  );

  const pastGoals = board.goals.filter(
    (g) => g.season.year < currentSeasonYear
  );

  // Group past goals by season
  const pastGoalsByYear = pastGoals.reduce((acc, goal) => {
    const year = goal.season.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(goal);
    return acc;
  }, {} as Record<number, typeof pastGoals>);

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
  const securityStatus = getSecurityStatus(currentConfidence);

  const boardConfig = boardTypeDescriptions[board.boardType] || {
    label: board.boardType,
    description: "",
  };

  // Get premierships for trophy cabinet
  const premierships = board.club.seasonResults.filter(r => r.isPremier);
  const seniorsPremiershipYears = premierships.filter(r => r.competition === "SENIORS").map(r => r.season.year);
  const reservesPremiershipYears = premierships.filter(r => r.competition === "RESERVES").map(r => r.season.year);

  // Find pending meetings that can be canceled
  const pendingMeetings = board.meetings.filter(
    (m) => m.status === "PENDING" || m.status === "AWAITING_RESPONSE"
  );

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

  const handleCancelMeeting = (meetingId: string) => {
    startTransition(async () => {
      const result = await cancelBoardMeeting(meetingId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Meeting canceled");
        router.refresh();
      }
    });
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

      {/* Job Security Banner - Most prominent */}
      <Card className={`border-2 ${currentConfidence < 30 ? 'border-red-500 bg-red-500/5' : currentConfidence < 50 ? 'border-yellow-500 bg-yellow-500/5' : 'border-green-500/50 bg-green-500/5'}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${securityStatus.color}`}>
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold">Job Security</h2>
                  <Badge className={`${securityStatus.color} text-white text-sm px-3 py-1`}>
                    {securityStatus.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{securityStatus.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <span className={`text-2xl font-bold ${securityStatus.textColor}`}>{currentConfidence}%</span>
                  </div>
                  <Progress value={currentConfidence} className={`w-48 h-3 ${currentConfidence < 30 ? '[&>div]:bg-red-500' : currentConfidence < 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`} />
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Board Type</div>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {boardConfig.label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                {boardConfig.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Meetings - Show if any */}
      {pendingMeetings.length > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-500" />
                <div>
                  <h4 className="font-medium">Pending Meeting</h4>
                  <p className="text-sm text-muted-foreground">
                    You have a {pendingMeetings[0].meetingType.replace(/_/g, " ").toLowerCase()} scheduled
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  onClick={() => router.push(`/dashboard/board/meeting/${pendingMeetings[0].id}`)}
                >
                  Continue Meeting
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCancelMeeting(pendingMeetings[0].id)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning if confidence is low */}
      {currentConfidence < 30 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-500">Job in Jeopardy</h4>
              <p className="text-sm text-muted-foreground">
                The board&apos;s confidence in your leadership is critically low.
                Request an emergency meeting to address their concerns.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Current Season Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Season Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {currentSeasonYear} Season Objectives
              </CardTitle>
              <CardDescription>
                What the board expects you to achieve this season
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

          {/* Current Performance */}
          {seniorsStanding && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Current Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold">
                      {seniorsStanding.ladderPosition || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ladder Position
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-green-600">
                      {seniorsStanding.wins}
                    </p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-red-500">
                      {seniorsStanding.losses}
                    </p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold">
                      {seniorsStanding.wins * 4 + seniorsStanding.draws * 2}
                    </p>
                    <p className="text-xs text-muted-foreground">Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Seasons Goals */}
          {Object.keys(pastGoalsByYear).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Past Season Goals
                </CardTitle>
                <CardDescription>
                  Your track record with the board
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(pastGoalsByYear)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, goals]) => {
                    const achieved = goals.filter(g => g.isAchieved).length;
                    const total = goals.length;
                    const successRate = total > 0 ? Math.round((achieved / total) * 100) : 0;

                    return (
                      <div key={year} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{year} Season</h4>
                          <Badge variant={successRate >= 50 ? "default" : "destructive"}>
                            {achieved}/{total} achieved ({successRate}%)
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {goals.map((goal) => (
                            <div key={goal.id} className="flex items-center gap-2 text-sm">
                              {goal.isAchieved ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={goal.isAchieved ? "" : "text-muted-foreground"}>
                                {goalTypeLabels[goal.goalType] || goal.goalType}
                              </span>
                              <Badge variant="outline" className="text-[10px] ml-auto">
                                {goal.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Trophy Cabinet & Meeting History */}
        <div className="space-y-6">
          {/* Trophy Cabinet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-500" />
                Trophy Cabinet
              </CardTitle>
              <CardDescription>
                Club premiership history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {premierships.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No premierships yet</p>
                  <p className="text-xs text-muted-foreground">Win one to fill the cabinet!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Seniors Premierships */}
                  {seniorsPremiershipYears.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        Seniors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {seniorsPremiershipYears.sort((a, b) => b - a).map((year) => (
                          <div
                            key={year}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
                          >
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="font-bold text-amber-600 dark:text-amber-400">{year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reserves Premierships */}
                  {reservesPremiershipYears.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Reserves
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {reservesPremiershipYears.sort((a, b) => b - a).map((year) => (
                          <div
                            key={year}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-500/20 border border-slate-500/30"
                          >
                            <Trophy className="h-4 w-4 text-slate-500" />
                            <span className="font-bold">{year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total count */}
                  <div className="pt-2 border-t text-center">
                    <span className="text-2xl font-bold">{premierships.length}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {premierships.length === 1 ? "Premiership" : "Premierships"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Timeline */}
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
    </div>
  );
}
