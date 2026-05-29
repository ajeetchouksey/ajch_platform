import { Routes, Route } from 'react-router-dom';

// ── Home ──────────────────────────────────────────────────────────────────────
import HomeV2 from '@/features/home/pages/HomeV2';

// ── Skill Up (Exams) ──────────────────────────────────────────────────────────
import ExamCatalog from '@/features/exams/pages/ExamCatalog';
import ExamHome from '@/features/exams/pages/ExamHome';
import Quiz from '@/features/exams/pages/Quiz';
import Notes from '@/features/exams/pages/Notes';
import Scenarios from '@/features/exams/pages/Scenarios';
import Progress from '@/features/exams/pages/Progress';

// ── Field Notes (Blog) ────────────────────────────────────────────────────────
import Blog from '@/features/blog/pages/Blog';
import BlogPost from '@/features/blog/pages/BlogPost';

// ── AI Tools ──────────────────────────────────────────────────────────────────
import Tools from '@/features/tools/pages/Tools';
import TokenCounter from '@/features/tools/pages/TokenCounter';
import ContextVisualizer from '@/features/tools/pages/ContextVisualizer';
import McpScaffold from '@/features/tools/pages/McpScaffold';
import SystemPromptBuilder from '@/features/tools/pages/SystemPromptBuilder';
import ModelCostCalc from '@/features/tools/pages/ModelCostCalc';
import ToolSchemaBuilder from '@/features/tools/pages/ToolSchemaBuilder';
import RagChunkVisualizer from '@/features/tools/pages/RagChunkVisualizer';
import PromptTester from '@/features/tools/pages/PromptTester';
import PromptLibrary from '@/features/tools/pages/PromptLibrary';

// ── Docs ──────────────────────────────────────────────────────────────────────
import Docs from '@/features/docs/pages/Docs';

// ── Analytics / Maintainer ────────────────────────────────────────────────────
import Analytics from '@/features/analytics/pages/Analytics';
import Maintainer from '@/features/analytics/pages/Maintainer';
import MaintainerDashboard from '@/features/analytics/pages/MaintainerDashboard';

// ── Profile / Team ────────────────────────────────────────────────────────────
import Profile from '@/features/profile/pages/Profile';
import TeamV2 from '@/features/profile/pages/TeamV2';

// ─────────────────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeV2 />} />

      {/* Skill Up */}
      <Route path="/exams" element={<ExamCatalog />} />
      <Route path="/exams/:examId" element={<ExamHome />} />
      <Route path="/exams/:examId/quiz" element={<Quiz />} />
      <Route path="/exams/:examId/notes" element={<Notes />} />
      <Route path="/exams/:examId/scenarios" element={<Scenarios />} />
      <Route path="/exams/:examId/progress" element={<Progress />} />

      {/* Field Notes */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />

      {/* AI Tools */}
      <Route path="/tools" element={<Tools />} />
      <Route path="/tools/token-counter" element={<TokenCounter />} />
      <Route path="/tools/context-visualizer" element={<ContextVisualizer />} />
      <Route path="/tools/mcp-scaffold" element={<McpScaffold />} />
      <Route path="/tools/system-prompt-builder" element={<SystemPromptBuilder />} />
      <Route path="/tools/model-cost-calc" element={<ModelCostCalc />} />
      <Route path="/tools/tool-schema-builder" element={<ToolSchemaBuilder />} />
      <Route path="/tools/rag-chunk-visualizer" element={<RagChunkVisualizer />} />
      <Route path="/tools/prompt-tester" element={<PromptTester />} />
      <Route path="/tools/prompt-library" element={<PromptLibrary />} />

      {/* Docs */}
      <Route path="/docs" element={<Docs />} />

      {/* Analytics / Maintainer */}
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/maintainer" element={<Maintainer />} />
      <Route path="/maintainer/dashboard" element={<MaintainerDashboard />} />
      <Route path="/maintainer/team" element={<TeamV2 />} />

      {/* Profile / Team */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/team" element={<TeamV2 />} />
    </Routes>
  );
}
