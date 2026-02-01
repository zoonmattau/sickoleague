"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProposeTradeDialog } from "./propose-trade-dialog";

type Club = {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type Player = {
  contractId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  positions: string[];
  photoUrl: string | null;
  aflTeam: string | null;
  salary: number;
  endSeason: number;
};

type Props = {
  clubs: Club[];
  myClub: { id: string; name: string } | null;
  myPlayers: Player[];
};

export function TradesHeader({ clubs, myClub, myPlayers }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Trades</h1>
        <p className="text-muted-foreground">
          Manage trade offers with other clubs
        </p>
      </div>
      {myClub && (
        <>
          <Button onClick={() => setDialogOpen(true)}>Propose Trade</Button>
          <ProposeTradeDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            clubs={clubs}
            myClub={myClub}
            myPlayers={myPlayers}
          />
        </>
      )}
    </div>
  );
}
