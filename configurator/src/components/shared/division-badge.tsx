import type { Division } from "@/types/agent";
import { DIVISION_LABELS, DIVISION_COLORS } from "@/types/agent";

interface DivisionBadgeProps {
  division: Division;
  className?: string;
}

export function DivisionBadge({ division, className }: DivisionBadgeProps) {
  const label = DIVISION_LABELS[division];
  const color = DIVISION_COLORS[division];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${className ?? ""}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}
