import type { BadgeVariant } from '@/components/ui/Badge';
import type { AccentKey } from '@/components/ui/GlassCard';
import type { HolLabCostEstimate } from '@/lib/content-loader';

export const DOMAIN_LABELS: Record<string, string> = {
  'azure-ai-foundry': 'Azure AI Foundry',
  'github-copilot': 'GitHub Copilot',
  'agentic-ai': 'Agentic AI',
  'ai-architecture': 'AI Architecture',
  'ai-engineering': 'AI Engineering',
};

// Shared with GlassCard's accent prop and Badge's variant prop — kept to the
// palette both already support so a domain's color is consistent everywhere
// it appears (filter chip, card accent strip, badge).
export const DOMAIN_ACCENT: Record<string, AccentKey> = {
  'azure-ai-foundry': 'blue',
  'github-copilot': 'emerald',
  'agentic-ai': 'violet',
  'ai-architecture': 'amber',
  'ai-engineering': 'rose',
};

export const COST_TIER_VARIANT: Record<HolLabCostEstimate['tier'], BadgeVariant> = {
  free: 'emerald',
  'low-cost': 'blue',
  paid: 'amber',
};

export const COST_TIER_LABEL: Record<HolLabCostEstimate['tier'], string> = {
  free: 'Free',
  'low-cost': 'Low-cost',
  paid: 'Paid',
};

export const RELATION_LABEL: Record<'prerequisite' | 'next' | 'alternative', string> = {
  prerequisite: 'Prerequisite Lab',
  next: 'Next Lab',
  alternative: 'Related Lab',
};
