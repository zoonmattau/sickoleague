import { redirect, notFound } from "next/navigation";
import { getNegotiationSession, getNegotiationTarget, startNegotiation, getClubSalaryCapInfo, getClubListManagerDiscount } from "../../actions";
import { NegotiationRoom } from "./negotiation-room";

interface PageProps {
  params: Promise<{
    targetType: string;
    targetId: string;
  }>;
  searchParams: Promise<{
    sessionId?: string;
    years?: string;
    value?: string;
  }>;
}

export default async function NegotiatePage({ params, searchParams }: PageProps) {
  const { targetType, targetId } = await params;
  const { sessionId, years, value } = await searchParams;

  // Validate target type
  if (targetType !== "player" && targetType !== "staff") {
    notFound();
  }

  // If we have a session ID, load that session
  if (sessionId) {
    const [session, salaryCapInfo, listManagerDiscountInfo] = await Promise.all([
      getNegotiationSession(sessionId),
      getClubSalaryCapInfo(),
      getClubListManagerDiscount(),
    ]);

    if (!session) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <NegotiationRoom
          session={{
            ...session,
            currentOffer: session.currentOffer as {
              years: number;
              totalValue: number;
              yearBreakdown: { season: number; value: number }[];
            },
          }}
          salaryCapInfo={salaryCapInfo}
          listManagerDiscount={listManagerDiscountInfo ? parseFloat(listManagerDiscountInfo.discountPercent) : 0}
        />
      </div>
    );
  }

  // Otherwise, start a new negotiation
  const target = await getNegotiationTarget(targetType, targetId);
  if (!target) {
    notFound();
  }

  // Parse initial offer from search params or use defaults
  const currentYear = new Date().getFullYear();
  const offerYears = parseInt(years || "2", 10);
  const perYearValue = parseInt(value || "50", 10);

  const yearBreakdown = Array.from({ length: offerYears }, (_, i) => ({
    season: currentYear + i,
    value: perYearValue,
  }));

  const result = await startNegotiation(targetType, targetId, {
    years: offerYears,
    yearBreakdown,
  });

  if (result.error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground mt-2">{result.error}</p>
        </div>
      </div>
    );
  }

  // Redirect to the session URL
  redirect(
    `/dashboard/negotiate/${targetType}/${targetId}?sessionId=${result.sessionId}`
  );
}
