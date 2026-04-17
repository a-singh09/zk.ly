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
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
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
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/reviewers"
              element={
                <AdminLayout>
                  <AdminReviewers />
                </AdminLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </MidnightWalletProvider>
    </NotificationProvider>
  );
}

export default App;
