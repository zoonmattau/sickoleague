"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { RosterSpot, Position } from "@prisma/client";
import type { SerializedContract } from "../types";

type DraggedItem = {
  contract: SerializedContract;
  sourceSpot: RosterSpot | "pool";
  sourceSquad: "SENIORS" | "RESERVES" | null;
};

type LineupDndContextValue = {
  activeItem: DraggedItem | null;
  isValidDrop: (targetSpot: RosterSpot) => boolean;
};

const LineupDndContext = createContext<LineupDndContextValue | null>(null);

export function useLineupDnd() {
  const context = useContext(LineupDndContext);
  if (!context) {
    throw new Error("useLineupDnd must be used within LineupDndProvider");
  }
  return context;
}

// Valid positions for each roster spot
const POSITION_REQUIREMENTS: Record<string, Position[]> = {
  DEF1: ["DEF"], DEF2: ["DEF"], DEF3: ["DEF"],
  MID1: ["MID"], MID2: ["MID"], MID3: ["MID"], MID4: ["MID"],
  RUC: ["RUC"],
  FWD1: ["FWD"], FWD2: ["FWD"], FWD3: ["FWD"],
  RDEF1: ["DEF"], RDEF2: ["DEF"],
  RMID1: ["MID"], RMID2: ["MID"], RMID3: ["MID"],
  RRUC: ["RUC"],
  RFWD1: ["FWD"], RFWD2: ["FWD"],
  BENCH1: [], BENCH2: [], // Any position
  IL1: [], IL2: [], // Any position
};

type Props = {
  children: ReactNode;
  onDragEnd: (
    contractId: string,
    sourceSpot: RosterSpot | "pool",
    targetSpot: RosterSpot | "pool"
  ) => Promise<void>;
};

export function LineupDndProvider({ children, onDragEnd }: Props) {
  const [activeItem, setActiveItem] = useState<DraggedItem | null>(null);
  const [overTarget, setOverTarget] = useState<RosterSpot | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const isValidDrop = useCallback((targetSpot: RosterSpot): boolean => {
    if (!activeItem) return false;

    const requirements = POSITION_REQUIREMENTS[targetSpot];
    if (!requirements) return false;

    // If no requirements (bench/IL), always valid
    if (requirements.length === 0) return true;

    // Check if player has at least one required position
    const playerPositions = activeItem.contract.aflPlayer.positions;
    return requirements.some(req => playerPositions.includes(req));
  }, [activeItem]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as {
      contract: SerializedContract;
      sourceSpot: RosterSpot | "pool";
      sourceSquad: "SENIORS" | "RESERVES" | null;
    };

    setActiveItem({
      contract: data.contract,
      sourceSpot: data.sourceSpot,
      sourceSquad: data.sourceSquad,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setOverTarget(over.id as RosterSpot);
    } else {
      setOverTarget(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (activeItem && over) {
      const targetSpot = over.id as RosterSpot;

      // Only process if it's a valid drop
      if (isValidDrop(targetSpot)) {
        await onDragEnd(
          activeItem.contract.id,
          activeItem.sourceSpot,
          targetSpot
        );
      }
    }

    setActiveItem(null);
    setOverTarget(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    setOverTarget(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <LineupDndContext.Provider value={{ activeItem, isValidDrop }}>
        {children}
      </LineupDndContext.Provider>
      <DragOverlay>
        {activeItem && (
          <DragOverlayCard contract={activeItem.contract} />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DragOverlayCard({ contract }: { contract: SerializedContract }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-background border-2 border-primary shadow-lg opacity-90">
      <div className="flex items-center gap-2">
        <div className="font-medium text-sm">
          {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName.charAt(0)}.
        </div>
        <div className="text-xs text-muted-foreground">
          {contract.aflPlayer.positions.join("/")}
        </div>
      </div>
    </div>
  );
}
