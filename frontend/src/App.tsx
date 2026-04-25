import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import SpaceBrowser from "./pages/SpaceBrowser";
import SprintDashboard from "./pages/SprintDashboard";
import QuestClaim from "./pages/QuestClaim";
import CertExplorer from "./pages/CertExplorer";
import ProfileCard from "./pages/ProfileCard";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReviewers from "./pages/AdminReviewers";
import AiAgentsMarketplace from "./pages/AiAgentsMarketplace";
import SpaceDetail from "./pages/SpaceDetail";
import QuestManagement from "./pages/QuestManagement";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import AdminGuard from "./components/AdminGuard";
import { NotificationProvider } from "./lib/NotificationContext";
import { MidnightWalletProvider } from "./lib/MidnightWalletContext";

function App() {
  return (
    <NotificationProvider>
      <MidnightWalletProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route
              path="/spaces"
              element={
                <AppLayout>
                  <SpaceBrowser />
                </AppLayout>
              }
            />
            <Route
              path="/spaces/:id"
              element={
                <AppLayout>
                  <SprintDashboard />
                </AppLayout>
              }
            />
            <Route
              path="/spaces/:id/claim/:questId"
              element={
                <AppLayout>
                  <QuestClaim />
                </AppLayout>
              }
            />
            <Route
              path="/proof/:certId"
              element={
                <AppLayout>
                  <CertExplorer />
                </AppLayout>
              }
            />
            <Route
              path="/profile/:key"
              element={
                <AppLayout>
                  <ProfileCard />
                </AppLayout>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <AppLayout>
                  <Leaderboard />
                </AppLayout>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="/admin/reviewers"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <AdminReviewers />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="/admin/ai-agents/marketplace"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <AiAgentsMarketplace />
                  </AdminLayout>
                </AdminGuard>
              }
            />

            {/* Space and Quest Management Routes */}
            <Route
              path="/spaces/:spaceId/manage"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <SpaceDetail />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="/spaces/:spaceId/quests/new"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <QuestManagement />
                  </AdminLayout>
                </AdminGuard>
              }
            />
            <Route
              path="/spaces/:spaceId/quests/:questId/edit"
              element={
                <AdminGuard>
                  <AdminLayout>
                    <QuestManagement />
                  </AdminLayout>
                </AdminGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </MidnightWalletProvider>
    </NotificationProvider>
  );
}

export default App;
