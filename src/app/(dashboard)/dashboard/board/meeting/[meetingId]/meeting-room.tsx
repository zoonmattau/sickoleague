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
import { ConfidenceMeter } from "@/components/board/confidence-meter";
import { RebuttalForm } from "@/components/board/rebuttal-form";
import { submitRebuttal, finalizeMeeting } from "../../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Gavel,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingRoomProps {
  meeting: {
    id: string;
    meetingType: string;
    status: string;
    boardStatement?: string | null;
    coachRebuttal?: string | null;
    finalVerdict?: string | null;
    outcome?: string | null;
    confidenceLevel?: number | null;
    season: { year: number };
    round?: { roundNumber: number } | null;
    board: {
      boardType: string;
      toleranceRating: number;
      club: { name: string };
    };
  };
  statementTone?: string;
  keyPoints?: string[];
}

const meetingTypeLabels: Record<string, string> = {
  PRESEASON_GOALS: "Pre-Season Goals Meeting",
  MID_SEASON_REVIEW: "Mid-Season Review",
  END_SEASON_REVIEW: "End of Season Review",
  EMERGENCY_REVIEW: "Emergency Board Review",
};

const outcomeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CONFIDENCE_HIGH: {
    label: "High Confidence",
    icon: CheckCircle,
    color: "text-green-500",
  },
  CONFIDENCE_MEDIUM: {
    label: "Medium Confidence",
    icon: Users,
    color: "text-yellow-500",
  },
  CONFIDENCE_LOW: {
    label: "Low Confidence",
    icon: AlertTriangle,
    color: "text-orange-500",
  },
  FIRED: {
    label: "Terminated",
    icon: XCircle,
    color: "text-red-500",
  },
};

export function MeetingRoom({ meeting, statementTone, keyPoints }: MeetingRoomProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localMeeting, setLocalMeeting] = useState(meeting);

  const isPending = localMeeting.status === "PENDING";
  const isAwaiting = localMeeting.status === "AWAITING_RESPONSE";
  const isCompleted = localMeeting.status === "COMPLETED";

  const handleSubmitRebuttal = async (text: string) => {
    const result = await submitRebuttal(localMeeting.id, text);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setLocalMeeting((prev) => ({ ...prev, coachRebuttal: text }));
    toast.success("Response submitted");
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      const result = await finalizeMeeting(localMeeting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setLocalMeeting((prev) => ({
        ...prev,
        status: "COMPLETED",
        finalVerdict: result.verdict,
        outcome: result.outcome,
        confidenceLevel: result.confidenceLevel,
      }));

      if (result.outcome === "FIRED") {
        toast.error("You have been fired by the board.");
        // Redirect after a delay
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        toast.success("Meeting concluded");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const outcomeInfo = localMeeting.outcome
    ? outcomeConfig[localMeeting.outcome]
    : null;
  const OutcomeIcon = outcomeInfo?.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/board">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {meetingTypeLabels[localMeeting.meetingType] || "Board Meeting"}
            </h1>
            <p className="text-muted-foreground">
              {localMeeting.board.club.name} - {localMeeting.season.year}
              {localMeeting.round && ` Round ${localMeeting.round.roundNumber}`}
            </p>
          </div>
        </div>

        <Badge
          variant={isCompleted ? "default" : isAwaiting ? "secondary" : "outline"}
          className={cn(
            isCompleted && localMeeting.outcome === "FIRED" && "bg-red-500",
            isCompleted && localMeeting.outcome === "CONFIDENCE_HIGH" && "bg-green-500"
          )}
        >
          {localMeeting.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Board statement */}
        <div className="lg:col-span-2 space-y-6">
          {/* Board Statement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Board Statement
              </CardTitle>
              {statementTone && (
                <Badge
                  variant="outline"
                  className={cn(
                    statementTone === "supportive" && "border-green-500 text-green-500",
                    statementTone === "neutral" && "border-blue-500 text-blue-500",
                    statementTone === "concerned" && "border-yellow-500 text-yellow-500",
                    statementTone === "critical" && "border-red-500 text-red-500"
                  )}
                >
                  {statementTone}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>The board is preparing their statement...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{localMeeting.boardStatement}</p>
                </div>
              )}

              {keyPoints && keyPoints.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Key Points:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {keyPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coach Rebuttal */}
          {(isAwaiting || isCompleted) && (
            <RebuttalForm
              onSubmit={handleSubmitRebuttal}
              disabled={!isAwaiting || !!localMeeting.coachRebuttal}
              existingRebuttal={localMeeting.coachRebuttal}
            />
          )}

          {/* Final Verdict */}
          {isCompleted && localMeeting.finalVerdict && (
            <Card
              className={cn(
                localMeeting.outcome === "FIRED" && "border-red-500 bg-red-500/5"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Board&apos;s Verdict
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{localMeeting.finalVerdict}</p>
                </div>

                {outcomeInfo && OutcomeIcon && (
                  <div
                    className={cn(
                      "flex items-center gap-2 mt-4 pt-4 border-t",
                      outcomeInfo.color
                    )}
                  >
                    <OutcomeIcon className="h-5 w-5" />
                    <span className="font-medium">{outcomeInfo.label}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Finalize button */}
          {isAwaiting && localMeeting.coachRebuttal && (
            <Button
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Processing..." : "Submit for Board Decision"}
            </Button>
          )}
        </div>

        {/* Right column - Confidence and info */}
        <div className="space-y-6">
          {/* Confidence meter */}
          {localMeeting.confidenceLevel !== null &&
            localMeeting.confidenceLevel !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle>Confidence Level</CardTitle>
                  <CardDescription>
                    Board&apos;s confidence after this meeting
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                  <ConfidenceMeter
                    value={localMeeting.confidenceLevel}
                    size="md"
                  />
                </CardContent>
              </Card>
            )}

          {/* Board info */}
          <Card>
            <CardHeader>
              <CardTitle>Board Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Board Type</p>
                <Badge variant="secondary">
                  {localMeeting.board.boardType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patience Level</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${localMeeting.board.toleranceRating}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {localMeeting.board.toleranceRating}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning for fired */}
          {localMeeting.outcome === "FIRED" && (
            <Card className="border-red-500 bg-red-500/10">
              <CardContent className="py-6 text-center">
                <XCircle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                <h3 className="font-bold text-red-500 mb-2">
                  You Have Been Fired
                </h3>
                <p className="text-sm text-muted-foreground">
                  The board has lost confidence in your leadership. You will be
                  redirected shortly.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
