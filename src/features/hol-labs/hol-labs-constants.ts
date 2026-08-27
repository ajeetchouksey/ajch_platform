import type { BadgeVariant } from '@/components/ui/Badge';
import type { HolLabCostEstimate } from '@/lib/content-loader';

export const DOMAIN_LABELS: Record<string, string> = {
  'azure-ai-foundry': 'Azure AI Foundry',
  'github-copilot': 'GitHub Copilot',
  'agentic-ai': 'Agentic AI',
  'ai-architecture': 'AI Architecture',
  'ai-engineering': 'AI Engineering',
};

export const COST_TIER_VARIANT: Record<HolLabCostEstimate['tier'], BadgeVariant> = {
  free: 'emerald',
  'low-cost': 'blue',
  paid: 'amber',
};

export const RELATION_LABEL: Record<'prerequisite' | 'next' | 'alternative', string> = {
  prerequisite: 'Prerequisite Lab',
  next: 'Next Lab',
  alternative: 'Related Lab',
};
