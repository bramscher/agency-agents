"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  UserCog,
  Rocket,
  BarChart3,
  Bot,
  GitBranch,
  ListChecks,
  ArrowRightLeft,
  Activity,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const configuratorLinks: NavItem[] = [
  { label: "Browse Agents", href: "/configurator", icon: Compass },
  { label: "Profiles", href: "/configurator/profiles", icon: Users },
  { label: "Customize", href: "/configurator/customize", icon: UserCog },
  { label: "Deploy", href: "/configurator/deploy", icon: Rocket },
];

const missionControlLinks: NavItem[] = [
  { label: "Dashboard", href: "/mission-control", icon: LayoutGrid },
  { label: "Agents", href: "/mission-control/agents", icon: Bot },
  { label: "Pipeline", href: "/mission-control/pipeline", icon: GitBranch },
  { label: "Tasks", href: "/mission-control/tasks", icon: ListChecks },
  { label: "Handoffs", href: "/mission-control/handoffs", icon: ArrowRightLeft },
  { label: "Metrics", href: "/mission-control/metrics", icon: Activity },
];

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      {items.map((item) => {
        const isActive =
          item.href === pathname ||
          (item.href !== "/configurator" &&
            item.href !== "/mission-control" &&
            pathname.startsWith(item.href));

        // Handle exact match for section root routes
        const isExactRoot =
          (item.href === "/configurator" || item.href === "/mission-control") &&
          pathname === item.href;

        const active = isExactRoot || isActive;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Title */}
      <div className="flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="size-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">The Agency</span>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-auto">
        <nav className="flex flex-col gap-6 p-3">
          <NavSection
            title="Configurator"
            items={configuratorLinks}
            pathname={pathname}
          />
          <NavSection
            title="Mission Control"
            items={missionControlLinks}
            pathname={pathname}
          />
        </nav>
      </ScrollArea>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
      <SidebarContent />
    </aside>
  );
}
