"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ClickableStatCardProps = {
  title: string;
  badge?: string;
  value: string | React.ReactNode;
  subtitle: string | React.ReactNode;
  onClick?: () => void;
};

export function ClickableStatCard({
  title,
  badge,
  value,
  subtitle,
  onClick,
}: ClickableStatCardProps) {
  return (
    <Card
      className={onClick ? "cursor-pointer transition-colors hover:bg-muted/50" : ""}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {badge && <Badge variant="outline">{badge}</Badge>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
