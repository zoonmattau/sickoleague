"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

type MarketSize = "MAJOR" | "LARGE" | "MEDIUM" | "SMALL";

const marketSizeColors: Record<MarketSize, string> = {
  MAJOR: "bg-purple-500 hover:bg-purple-600 text-white",
  LARGE: "bg-blue-500 hover:bg-blue-600 text-white",
  MEDIUM: "bg-green-500 hover:bg-green-600 text-white",
  SMALL: "bg-gray-500 hover:bg-gray-600 text-white",
};

const marketSizeLabels: Record<MarketSize, string> = {
  MAJOR: "Major Market",
  LARGE: "Large Market",
  MEDIUM: "Medium Market",
  SMALL: "Small Market",
};

const marketSizeAppeal: Record<MarketSize, string> = {
  MAJOR: "+15% Appeal",
  LARGE: "+10% Appeal",
  MEDIUM: "+5% Appeal",
  SMALL: "Baseline",
};

type CityBadgeProps = {
  city: {
    name: string;
    state: string;
    marketSize: MarketSize;
    population?: number;
  };
  showIcon?: boolean;
  showAppeal?: boolean;
  size?: "sm" | "default";
};

export function CityBadge({
  city,
  showIcon = true,
  showAppeal = false,
  size = "default",
}: CityBadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <div className="flex items-center gap-1.5">
      <Badge
        className={`${marketSizeColors[city.marketSize]} ${sizeClasses} font-medium`}
        title={`${marketSizeLabels[city.marketSize]} - ${marketSizeAppeal[city.marketSize]}`}
      >
        {showIcon && <MapPin className="h-3 w-3 mr-1" />}
        {city.name}, {city.state}
      </Badge>
      {showAppeal && (
        <span className="text-xs text-muted-foreground">
          ({marketSizeAppeal[city.marketSize]})
        </span>
      )}
    </div>
  );
}

type CityInfoProps = {
  city: {
    name: string;
    state: string;
    marketSize: MarketSize;
    population: number;
    description?: string | null;
  };
};

export function CityInfo({ city }: CityInfoProps) {
  return (
    <div className="space-y-1">
      <CityBadge city={city} showAppeal />
      <div className="text-xs text-muted-foreground">
        Population: {city.population.toLocaleString()}
      </div>
      {city.description && (
        <div className="text-xs text-muted-foreground italic">
          {city.description}
        </div>
      )}
    </div>
  );
}
