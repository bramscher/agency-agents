"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentSelection } from "@/lib/store/agent-selection";
import { ChevronUp, ChevronDown, X, ArrowRight, Trash2 } from "lucide-react";

export function SelectionCart() {
  const { getSelectedArray, removeAgent, clearAll, count } =
    useAgentSelection();
  const [expanded, setExpanded] = useState(false);

  const selectedCount = count();
  const selectedAgents = getSelectedArray();

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleRemove = useCallback(
    (slug: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeAgent(slug);
    },
    [removeAgent]
  );

  const handleClearAll = useCallback(() => {
    clearAll();
    setExpanded(false);
  }, [clearAll]);

  // Do not render when nothing is selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]">
      <div className="rounded-xl border bg-card text-card-foreground shadow-lg ring-1 ring-foreground/5 overflow-hidden">
        {/* Expanded agent list */}
        {expanded && (
          <div className="border-b">
            <ScrollArea className="max-h-64">
              <div className="p-3 space-y-1">
                {selectedAgents.map((agent) => (
                  <div
                    key={agent.slug}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 group"
                  >
                    <span className="text-base shrink-0" aria-hidden="true">
                      {agent.emoji}
                    </span>
                    <span className="flex-1 truncate">{agent.name}</span>
                    <button
                      onClick={(e) => handleRemove(agent.slug, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${agent.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions inside expanded area */}
            <div className="flex items-center gap-2 px-3 pb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5 mr-1" />
                Clear All
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                render={<Link href="/configurator/customize" />}
              >
                Continue
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed header bar -- always visible */}
        <button
          onClick={toggleExpanded}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/30 transition-colors"
        >
          <Badge variant="default" className="tabular-nums">
            {selectedCount}
          </Badge>
          <span className="flex-1 text-left">
            {selectedCount === 1 ? "agent selected" : "agents selected"}
          </span>
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
