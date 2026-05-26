import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ExamCatalog from "./pages/ExamCatalog";
import CcafHome from "./pages/CcafHome";
import Quiz from "./pages/Quiz";
import Notes from "./pages/Notes";
import Scenarios from "./pages/Scenarios";
import Progress from "./pages/Progress";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Tools from "./pages/Tools";
import Profile from "./pages/Profile";
import Maintainer from "./pages/Maintainer";
import MaintainerDashboard from "./pages/MaintainerDashboard";
import Team from "./pages/Team";
import { AuthProvider } from "./lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exams" element={<ExamCatalog />} />
            <Route path="/exams/ccaf" element={<CcafHome />} />
            <Route path="/exams/ccaf/quiz" element={<Quiz />} />
            <Route path="/exams/ccaf/notes" element={<Notes />} />
            <Route path="/exams/ccaf/scenarios" element={<Scenarios />} />
            <Route path="/exams/ccaf/progress" element={<Progress />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/maintainer" element={<Maintainer />} />
            <Route path="/maintainer/dashboard" element={<MaintainerDashboard />} />
            <Route path="/maintainer/team" element={<Team />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}