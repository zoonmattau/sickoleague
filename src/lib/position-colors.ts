// Position color coding for AFL fantasy positions
// DEF = Blue, MID = Green, RUC = Purple, FWD = Red
export const POSITION_COLORS: Record<string, { bg: string; text: string; border: string; solid: string; combined: string }> = {
  DEF: {
    bg: "bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    solid: "bg-blue-600",
    combined: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  MID: {
    bg: "bg-green-500/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/30",
    solid: "bg-green-600",
    combined: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  },
  RUC: {
    bg: "bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    solid: "bg-purple-600",
    combined: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
  FWD: {
    bg: "bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    solid: "bg-red-600",
    combined: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
};

export function getPositionColorClasses(position: string): string {
  const colors = POSITION_COLORS[position];
  if (!colors) return "bg-muted text-muted-foreground";
  return `${colors.bg} ${colors.text}`;
}

export function getPositionCombinedClasses(position: string): string {
  return POSITION_COLORS[position]?.combined ?? "bg-muted text-muted-foreground";
}

export function getPositionSolidColor(position: string): string {
  return POSITION_COLORS[position]?.solid ?? "bg-muted";
}
