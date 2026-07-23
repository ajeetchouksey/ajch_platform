import { Routes, Route, Navigate, useParams } from 'react-router-dom';

// ── Home ──────────────────────────────────────────────────────────────────────
import HomeV2 from '@/features/home/pages/HomeV2';
import Learn from '@/features/home/pages/Learn';

// ── Skill Up (Exams) ──────────────────────────────────────────────────────────
import ExamCatalog from '@/features/exams/pages/ExamCatalog';
import ExamHome from '@/features/exams/pages/ExamHome';
import Quiz from '@/features/exams/pages/Quiz';
import Notes from '@/features/exams/pages/Notes';
import Scenarios from '@/features/exams/pages/Scenarios';
import Progress from '@/features/exams/pages/Progress';
import StudyPlan from '@/features/exams/pages/StudyPlan';

// ── Pathways ──────────────────────────────────────────────────────────────────
import Pathways from '@/features/pathways/pages/Pathways';
import PathwayTrack from '@/features/pathways/pages/PathwayTrack';
import PathwayArticle from '@/features/pathways/pages/PathwayArticle';

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

// ── Interview Prep ────────────────────────────────────────────────────────────
import InterviewCatalog from '@/features/interview/pages/InterviewCatalog';
import InterviewPack from '@/features/interview/pages/InterviewPack';
import InterviewQuestion from '@/features/interview/pages/InterviewQuestion';

// ── Docs ──────────────────────────────────────────────────────────────────────
import Docs from '@/features/docs/pages/Docs';

// ── Analytics / Maintainer ────────────────────────────────────────────────────
import Analytics from '@/features/analytics/pages/Analytics';
import Maintainer from '@/features/analytics/pages/Maintainer';
import MaintainerDashboard from '@/features/analytics/pages/MaintainerDashboard';

// ── Profile / Team ────────────────────────────────────────────────────────────
import Profile from '@/features/profile/pages/Profile';
import TeamV2 from '@/features/profile/pages/TeamV2';import Dashboard from '@/features/profile/pages/Dashboard';
import Contribute from '@/features/community/pages/Contribute';
import Subscribe from '@/pages/Subscribe';import AuthCallback from '@/pages/AuthCallback';// ─────────────────────────────────────────────────────────────────────────────

// Backward-compat redirect helpers for /exams/:examId/* → /skillup/:examId/*
function ExamIdRedirect() {
  const { examId } = useParams<{ examId: string }>();
  return <Navigate to={`/skillup/${examId}`} replace />;
}
function ExamSubRedirect({ sub }: { sub: string }) {
  const { examId } = useParams<{ examId: string }>();
  return <Navigate to={`/skillup/${examId}/${sub}`} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeV2 />} />
      <Route path="/learn" element={<Learn />} />

      {/* Skill Up — primary routes */}
      <Route path="/skillup" element={<ExamCatalog />} />
      <Route path="/skillup/:examId" element={<ExamHome />} />
      <Route path="/skillup/:examId/quiz" element={<Quiz />} />
      <Route path="/skillup/:examId/notes" element={<Notes />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/skillup/:examId/scenarios" element={<Scenarios />} />
      <Route path="/skillup/:examId/progress" element={<Progress />} />
      <Route path="/skillup/:examId/plan" element={<StudyPlan />} />

      {/* /exams → /skillup backward-compat redirects */}
      <Route path="/exams" element={<Navigate to="/skillup" replace />} />
      <Route path="/exams/:examId" element={<ExamIdRedirect />} />
      <Route path="/exams/:examId/quiz" element={<ExamSubRedirect sub="quiz" />} />
      <Route path="/exams/:examId/notes" element={<ExamSubRedirect sub="notes" />} />
      <Route path="/exams/:examId/scenarios" element={<ExamSubRedirect sub="scenarios" />} />
      <Route path="/exams/:examId/progress" element={<ExamSubRedirect sub="progress" />} />

      {/* Horizons */}
      <Route path="/horizons" element={<Pathways />} />
      <Route path="/horizons/:track" element={<PathwayTrack />} />
      <Route path="/horizons/:track/:slug" element={<PathwayArticle />} />

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

      {/* Interview Prep */}
      <Route path="/interview" element={<InterviewCatalog />} />
      <Route path="/interview/q/:id" element={<InterviewQuestion />} />
      <Route path="/interview/:roleId" element={<InterviewPack />} />

      {/* Docs */}
      <Route path="/docs" element={<Docs />} />

      {/* Analytics / Maintainer */}
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/maintainer" element={<Maintainer />} />
      <Route path="/maintainer/dashboard" element={<MaintainerDashboard />} />
      <Route path="/maintainer/team" element={<TeamV2 />} />

      {/* Profile / Team / Dashboard */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/team" element={<TeamV2 />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/contribute" element={<Contribute />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}
