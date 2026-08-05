import { readFileSync, writeFileSync } from 'fs';

const path = 'public/content/skillup/ab731/questions/ab731-domain3.json';
const questions = JSON.parse(readFileSync(path, 'utf8'));

// Remove wrongly-placed d3-013 (correct position is at end)
const base = questions.filter(q => q.id !== 'ab731-d3-013');

const newQuestions = [
  {
    domain: 3,
    id: 'ab731-d3-013',
    scenario: "An organisation's AI governance document states: 'We are committed to fairness, transparency, and accountability in all AI deployments.' The CTO asks: 'What needs to happen next to make this governance document meaningful?'",
    question: 'What step converts governance principles into operational reality?',
    options: [
      'A. Share the principles document with all employees via email',
      'B. Translate principles into specific policies and controls: define what behaviours are permitted/prohibited, assign owners, and establish audit processes',
      'C. Fine-tune the AI models to enforce the principles automatically',
      'D. Hire an external AI ethics consultant to validate the document'
    ],
    correct: 'B',
    explanation: "Governance principles are aspirational statements — they become real only when translated into specific, enforceable policies and controls. For example: Fairness → 'All AI systems used in hiring must pass a bias audit before deployment.' Accountability → 'Every AI output used in a customer-facing decision must be reviewed by a named human owner.' The Microsoft Responsible AI framework explicitly describes the path from principle → policy → controls → monitoring. Sharing a document (A) creates awareness but not enforcement. AI models (C) cannot self-enforce governance principles. External validation (D) is useful but doesn't create internal operational processes.",
    tags: ['ai-governance', 'responsible-ai', 'policies-controls', 'governance-framework']
  },
  {
    domain: 3,
    id: 'ab731-d3-014',
    scenario: 'A manufacturing company invested in three AI projects: (1) an AI that suggests marketing slogans — low business impact, easy to implement; (2) an AI that predicts equipment failures to prevent costly downtime — high business impact, moderate implementation effort; (3) an AI that redesigns the factory floor layout — extremely high potential, 18-month infrastructure project. The board asks: which should have been the top priority?',
    question: 'Which project best represents an AI investment aligned to core business priorities?',
    options: [
      'A. Project 1 — the easiest to implement should always go first to build AI momentum',
      'B. Project 3 — the highest long-term value always justifies upfront investment regardless of timeline',
      'C. Project 2 — high business value (preventing costly downtime) with achievable feasibility makes it the top priority',
      'D. All three simultaneously — parallel AI investment maximises organisational learning'
    ],
    correct: 'C',
    explanation: "Project 2 maps directly to a core business priority (reducing operational costs by preventing downtime) and is achievable within a reasonable timeframe — this is the strategic sweet spot where value and feasibility align. Project 1 (A) is incremental — do it if capacity allows but don't prioritise it over high-value opportunities. Project 3 (B) is a legitimate strategic bet but an 18-month infrastructure dependency means no ROI this year. Parallel investment (D) dilutes focus and budget without ensuring the highest-value project receives the attention it needs.",
    tags: ['business-strategy', 'ai-prioritisation', 'value-feasibility', 'strategic-alignment']
  },
  {
    domain: 3,
    id: 'ab731-d3-015',
    scenario: 'Six months into a company-wide Copilot rollout, adoption is at 28% — well below the 70% target. Interviews reveal three issues: (1) managers feel Copilot threatens their status as subject matter experts; (2) employees face unclear policies on permitted/prohibited uses; (3) IT training covered features but not how Copilot fits into daily workflows. The CEO asks for the top three remediation actions.',
    question: 'Which combination of actions most directly addresses all three identified barriers?',
    options: [
      'A. Upgrade to a more capable model, extend the rollout timeline, and schedule additional IT feature training',
      'B. Leadership storytelling to reframe Copilot as amplifying expertise; publish a clear acceptable use policy; redesign training around actual daily workflows rather than features',
      'C. Make Copilot usage mandatory with daily usage reporting and a leaderboard of top users',
      'D. Roll back to a smaller pilot group until adoption metrics improve, then re-launch'
    ],
    correct: 'B',
    explanation: "Each action in option B directly targets an identified barrier: (1) Manager resistance → leadership storytelling reframes Copilot as amplifying expertise, not replacing it. (2) Unclear policies → an acceptable use policy removes ambiguity and builds confidence. (3) Feature-focused training → workflow-based training (e.g., 'How Copilot changes your Monday morning') creates practical understanding. Mandatory usage + leaderboards (C) creates compliance but not genuine adoption and typically increases resistance. Rolling back (D) signals failure and creates wider uncertainty about the AI programme.",
    tags: ['adoption', 'culture-change', 'change-management', 'acceptable-use-policy', 'training']
  },
  {
    domain: 3,
    id: 'ab731-d3-016',
    scenario: "An organisation scaling AI beyond early pilots plans to create: (A) an AI Council to set strategy and approve high-risk use cases; (B) an AI Centre of Excellence (CoE) staffed with AI engineers who build reusable components and define technical standards; (C) AI Champions embedded in each of 12 business departments. The CEO asks: 'Do we need all three, or is this over-engineering?'",
    question: 'Why does scaling AI at enterprise level typically require all three of these structures?',
    options: [
      'A. They are redundant — the CoE can absorb the functions of both the AI Council and Champions',
      'B. Each serves a distinct layer: the Council governs strategy and risk, the CoE ensures technical quality and reuse, and Champions drive grassroots adoption — removing any one layer creates a gap',
      'C. The AI Council and CoE are sufficient — Champions form naturally without needing a formal programme',
      'D. Only the Champions programme matters at scale — peer adoption is the only lever that works in large organisations'
    ],
    correct: 'B',
    explanation: "The three structures address three distinct challenges: (1) AI Council = WHAT to build and WHETHER to build it — strategy, governance, risk management. (2) CoE = HOW to build it well — technical standards, reusable assets, consistent quality across the organisation. (3) Champions = HOW to get people to use it — peer coaching, grassroots advocacy, surfacing real adoption barriers. Without the Council, AI investments drift from business priorities. Without the CoE, every team reinvents the wheel with inconsistent quality. Without Champions, adoption fails at the human layer. Microsoft's Scale AI framework recommends all three as complementary, not redundant.",
    tags: ['scale-ai', 'ai-council', 'centre-of-excellence', 'champions', 'governance-structure']
  }
];

const final = [...base, ...newQuestions];
writeFileSync(path, JSON.stringify(final, null, 2));
console.log(`Written ${final.length} questions. IDs: ${final.map(q => q.id).join(', ')}`);
