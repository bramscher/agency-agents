"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  UsersRound,
  LogIn,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";

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

const teamLinks: NavItem[] = [
  { label: "My Teams", href: "/teams", icon: UsersRound },
];

const missionControlLinks: NavItem[] = [
  { label: "Dashboard", href: "/mission-control", icon: LayoutGrid },
  { label: "Agents", href: "/mission-control/agents", icon: Bot },
  { label: "Pipeline", href: "/mission-control/pipeline", icon: GitBranch },
  { label: "Tasks", href: "/mission-control/tasks", icon: ListChecks },
  { label: "Handoffs", href: "/mission-control/handoffs", icon: ArrowRightLeft },
  { label: "Metrics", href: "/mission-control/metrics", icon: Activity },
];

const sectionRoots = ["/configurator", "/mission-control", "/teams"];

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
        const isExactRoot =
          sectionRoots.includes(item.href) && pathname === item.href;
        const isActive =
          isExactRoot ||
          (!sectionRoots.includes(item.href) &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
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

function UserSection() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!email) {
    return (
      <div className="p-3 border-t border-border">
        <Link
          href="/auth/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogIn className="size-4 shrink-0" />
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-border">
      <div className="flex items-center gap-3 px-3 py-1">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary shrink-0">
          {email[0].toUpperCase()}
        </div>
        <span className="flex-1 text-xs text-muted-foreground truncate">
          {email}
        </span>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.refresh();
          }}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Sign out"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
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
          <NavSection title="Teams" items={teamLinks} pathname={pathname} />
          <NavSection
            title="Mission Control"
            items={missionControlLinks}
            pathname={pathname}
          />
        </nav>
      </ScrollArea>

      {/* User section at bottom */}
      <UserSection />
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
