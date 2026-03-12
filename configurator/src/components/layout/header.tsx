"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar";
import { useAgentSelection } from "@/lib/store/agent-selection";

/** Derive a human-readable page title from the current pathname. */
function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return "Home";

  const titleMap: Record<string, string> = {
    configurator: "Browse Agents",
    profiles: "Profiles",
    customize: "Customize",
    deploy: "Deploy",
    "mission-control": "Mission Control",
    agents: "Agents",
    pipeline: "Pipeline",
    tasks: "Tasks",
    handoffs: "Handoffs",
    metrics: "Metrics",
    dashboard: "Dashboard",
  };

  // Use the last meaningful segment for the title
  const lastSegment = segments[segments.length - 1];
  return titleMap[lastSegment] ?? lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Header() {
  const pathname = usePathname();
  const count = useAgentSelection((s) => s.count());
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="lg:hidden" />
          }
        >
          <Menu className="size-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <h1 className="text-lg font-semibold">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Selected agents count badge */}
      {count > 0 && (
        <Link href="/configurator/customize">
          <Badge variant="secondary" className="gap-1.5 cursor-pointer">
            {count} agent{count !== 1 ? "s" : ""} selected
          </Badge>
        </Link>
      )}
    </header>
  );
}
