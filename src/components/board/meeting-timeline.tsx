"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface Meeting {
  id: string;
  meetingType: string;
  status: string;
  outcome?: string | null;
  confidenceLevel?: number | null;
  season: { year: number };
  round?: { roundNumber: number } | null;
  createdAt: Date | string;
}

interface MeetingTimelineProps {
  meetings: Meeting[];
}

const meetingTypeConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PRESEASON_GOALS: { label: "Pre-Season Goals", icon: CalendarDays },
  MID_SEASON_REVIEW: { label: "Mid-Season Review", icon: MessageSquare },
  END_SEASON_REVIEW: { label: "End of Season Review", icon: CheckCircle },
  EMERGENCY_REVIEW: { label: "Emergency Review", icon: AlertTriangle },
};

const outcomeColors: Record<string, string> = {
  CONFIDENCE_HIGH: "bg-green-500",
  CONFIDENCE_MEDIUM: "bg-yellow-500",
  CONFIDENCE_LOW: "bg-orange-500",
  FIRED: "bg-red-500",
};

export function MeetingTimeline({ meetings }: MeetingTimelineProps) {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No board meetings yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4">
        {meetings.map((meeting, index) => {
          const config = meetingTypeConfig[meeting.meetingType] || {
            label: meeting.meetingType.replace(/_/g, " "),
            icon: MessageSquare,
          };
          const Icon = config.icon;
          const isCompleted = meeting.status === "COMPLETED";
          const isPending = meeting.status === "PENDING";
          const isAwaiting = meeting.status === "AWAITING_RESPONSE";

          return (
            <div key={meeting.id} className="relative pl-10">
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute left-2 top-2 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center",
                  isCompleted
                    ? meeting.outcome
                      ? outcomeColors[meeting.outcome]
                      : "bg-green-500"
                    : isAwaiting
                    ? "bg-yellow-500"
                    : "bg-muted"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-3 w-3 text-white" />
                ) : isAwaiting ? (
                  <MessageSquare className="h-3 w-3 text-white" />
                ) : (
                  <Clock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <Link
                href={`/dashboard/board/meeting/${meeting.id}`}
                className={cn(
                  "block p-4 rounded-lg border transition-colors",
                  "hover:bg-muted/50",
                  isAwaiting && "border-yellow-500/50 bg-yellow-500/5"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">{config.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {meeting.season.year}
                        {meeting.round && ` - Round ${meeting.round.roundNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        isCompleted
                          ? "default"
                          : isAwaiting
                          ? "secondary"
                          : "outline"
                      }
                      className={cn(
                        isCompleted && meeting.outcome && outcomeColors[meeting.outcome],
                        isCompleted && "text-white"
                      )}
                    >
                      {meeting.status.replace(/_/g, " ")}
                    </Badge>
                    {meeting.confidenceLevel !== null &&
                      meeting.confidenceLevel !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {meeting.confidenceLevel}% confidence
                        </span>
                      )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
