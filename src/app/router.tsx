import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy } from 'react';
// ── Home ──────────────────────────────────────────────────────────────────────
const HomeV2 = lazy(() => import('@/features/home/pages/HomeV2'));

// ── Skill Up (Exams) ──────────────────────────────────────────────────────────
const ExamCatalog = lazy(() => import('@/features/exams/pages/ExamCatalog'));
const ExamHome = lazy(() => import('@/features/exams/pages/ExamHome'));
const Quiz = lazy(() => import('@/features/exams/pages/Quiz'));
const Notes = lazy(() => import('@/features/exams/pages/Notes'));
const Scenarios = lazy(() => import('@/features/exams/pages/Scenarios'));
const Progress = lazy(() => import('@/features/exams/pages/Progress'));
const StudyPlan = lazy(() => import('@/features/exams/pages/StudyPlan'));

// ── Pathways ──────────────────────────────────────────────────────────────────
const Pathways = lazy(() => import('@/features/pathways/pages/Pathways'));
const PathwayTrack = lazy(() => import('@/features/pathways/pages/PathwayTrack'));
const PathwayArticle = lazy(() => import('@/features/pathways/pages/PathwayArticle'));

// ── Field Notes (Blog) ────────────────────────────────────────────────────────
const Blog = lazy(()=> import('@/features/blog/pages/Blog'));
const BlogPost = lazy(()=> import ('@/features/blog/pages/BlogPost'));

// ── AI Tools ──────────────────────────────────────────────────────────────────
const Tools =  lazy(()=> import('@/features/tools/pages/Tools'));
const TokenCounter =  lazy(()=> import('@/features/tools/pages/TokenCounter'));
const ContextVisualizer =  lazy(()=> import('@/features/tools/pages/ContextVisualizer'));
const McpScaffold =  lazy(()=> import('@/features/tools/pages/McpScaffold'));
const SystemPromptBuilder = lazy(() => import('@/features/tools/pages/SystemPromptBuilder'));
const ModelCostCalc = lazy(() => import('@/features/tools/pages/ModelCostCalc'));
const ToolSchemaBuilder = lazy(() => import('@/features/tools/pages/ToolSchemaBuilder'));
const RagChunkVisualizer = lazy(() => import('@/features/tools/pages/RagChunkVisualizer'));
const PromptTester = lazy(() => import('@/features/tools/pages/PromptTester'));
const PromptLibrary = lazy(() => import('@/features/tools/pages/PromptLibrary'));

// ── Interview Prep ────────────────────────────────────────────────────────────
const InterviewCatalog = lazy(() => import('@/features/interview/pages/InterviewCatalog'));
const InterviewPack = lazy(() => import('@/features/interview/pages/InterviewPack'));
const InterviewQuestion = lazy(() => import('@/features/interview/pages/InterviewQuestion'));

// ── AI Use Cases ──────────────────────────────────────────────────────────────
const UseCasesCatalog = lazy(() => import('@/features/usecases/pages/UseCasesCatalog'));
const UseCaseDetail = lazy(() => import('@/features/usecases/pages/UseCaseDetail'));

// ── HOL Labs ──────────────────────────────────────────────────────────────────
const HolLabsCatalog = lazy(() => import('@/features/hol-labs/pages/HolLabsCatalog'));
const HolLabDetail = lazy(() => import('@/features/hol-labs/pages/HolLabDetail'));

// ── Docs ──────────────────────────────────────────────────────────────────────
const Docs = lazy(() => import('@/features/docs/pages/Docs'));

// ── Monitoring ───────────────────────────────────────────────────────────────
const Monitoring = lazy(() => import('@/features/monitoring/pages/Monitoring'));

// ── MVP Progress ─────────────────────────────────────────────────────────────
const MvpProgress = lazy(() => import('@/features/mvp/pages/MvpProgress'));

// ── Admin ─────────────────────────────────────────────────────────────────────
const Admin = lazy(() => import('@/features/admin/pages/Admin'));
const YoutubeTracker = lazy(() => import('@/features/admin/pages/YoutubeTracker'));
const IssueBoard = lazy(() => import('@/features/admin/pages/IssueBoard'));
const Reactions = lazy(() => import('@/features/admin/pages/Reactions'));
const CommentModeration = lazy(() => import('@/features/admin/pages/CommentModeration'));

// ── Maintainer ─────────────────────────────────────────────────────────────────
const Maintainer = lazy(() => import('@/features/analytics/pages/Maintainer'));
const MaintainerDashboard = lazy(() => import('@/features/analytics/pages/MaintainerDashboard'));

// ── Profile / Team ────────────────────────────────────────────────────────────
const Profile = lazy(() => import('@/features/profile/pages/Profile'));
const TeamV2 = lazy(() => import('@/features/profile/pages/TeamV2'));
const Dashboard = lazy(() => import('@/features/profile/pages/Dashboard'));
const Contribute = lazy(() => import('@/features/community/pages/Contribute'));
const Subscribe = lazy(() => import('@/pages/Subscribe'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
// ─────────────────────────────────────────────────────────────────────────────

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
      <Route path="/learn" element={<Navigate to="/discovery" replace />} />

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

      {/* Discovery */}
      <Route path="/discovery" element={<Pathways />} />
      <Route path="/discovery/:track" element={<PathwayTrack />} />
      <Route path="/discovery/:track/:slug" element={<PathwayArticle />} />

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
      <Route path="/roleprep" element={<InterviewCatalog />} />
      <Route path="/roleprep/q/:id" element={<InterviewQuestion />} />
      <Route path="/roleprep/:roleId" element={<InterviewPack />} />

      {/* AI Use Cases */}
      <Route path="/usecases" element={<UseCasesCatalog />} />
      <Route path="/usecases/:id" element={<UseCaseDetail />} />

      {/* HOL Labs */}
      <Route path="/hol-labs" element={<HolLabsCatalog />} />
      <Route path="/hol-labs/:id" element={<HolLabDetail />} />

      {/* Docs */}
      <Route path="/docs" element={<Docs />} />

      {/* Monitoring */}
      <Route path="/monitoring" element={<Monitoring />} />

      {/* Admin — owner-only section */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/mvp" element={<MvpProgress />} />
      <Route path="/admin/monitoring" element={<Monitoring />} />
      <Route path="/admin/youtube" element={<YoutubeTracker />} />
      <Route path="/admin/issues" element={<IssueBoard />} />
      <Route path="/admin/reactions" element={<Reactions />} />
      <Route path="/admin/comments" element={<CommentModeration />} />

      {/* Legacy redirects */}
      <Route path="/mvp-progress" element={<Navigate to="/admin/mvp" replace />} />

      {/* Analytics / Maintainer */}
      <Route path="/analytics" element={<Navigate to="/monitoring" replace />} />
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
