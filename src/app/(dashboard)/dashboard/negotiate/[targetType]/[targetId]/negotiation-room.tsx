"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BoardroomScene } from "@/components/negotiation/boardroom-scene";
import { PlayerPortrait } from "@/components/negotiation/player-portrait";
import { MessageThread } from "@/components/negotiation/message-thread";
import { OfferPanel } from "@/components/negotiation/offer-panel";
import { sendMessage, modifyOffer, walkAway, acceptNegotiation } from "../../actions";
import { Send, X, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NegotiationRoomProps {
  session: {
    id: string;
    status: string;
    playerMood: number;
    currentOffer: {
      years: number;
      totalValue: number;
      yearBreakdown: { season: number; value: number }[];
    };
    messages: {
      id: string;
      role: "COACH" | "PLAYER" | "STAFF" | "SYSTEM";
      content: string;
      emotion?: string | null;
      createdAt: Date;
    }[];
    club: {
      name: string;
      primaryColor?: string | null;
      secondaryColor?: string | null;
      seniorsLogoUrl?: string | null;
      seasonResults: { season: { year: number }; competition: string }[];
    };
    aflPlayer?: {
      firstName: string;
      lastName: string;
      positions: string[];
      photoUrl?: string | null;
      aflTeam?: { abbreviation: string } | null;
    } | null;
    staff?: {
      name: string;
      role: string;
      aflTeam?: { abbreviation: string } | null;
    } | null;
  };
  salaryCapInfo?: {
    salaryCap: number;
    roomByYear: Record<number, number>;
  } | null;
  listManagerDiscount?: number;
}

export function NegotiationRoom({
  session: initialSession,
  salaryCapInfo,
  listManagerDiscount = 0,
}: NegotiationRoomProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTyping, setIsTyping] = useState(false);
  const [selectedStaffRole, setSelectedStaffRole] = useState<"SENIOR_ASSISTANT" | "RESERVES_ASSISTANT">("SENIOR_ASSISTANT");

  const isPlayer = !!session.aflPlayer;
  const isCoach = !isPlayer && session.staff?.role === "ASSISTANT_COACH";
  const targetName = isPlayer
    ? `${session.aflPlayer!.firstName} ${session.aflPlayer!.lastName}`
    : session.staff!.name;

  const latestEmotion = session.messages
    .filter((m) => m.role === "PLAYER" || m.role === "STAFF")
    .slice(-1)[0]?.emotion;

  const isActive = session.status === "ACTIVE";
  const isAccepted = session.status === "ACCEPTED";
  const isRejected = session.status === "REJECTED";

  const handleSendMessage = async () => {
    if (!message.trim() || !isActive) return;

    const msgContent = message.trim();
    setMessage("");
    setIsTyping(true);

    // Optimistically add coach message
    const tempId = `temp-${Date.now()}`;
    setSession((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: tempId,
          role: "COACH" as const,
          content: msgContent,
          createdAt: new Date(),
        },
      ],
    }));

    startTransition(async () => {
      const result = await sendMessage(session.id, msgContent);
      setIsTyping(false);

      if (result.error) {
        toast.error(result.error);
        // Remove optimistic message on error
        setSession((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempId),
        }));
        return;
      }

      // Update session with response
      setSession((prev) => ({
        ...prev,
        playerMood: result.newMood!,
        status: result.status!,
        messages: [
          ...prev.messages,
          {
            id: `response-${Date.now()}`,
            role: isPlayer ? ("PLAYER" as const) : ("STAFF" as const),
            content: result.response!.message,
            emotion: result.response!.emotion,
            createdAt: new Date(),
          },
        ],
      }));

      if (result.status === "ACCEPTED") {
        toast.success("They accepted your offer!");
      } else if (result.status === "REJECTED") {
        toast.error("They rejected your offer.");
      }
    });
  };

  const handleModifyOffer = async (newOffer: {
    years: number;
    yearBreakdown: { season: number; value: number }[];
  }) => {
    const result = await modifyOffer(session.id, newOffer);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    const totalValue = newOffer.yearBreakdown.reduce((sum, y) => sum + y.value, 0);
    setSession((prev) => ({
      ...prev,
      currentOffer: {
        years: newOffer.years,
        totalValue,
        yearBreakdown: newOffer.yearBreakdown,
      },
      messages: [
        ...prev.messages,
        {
          id: `system-${Date.now()}`,
          role: "SYSTEM" as const,
          content: `Offer updated: ${newOffer.years} year(s), $${totalValue}k total`,
          createdAt: new Date(),
        },
      ],
    }));

    toast.success("Offer updated");
  };

  const handleWalkAway = async () => {
    const result = await walkAway(session.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.info("You walked away from the negotiation.");
    router.push("/dashboard");
  };

  const handleAcceptAndSign = async () => {
    const result = await acceptNegotiation(session.id, isCoach ? selectedStaffRole : undefined);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Contract signed successfully!");
    router.push("/dashboard/roster");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Contract Negotiation</h1>
            <p className="text-muted-foreground">
              Negotiating with {targetName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <Button variant="outline" onClick={handleWalkAway}>
              <X className="h-4 w-4 mr-2" />
              Walk Away
            </Button>
          )}
          {isAccepted && (
            <Button onClick={handleAcceptAndSign}>
              <Check className="h-4 w-4 mr-2" />
              Sign Contract
            </Button>
          )}
          {isRejected && (
            <Badge variant="destructive" className="px-4 py-2">
              Negotiation Failed
            </Badge>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boardroom scene */}
        <div className="lg:col-span-2">
          <BoardroomScene
            clubName={session.club.name}
            primaryColor={session.club.primaryColor}
            secondaryColor={session.club.secondaryColor}
            logoUrl={session.club.seniorsLogoUrl}
            trophies={session.club.seasonResults}
          >
            <div className="flex flex-col items-center gap-6">
              <PlayerPortrait
                name={targetName}
                photoUrl={isPlayer ? session.aflPlayer!.photoUrl : null}
                position={isPlayer ? session.aflPlayer!.positions.join("/") : undefined}
                role={!isPlayer ? session.staff!.role : undefined}
                aflTeam={
                  isPlayer
                    ? session.aflPlayer!.aflTeam?.abbreviation
                    : session.staff!.aflTeam?.abbreviation
                }
                mood={session.playerMood}
                emotion={latestEmotion ?? undefined}
              />

              {/* Mood meter */}
              <div className="w-64">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Mood</span>
                  <span>{session.playerMood}%</span>
                </div>
                <Progress
                  value={session.playerMood}
                  className="h-3"
                />
              </div>
            </div>
          </BoardroomScene>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Offer panel */}
          <OfferPanel
            currentOffer={session.currentOffer}
            onModifyOffer={handleModifyOffer}
            disabled={!isActive || isPending}
            salaryCapInfo={salaryCapInfo}
            listManagerDiscount={isPlayer ? listManagerDiscount : 0}
          />

          {/* Staff Role Selector (for coaches only) */}
          {isCoach && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Coaching Position</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedStaffRole}
                  onValueChange={(v) => setSelectedStaffRole(v as "SENIOR_ASSISTANT" | "RESERVES_ASSISTANT")}
                  disabled={!isActive && !isAccepted}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SENIOR_ASSISTANT">Seniors Coach</SelectItem>
                    <SelectItem value="RESERVES_ASSISTANT">Reserves Coach</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedStaffRole === "SENIOR_ASSISTANT"
                    ? "Full bonus from their AFL team results"
                    : "Half bonus from their AFL team results"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  isActive
                    ? "default"
                    : isAccepted
                    ? "default"
                    : "destructive"
                }
                className={isAccepted ? "bg-green-500" : ""}
              >
                {session.status}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message thread */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MessageThread
            messages={session.messages}
            isTyping={isTyping}
            targetName={targetName}
          />

          {/* Message input */}
          {isActive && (
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type your pitch..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isPending || isTyping}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || isPending || isTyping}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
