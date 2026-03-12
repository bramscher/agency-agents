"use client";

import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Division } from "@/types/agent";
import { DIVISION_LABELS, DIVISION_COLORS } from "@/types/agent";

interface DivisionFilterProps {
  divisions: { division: Division; count: number }[];
  selected: Division[];
  onChange: (divisions: Division[]) => void;
}

export function DivisionFilter({
  divisions,
  selected,
  onChange,
}: DivisionFilterProps) {
  const allSelected = selected.length === 0;

  const handleToggleAll = useCallback(() => {
    // Clear all selections to show all divisions
    onChange([]);
  }, [onChange]);

  const handleToggleDivision = useCallback(
    (division: Division) => {
      if (selected.includes(division)) {
        const next = selected.filter((d) => d !== division);
        onChange(next);
      } else {
        onChange([...selected, division]);
      }
    },
    [selected, onChange]
  );

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
        Divisions
      </h3>

      {/* All Divisions toggle */}
      <label
        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
          allSelected ? "bg-accent" : "hover:bg-accent/50"
        }`}
      >
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleToggleAll}
        />
        <span className="text-sm font-medium flex-1">All Divisions</span>
      </label>

      <div className="my-2 h-px bg-border" />

      {/* Individual division toggles */}
      {divisions.map(({ division, count }) => {
        const isActive = selected.includes(division);
        const color = DIVISION_COLORS[division];
        const label = DIVISION_LABELS[division];

        return (
          <label
            key={division}
            className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
              isActive ? "bg-accent" : "hover:bg-accent/50"
            }`}
          >
            <Checkbox
              checked={isActive}
              onCheckedChange={() => handleToggleDivision(division)}
            />
            <span className="text-sm flex-1 truncate">{label}</span>
            <Badge
              variant="secondary"
              className="text-[10px] h-4 px-1.5 tabular-nums"
              style={{
                backgroundColor: `${color}15`,
                color: color,
              }}
            >
              {count}
            </Badge>
          </label>
        );
      })}
    </div>
  );
}
