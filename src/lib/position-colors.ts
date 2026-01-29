// Position color coding for AFL fantasy positions
export const POSITION_COLORS: Record<string, { bg: string; text: string }> = {
  DEF: { bg: "bg-blue-500/20", text: "text-blue-600" },
  MID: { bg: "bg-green-500/20", text: "text-green-600" },
  RUC: { bg: "bg-purple-500/20", text: "text-purple-600" },
  FWD: { bg: "bg-orange-500/20", text: "text-orange-600" },
};

export function getPositionColorClasses(position: string): string {
  const colors = POSITION_COLORS[position];
  if (!colors) return "bg-muted text-muted-foreground";
  return `${colors.bg} ${colors.text}`;
}
