import Link from "next/link";
import { ArrowRight, Rocket, Building2, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const profileCards = [
  {
    icon: Rocket,
    name: "Venture Studio Builder",
    description:
      "Full-stack engineering, design, testing, and DevOps agents for building and shipping software products fast.",
    agentCount: 32,
    color: "#3B82F6",
  },
  {
    icon: Building2,
    name: "Property Management Company",
    description:
      "Marketing, support, and operational agents for tenant management, social media, and property business operations.",
    agentCount: 24,
    color: "#10B981",
  },
  {
    icon: Clapperboard,
    name: "Konmashi Content Machine",
    description:
      "Content creation, social media, marketing, and paid media agents for high-volume AI avatar video production.",
    agentCount: 28,
    color: "#F97316",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          The Agency{" "}
          <span className="text-muted-foreground">
            - OpenClaw Configurator
          </span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Configure and deploy AI agent teams for your business
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" render={<Link href="/configurator" />}>
            Configure Agents
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            render={<Link href="/mission-control" />}
          >
            Mission Control
          </Button>
        </div>
      </div>

      {/* Profile Template Cards */}
      <div className="mt-16 grid w-full max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {profileCards.map((profile) => (
          <Card key={profile.name} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${profile.color}20` }}
                >
                  <profile.icon
                    className="size-5"
                    style={{ color: profile.color }}
                  />
                </div>
                <div className="flex-1">
                  <CardTitle>{profile.name}</CardTitle>
                </div>
              </div>
              <CardDescription className="mt-2">
                {profile.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <Badge variant="secondary">
                {profile.agentCount} agents
              </Badge>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                render={<Link href="/configurator/profiles" />}
              >
                Use This Profile
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
