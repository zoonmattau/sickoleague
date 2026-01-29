"use client";

import { useDroppable } from "@dnd-kit/core";
import { RosterSpot } from "@prisma/client";
import { useLineupDnd } from "./dnd-context";

type Props = {
  spot: RosterSpot;
  label: string;
  children: React.ReactNode;
  isEmpty: boolean;
};

export function DroppableSlot({ spot, label, children, isEmpty }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: spot,
  });

  const { activeItem, isValidDrop } = useLineupDnd();

  const isActive = activeItem !== null;
  const canDrop = isActive && isValidDrop(spot);
  const isInvalidTarget = isActive && !canDrop;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative rounded-lg border-2 border-dashed transition-all min-h-[40px] sm:min-h-[48px]
        ${isEmpty ? "bg-muted/20" : "bg-transparent border-transparent"}
        ${isOver && canDrop ? "border-primary bg-primary/10 scale-[1.02]" : ""}
        ${isOver && isInvalidTarget ? "border-destructive bg-destructive/10" : ""}
        ${isActive && canDrop && !isOver ? "border-primary/50" : ""}
        ${isActive && isInvalidTarget ? "border-destructive/30" : ""}
      `}
    >
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      )}
      {children}
    </div>
  );
}
