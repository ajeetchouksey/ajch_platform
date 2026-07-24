import type { BadgeVariant } from '@/components/ui/Badge';

export const VERTICAL_LABEL: Record<string, string> = {
  'insurance':         'Insurance',
  'government':        'Government',
  'wealth-management': 'Wealth Mgmt',
  'education':         'Education',
  'private-lending':   'Private Lending',
  'banking':           'Banking',
  'industrials':       'Industrials',
  'gtm':               'Go-To-Market',
  'operations':        'Operations',
  'real-estate':       'Real Estate',
  'legal':             'Legal',
  'compliance':        'Compliance',
};

export const VERTICAL_ACCENT: Record<string, BadgeVariant> = {
  'insurance':         'blue',
  'government':        'slate',
  'wealth-management': 'amber',
  'education':         'violet',
  'private-lending':   'emerald',
  'banking':           'blue',
  'industrials':       'amber',
  'gtm':               'violet',
  'operations':        'rose',
  'real-estate':       'emerald',
  'legal':             'purple',
  'compliance':        'rose',
};

export const PATTERN_LABEL: Record<string, string> = {
  'document-rag':                    'Document RAG',
  'trigger-extract-validate-route':  'Trigger → Route',
  'research-synthesize-generate':    'Research → Generate',
  'parallel-subagents':              'Parallel Subagents',
  'hitl-approval-gate':              'HITL Gate',
  'document-eval-structured-output': 'Doc Eval',
};

export const PATTERN_BADGE: Record<string, BadgeVariant> = {
  'document-rag':                    'blue',
  'trigger-extract-validate-route':  'amber',
  'research-synthesize-generate':    'violet',
  'parallel-subagents':              'purple',
  'hitl-approval-gate':              'rose',
  'document-eval-structured-output': 'emerald',
};

export const ALL_PATTERNS = Object.keys(PATTERN_LABEL);
export const ALL_VERTICALS = Object.keys(VERTICAL_LABEL);
