"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  TrendingUp,
  DollarSign,
  Percent,
  Shield,
  Medal,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goalType: string;
  priority: string;
  targetValue?: number | null;
  currentValue?: number | null;
  isAchieved: boolean;
  competition?: string | null;
}

const goalConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  WIN_PREMIERSHIP: {
    label: "Win Premiership",
    icon: Trophy,
    description: "Win the grand final",
  },
  MAKE_FINALS: {
    label: "Make Finals",
    icon: Medal,
    description: "Finish in the top 4",
  },
  FINISH_TOP_4: {
    label: "Finish Top 4",
    icon: Flag,
    description: "Secure a top 4 position",
  },
  IMPROVE_LADDER: {
    label: "Improve Position",
    icon: TrendingUp,
    description: "Finish higher than last season",
  },
  SPECIFIC_POSITION: {
    label: "Target Position",
    icon: Target,
    description: "Finish at a specific position",
  },
  STAY_UNDER_CAP: {
    label: "Cap Compliance",
    icon: DollarSign,
    description: "Stay under the salary cap",
  },
  WIN_PERCENTAGE: {
    label: "Win Rate",
    icon: Percent,
    description: "Achieve target win percentage",
  },
  AVOID_BOTTOM: {
    label: "Avoid Wooden Spoon",
    icon: Shield,
    description: "Don't finish last",
  },
};

const priorityColors = {
  PRIMARY: "bg-red-500/10 text-red-500 border-red-500/20",
  SECONDARY: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ASPIRATIONAL: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function GoalCard({
  goalType,
  priority,
  targetValue,
  currentValue,
  isAchieved,
  competition,
}: GoalCardProps) {
  const config = goalConfig[goalType] || {
    label: goalType.replace(/_/g, " "),
    icon: Target,
    description: "",
  };
  const Icon = config.icon;

  const progress =
    targetValue && currentValue !== undefined && currentValue !== null
      ? Math.min(100, (currentValue / targetValue) * 100)
      : isAchieved
      ? 100
      : 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        isAchieved && "ring-2 ring-green-500"
      )}
    >
      {isAchieved && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded-bl">
          Achieved
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              isAchieved ? "bg-green-500/10" : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isAchieved ? "text-green-500" : "text-muted-foreground"
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{config.label}</h4>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  priorityColors[priority as keyof typeof priorityColors]
                )}
              >
                {priority}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {config.description}
              {competition && ` (${competition})`}
            </p>

            {targetValue !== undefined && targetValue !== null && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>
                    {currentValue ?? 0} / {targetValue}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
