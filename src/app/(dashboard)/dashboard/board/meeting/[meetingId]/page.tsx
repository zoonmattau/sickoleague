import { notFound } from "next/navigation";
import { getMeetingWithStatement } from "../../actions";
import { MeetingRoom } from "./meeting-room";

interface PageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

export default async function MeetingPage({ params }: PageProps) {
  const { meetingId } = await params;

  const meeting = await getMeetingWithStatement(meetingId);

  if (!meeting) {
    notFound();
  }

  // Extract additional data if present (from AI generation)
  const statementTone = "statementTone" in meeting ? (meeting.statementTone as string) : undefined;
  const keyPoints = "keyPoints" in meeting ? (meeting.keyPoints as string[]) : undefined;

  return (
    <div className="container mx-auto py-6">
      <MeetingRoom
        meeting={meeting}
        statementTone={statementTone}
        keyPoints={keyPoints}
      />
    </div>
  );
}
