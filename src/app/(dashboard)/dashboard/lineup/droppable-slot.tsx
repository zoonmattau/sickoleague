"use client";

import { useDroppable } from "@dnd-kit/core";
import { RosterSpot } from "@prisma/client";
import { useLineupDnd } from "./dnd-context";
import { Plus } from "lucide-react";

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
        relative transition-all min-h-[44px]
        ${isEmpty ? "bg-muted/10" : "bg-transparent"}
        ${isOver && canDrop ? "bg-primary/15 scale-[1.01] shadow-inner" : ""}
        ${isOver && isInvalidTarget ? "bg-destructive/10" : ""}
        ${isActive && canDrop && !isOver ? "bg-primary/5" : ""}
        ${isActive && isInvalidTarget ? "bg-destructive/5" : ""}
      `}
    >
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded border border-dashed
            ${isActive && canDrop ? 'border-primary bg-primary/10 text-primary' : 'border-muted-foreground/30 text-muted-foreground'}
            ${isOver && canDrop ? 'border-primary border-solid bg-primary/20 text-primary scale-105' : ''}
            ${isOver && isInvalidTarget ? 'border-destructive text-destructive' : ''}
            transition-all
          `}>
            <Plus className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
