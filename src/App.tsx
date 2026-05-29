import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomeV2 from "./pages/HomeV2";
import ExamCatalog from "./pages/ExamCatalog";
import ExamHome from "./pages/ExamHome";
import Quiz from "./pages/Quiz";
import Notes from "./pages/Notes";
import Scenarios from "./pages/Scenarios";
import Progress from "./pages/Progress";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Tools from "./pages/Tools";
import TokenCounter from "./pages/TokenCounter";
import ContextVisualizer from "./pages/ContextVisualizer";
import McpScaffold from "./pages/McpScaffold";
import SystemPromptBuilder from "./pages/SystemPromptBuilder";
import ModelCostCalc from "./pages/ModelCostCalc";
import ToolSchemaBuilder from "./pages/ToolSchemaBuilder";import RagChunkVisualizer from './pages/RagChunkVisualizer';
import PromptTester from './pages/PromptTester';
import PromptLibrary from './pages/PromptLibrary';import Profile from "./pages/Profile";
import Maintainer from "./pages/Maintainer";
import MaintainerDashboard from "./pages/MaintainerDashboard";
import TeamV2 from "./pages/TeamV2";
import Analytics from "./pages/Analytics";
import Docs from "./pages/Docs";
import { AuthProvider } from "./lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeV2 />} />
            <Route path="/exams" element={<ExamCatalog />} />
            <Route path="/exams/:examId" element={<ExamHome />} />
            <Route path="/exams/:examId/quiz" element={<Quiz />} />
            <Route path="/exams/:examId/notes" element={<Notes />} />
            <Route path="/exams/:examId/scenarios" element={<Scenarios />} />
            <Route path="/exams/:examId/progress" element={<Progress />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
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
            <Route path="/maintainer" element={<Maintainer />} />
            <Route path="/maintainer/dashboard" element={<MaintainerDashboard />} />
            <Route path="/maintainer/team" element={<TeamV2 />} />
            <Route path="/team" element={<TeamV2 />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/docs" element={<Docs />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}