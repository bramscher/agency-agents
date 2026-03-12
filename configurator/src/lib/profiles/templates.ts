import type { ProfileTemplate } from "@/types/profile";

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    id: "venture-studio",
    name: "Venture Studio Builder",
    description:
      "For building and deploying software products — apps, SaaS, tools. Full-stack engineering, design, testing, and DevOps agents working through NEXUS Sprint phases to ship fast.",
    icon: "🚀",
    color: "#3B82F6",
    agentSlugs: [
      // Engineering (8)
      "frontend-developer",
      "backend-architect",
      "ai-engineer",
      "devops-automator",
      "mobile-app-builder",
      "rapid-prototyper",
      "senior-developer",
      "security-engineer",
      // Design (5)
      "ui-designer",
      "ux-architect",
      "ux-researcher",
      "brand-guardian",
      "visual-storyteller",
      // Product (3)
      "sprint-prioritizer",
      "feedback-synthesizer",
      "trend-researcher",
      // Project Management (4)
      "studio-producer",
      "project-shepherd",
      "studio-operations",
      "senior-project-manager",
      // Testing (6)
      "evidence-collector",
      "reality-checker",
      "api-tester",
      "performance-benchmarker",
      "test-results-analyzer",
      "workflow-optimizer",
      // Support (4)
      "analytics-reporter",
      "infrastructure-maintainer",
      "finance-tracker",
      "executive-summary-generator",
      // Specialized (2)
      "agents-orchestrator",
      "data-analytics-reporter",
    ],
    defaultNexusMode: "sprint",
    primaryPhases: [1, 2, 3, 4],
    interAgentEnabled: true,
    defaultModel: "claude-sonnet-4-20250514",
    tags: ["software", "saas", "apps", "deployment", "full-stack"],
  },
  {
    id: "property-management",
    name: "Property Management Company",
    description:
      "Owner/tenant management, social media, blog writing, document management, and referral programs. Marketing, support, and operational agents for ongoing property business needs.",
    icon: "🏠",
    color: "#10B981",
    agentSlugs: [
      // Marketing (6)
      "content-creator",
      "social-media-strategist",
      "seo-specialist",
      "instagram-curator",
      "growth-hacker",
      "carousel-growth-engine",
      // Support (6)
      "support-responder",
      "analytics-reporter",
      "finance-tracker",
      "legal-compliance-checker",
      "executive-summary-generator",
      "infrastructure-maintainer",
      // Engineering (4)
      "frontend-developer",
      "backend-architect",
      "devops-automator",
      "technical-writer",
      // Design (3)
      "ui-designer",
      "ux-architect",
      "brand-guardian",
      // Product (2)
      "feedback-synthesizer",
      "sprint-prioritizer",
      // Project Management (2)
      "senior-project-manager",
      "studio-operations",
      // Specialized (1)
      "accounts-payable-agent",
    ],
    defaultNexusMode: "micro",
    primaryPhases: [5, 6],
    interAgentEnabled: true,
    defaultModel: "claude-sonnet-4-20250514",
    tags: [
      "property",
      "real-estate",
      "tenant",
      "social-media",
      "referrals",
    ],
  },
  {
    id: "konmashi-content-machine",
    name: "Konmashi Content Machine",
    description:
      "AI avatar video production agency with per-industry SME (Subject Matter Expert) agents. Content creation, social media, marketing, and paid media agents for high-volume content operations.",
    icon: "🎬",
    color: "#F97316",
    agentSlugs: [
      // Marketing (10)
      "content-creator",
      "social-media-strategist",
      "tiktok-strategist",
      "instagram-curator",
      "twitter-engager",
      "reddit-community-builder",
      "growth-hacker",
      "app-store-optimizer",
      "carousel-growth-engine",
      "bilibili-content-strategist",
      // Design (5)
      "visual-storyteller",
      "brand-guardian",
      "image-prompt-engineer",
      "ui-designer",
      "whimsy-injector",
      // Paid Media (4)
      "creative-strategist",
      "paid-social-strategist",
      "ppc-campaign-strategist",
      "tracking-measurement-specialist",
      // Support (3)
      "analytics-reporter",
      "executive-summary-generator",
      "finance-tracker",
      // Product (2)
      "trend-researcher",
      "feedback-synthesizer",
      // Project Management (2)
      "studio-producer",
      "experiment-tracker",
      // Specialized (2)
      "cultural-intelligence-strategist",
      "data-analytics-reporter",
    ],
    defaultNexusMode: "sprint",
    primaryPhases: [0, 5, 6],
    interAgentEnabled: true,
    defaultModel: "claude-sonnet-4-20250514",
    tags: [
      "content",
      "video",
      "ai-avatar",
      "social-media",
      "agency",
      "sme",
    ],
  },
];

export function getProfileTemplate(id: string): ProfileTemplate | undefined {
  return PROFILE_TEMPLATES.find((p) => p.id === id);
}
