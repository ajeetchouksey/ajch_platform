import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
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
import Profile from "./pages/Profile";
import Maintainer from "./pages/Maintainer";
import MaintainerDashboard from "./pages/MaintainerDashboard";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import { AuthProvider } from "./lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
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
            <Route path="/maintainer" element={<Maintainer />} />
            <Route path="/maintainer/dashboard" element={<MaintainerDashboard />} />
            <Route path="/maintainer/team" element={<Team />} />
            <Route path="/team" element={<Team />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}