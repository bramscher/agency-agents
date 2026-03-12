"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAgentSelection } from "@/lib/store/agent-selection";
import type { Agent } from "@/types/agent";
import { DIVISION_LABELS, DIVISION_COLORS } from "@/types/agent";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { isSelected, toggleAgent } = useAgentSelection();
  const selected = isSelected(agent.slug);

  const handleClick = useCallback(() => {
    toggleAgent(agent);
  }, [agent, toggleAgent]);

  // Prevent the checkbox click from double-toggling via the card handler
  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
    },
    []
  );

  const handleCheckedChange = useCallback(() => {
    toggleAgent(agent);
  }, [agent, toggleAgent]);

  const divisionColor = DIVISION_COLORS[agent.division];
  const divisionLabel = DIVISION_LABELS[agent.division];

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-150 border-l-4 ${
        selected
          ? "bg-accent/50 ring-2 ring-primary/20"
          : "hover:bg-accent/30"
      }`}
      style={{ borderLeftColor: agent.color }}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 px-4">
        {/* Emoji */}
        <span className="text-2xl leading-none mt-0.5 shrink-0" aria-hidden="true">
          {agent.emoji}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm leading-snug truncate">
            {agent.name}
          </div>

          <Badge
            variant="secondary"
            className="mt-1 text-[10px] h-4 px-1.5"
            style={{
              backgroundColor: `${divisionColor}15`,
              color: divisionColor,
              borderColor: `${divisionColor}30`,
            }}
          >
            {divisionLabel}
          </Badge>

          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {agent.vibe}
          </p>
        </div>

        {/* Checkbox */}
        <div className="shrink-0 mt-0.5" onClick={handleCheckboxClick}>
          <Checkbox
            checked={selected}
            onCheckedChange={handleCheckedChange}
          />
        </div>
      </div>
    </Card>
  );
}
