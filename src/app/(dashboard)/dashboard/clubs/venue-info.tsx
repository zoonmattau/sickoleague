"use client";

import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

type VenueClass = "ELITE" | "MAJOR" | "STANDARD" | "BOUTIQUE";

const venueClassColors: Record<VenueClass, string> = {
  ELITE: "bg-yellow-500 hover:bg-yellow-600 text-black",
  MAJOR: "bg-orange-500 hover:bg-orange-600 text-white",
  STANDARD: "bg-slate-500 hover:bg-slate-600 text-white",
  BOUTIQUE: "bg-emerald-600 hover:bg-emerald-700 text-white",
};

const venueClassLabels: Record<VenueClass, string> = {
  ELITE: "Elite Venue",
  MAJOR: "Major Venue",
  STANDARD: "Standard Venue",
  BOUTIQUE: "Boutique Venue",
};

const venueClassHfaBonus: Record<VenueClass, string> = {
  ELITE: "+3.0 HFA",
  MAJOR: "+2.0 HFA",
  STANDARD: "+1.0 HFA",
  BOUTIQUE: "+0.0 HFA",
};

type VenueInfoProps = {
  venue: {
    name: string;
    capacity: number;
    venueClass: VenueClass;
    atmosphereBonus?: number;
    description?: string | null;
  };
  showCapacity?: boolean;
  showHfaBonus?: boolean;
  size?: "sm" | "default";
};

export function VenueInfo({
  venue,
  showCapacity = true,
  showHfaBonus = false,
  size = "default",
}: VenueInfoProps) {
  const sizeClasses = size === "sm" ? "text-xs" : "text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={`flex items-center gap-2 ${sizeClasses}`}>
      <Building2 className={`${iconSize} text-muted-foreground`} />
      <span className="font-medium">{venue.name}</span>
      {showCapacity && (
        <span className="text-muted-foreground">
          ({venue.capacity.toLocaleString()})
        </span>
      )}
      {showHfaBonus && (
        <Badge
          variant="outline"
          className={`${size === "sm" ? "text-[10px] px-1 py-0" : "text-xs"}`}
          title={venueClassLabels[venue.venueClass]}
        >
          {venueClassHfaBonus[venue.venueClass]}
        </Badge>
      )}
    </div>
  );
}

type VenueCardProps = {
  venue: {
    name: string;
    capacity: number;
    venueClass: VenueClass;
    atmosphereBonus?: number;
    description?: string | null;
  };
};

export function VenueCard({ venue }: VenueCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{venue.name}</span>
        <Badge className={venueClassColors[venue.venueClass]}>
          {venue.venueClass}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Capacity: </span>
          <span className="font-medium">{venue.capacity.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">HFA Bonus: </span>
          <span className="font-medium text-green-500">
            {venueClassHfaBonus[venue.venueClass]}
          </span>
        </div>
      </div>
      {venue.description && (
        <div className="text-xs text-muted-foreground italic">
          {venue.description}
        </div>
      )}
    </div>
  );
}
