import prisma from "@/lib/prisma";
import { getArticles } from "./actions";
import { Badge } from "@/components/ui/badge";

export default async function NewsPage() {
  const season = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { year: "desc" },
  });

  if (!season) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-2">League News</h1>
        <p className="text-muted-foreground">No active season.</p>
      </div>
    );
  }

  const articles = await getArticles(season.id);

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">League News</h1>
        <p className="text-muted-foreground">{season.year} Season</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No articles yet. News will appear here as the season unfolds.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y">
          {articles.map((article) => (
            <article key={article.id} className="py-6 first:pt-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={article.type === "ROUND_WRAP" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {article.type === "ROUND_WRAP" ? "Round Wrap" : "Power Rankings"}
                </Badge>
                {article.roundNumber && (
                  <span className="text-xs text-muted-foreground">
                    Round {article.roundNumber}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(article.createdAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-3">{article.headline}</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {article.body.split("\n").map((paragraph, i) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return null;
                  return <p key={i} className="mb-2 last:mb-0">{trimmed}</p>;
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
